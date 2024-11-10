import winston from "winston";
import loggerConfig from "../config/loggerConfig.js";

const transports = [new winston.transports.Console()];

transports.push(
  new winston.transports.File({
    filename: "./logs/app.log",
  }),
);

const logger = winston.createLogger({
  level: loggerConfig.level,
  format: loggerConfig.format,
  transports,
});

export default logger;
