import { createLogger, format, transports } from "winston";
import type { TransformableInfo } from "logform";
import path from "path";
import chalk, { ChalkInstance } from "chalk";
import { dbFunctions } from "~/core/database";
import wrapAnsi from "wrap-ansi";
import { logToClients } from "~/routes/live-logs";
import type { logStreamData } from "~/typings/websocket";

const padNewlines = process.env.PAD_NEW_LINES !== "false";

type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "debug"
  | "verbose"
  | "silly"
  | "task"
  | "ut";

interface CustomTransformableInfo extends TransformableInfo {
  file: string;
  line: number;
}

type LogStreamData = Omit<logStreamData, "message"> & {
  message: string;
};

const ansiRegex = /\x1B\[[0-?9;]*[mG]/g;

const formatTerminalMessage = (message: string, prefix: string): string => {
  try {
    const cleanPrefix = prefix.replace(ansiRegex, "");
    const maxWidth = process.stdout.columns || 80;
    const wrapWidth = Math.max(maxWidth - cleanPrefix.length - 3, 20);

    if (!padNewlines) return message;

    const wrapped = wrapAnsi(message, wrapWidth, {
      trim: true,
      hard: true,
      wordWrap: true,
    });

    return wrapped
      .split("\n")
      .map((line, index) => {
        return index === 0 ? line : `${" ".repeat(cleanPrefix.length)}${line}`;
      })
      .join("\n");
  } catch (error) {
    console.error("Error formatting terminal message:", error);
    return message;
  }
};

const levelColors: Record<LogLevel | string, ChalkInstance> = {
  error: chalk.red.bold,
  warn: chalk.yellow.bold,
  info: chalk.green.bold,
  debug: chalk.blue.bold,
  verbose: chalk.cyan.bold,
  silly: chalk.magenta.bold,
  task: chalk.cyan.bold,
  ut: chalk.hex("#9D00FF"),
};

const handleWebSocketLog = (
  level: string,
  timestamp: string,
  message: string,
  file: string,
  line: number,
) => {
  try {
    const data = {
      timestamp,
      level: level,
      message: message,
      file: file,
      line: line,
    };

    logToClients(data);
  } catch (error) {
    console.error(
      `WebSocket logging failed: ${error instanceof Error ? error.message : error}`,
    );
  }
};

const handleDatabaseLog = (
  level: string,
  timestamp: string,
  message: string,
  file: string,
  line: number,
): void => {
  try {
    const data = {
      timestamp,
      level,
      message,
      file: file,
      line: line,
    };

    dbFunctions.addLogEntry(data);
  } catch (error) {
    console.error(
      `Database logging failed: ${error instanceof Error ? error.message : error}`,
    );
  }
};

// Main logger
export const logger = createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: format.combine(
    format.timestamp({ format: "DD/MM HH:mm:ss" }),
    format((info) => {
      const stack = new Error().stack?.split("\n");
      let file = "unknown";
      let line = 0;

      if (stack) {
        for (let i = 2; i < stack.length; i++) {
          const lineStr = stack[i].trim();
          if (
            !lineStr.includes("node_modules") &&
            !lineStr.includes(path.basename(__filename))
          ) {
            const matches = lineStr.match(/\(?(.+):(\d+):(\d+)\)?$/);
            if (matches) {
              file = path.basename(matches[1]);
              line = parseInt(matches[2], 10);
              break;
            }
          }
        }
      }
      return { ...info, file, line };
    })(),
    format.printf((info) => {
      const { timestamp, level, message, file, line } =
        info as CustomTransformableInfo;
      let processedLevel = level as LogLevel;
      let processedMessage = String(message);

      if (processedMessage.startsWith("__task__")) {
        processedMessage = processedMessage
          .replace(/__task__/g, "")
          .trimStart();
        processedLevel = "task";
        if (processedMessage.startsWith("__db__")) {
          processedMessage = processedMessage
            .replace(/__db__/g, "")
            .trimStart();
          processedMessage = `${chalk.magenta("DB")} ${processedMessage}`;
        }
      } else if (processedMessage.startsWith("__UT__")) {
        processedMessage = processedMessage.replace(/__UT__/g, "").trimStart();
        processedLevel = "ut";
      }

      if (file.endsWith("plugin.ts")) {
        processedMessage = `[ ${chalk.greenBright("Plugin")} ] ${processedMessage}`;
      }

      const paddedLevel = processedLevel.toUpperCase().padEnd(5);
      const coloredLevel = (levelColors[processedLevel] || chalk.white)(
        paddedLevel,
      );
      const coloredContext = chalk.cyan(`${file}:${line}`);
      const coloredTimestamp = chalk.yellow(timestamp);

      const prefix = `${paddedLevel} [ ${timestamp} ] - `;
      const formattedMessage = padNewlines
        ? formatTerminalMessage(processedMessage, prefix)
        : processedMessage;

      handleDatabaseLog(
        coloredTimestamp.replace(ansiRegex, "").trim(),
        coloredLevel.replace(ansiRegex, "").trim(),
        processedMessage.replace(ansiRegex, "").trim(),
        file.trim(),
        line,
      );
      handleWebSocketLog(
        coloredLevel.replace(ansiRegex, "").trim(),
        coloredTimestamp.replace(ansiRegex, "").trim(),
        processedMessage.replace(ansiRegex, "").trim(),
        file.trim(),
        line,
      );

      return `${coloredLevel} [ ${coloredTimestamp} ] - ${formattedMessage} - [ ${coloredContext} ]`;
    }),
  ),
  transports: [new transports.Console()],
});
