const winston = require('winston');
const { format } = require('logform');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.printf(info => `${info.timestamp} ${info.level}: ${info.message.trim()}`)
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;
