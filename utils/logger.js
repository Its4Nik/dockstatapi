const winston = require("winston");
const loggerConfig = require("../config/loggerConfig");

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

module.exports = logger;
