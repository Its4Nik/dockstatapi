const { format } = require('winston');

module.exports = {
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: {
        console: true,
        file: {
            enabled: true, 
            filename: 'logs/app.log',
        },
    },
};
