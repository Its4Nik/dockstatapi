// utils/logger.js
const winston = require('winston');
const loggerConfig = require('../config/loggerConfig');

const transports = [
    new winston.transports.Console(),
];

if (loggerConfig.transports.file.enabled) {
    transports.push(
        new winston.transports.File({ filename: loggerConfig.transports.file.filename })
    );
}

const logger = winston.createLogger({
    level: loggerConfig.level,
    format: loggerConfig.format,
    transports,
});

module.exports = logger;
