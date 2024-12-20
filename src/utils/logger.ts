import winston, { transport } from "winston";
import loggerConfig from "../config/loggerConfig";

const transports: transport[] = [new winston.transports.Console()];

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
