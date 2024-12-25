import { createLogger, format, transports } from "winston";

const gray = "\x1b[90m";
const reset = "\x1b[0m";
const white = "\x1b[97m";
const red = "\x1b[31m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const blue = "\x1b[34m";
const pink = "\x1b[38;5;213m"; // Pink color for sync logs

const ignoreExitListenerLogs = format((info) => {
  if (
    typeof info.message === "string" &&
    info.message.includes("Exit listeners detected")
  ) {
    return false; // Silences annoying logs
  }
  return info;
});

function colorLog(level: string, levelName: string) {
  switch (level) {
    case "info":
      return `${green}${levelName}${reset}`;
    case "debug":
      return `${blue}${levelName}${reset}`;
    case "error":
      return `${red}${levelName}${reset}`;
    case "warn":
      return `${yellow}${levelName}${reset}`;
    default:
      return `${gray}UNKNOWN${reset}`;
  }
}

const logger = createLogger({
  level: "debug",
  format: format.combine(
    ignoreExitListenerLogs(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf((info) => {
      const level = info.level.toUpperCase().padEnd(5, " ");
      const timestamp = `${gray}${info.timestamp}${reset}`;
      const levelColorized = colorLog(info.level.toLowerCase(), level);
      const message = `${white}${info.message}${reset}`;

      return `${timestamp} ${levelColorized} : ${message}`;
    }),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/app.log" }),
  ],
});

export default logger;
