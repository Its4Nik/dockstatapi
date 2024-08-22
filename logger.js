const winston = require('winston');
const yaml = require('yamljs');
const config = yaml.load('./hosts.yaml');

const maxlogsize = config.log.logsize || 1;
const LogAmount = config.log.LogCount || 5;

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `DockStatAPI > ${timestamp} [ ${level} ]: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'dockstat.log',
            maxsize: 1024 * 1024 * maxlogsize,
            maxFiles: LogAmount
        })
    ]
});

module.exports = logger;
