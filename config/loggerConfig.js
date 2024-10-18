const { format } = require('winston');

module.exports = {
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: {
        console: true, // Log to console
        file: {
            enabled: true,   // Log to file (set to false to disable file logging)
            filename: 'logs/app.log',
        },
    },
};
