const winston = require('winston');
const path = require('path');
require('dotenv').config();

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'voip-app' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          let logMessage = `${timestamp} ${level}: ${message}`;
          
          // Add additional metadata if present
          if (Object.keys(rest).length > 0 && rest.service) {
            const meta = JSON.stringify(rest);
            logMessage += ` ${meta}`;
          }
          
          return logMessage;
        })
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Express middleware
const loggerMiddleware = (req, res, next) => {
  // Log request
  logger.info({
    message: `${req.method} ${req.path}`,
    ip: req.ip,
    userId: req.user ? req.user.id : null,
    userAgent: req.headers['user-agent']
  });
  
  // Log response time
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      message: `${req.method} ${req.path} ${res.statusCode}`,
      duration: `${duration}ms`,
      status: res.statusCode
    });
  });
  
  next();
};

module.exports = loggerMiddleware;
module.exports.logger = logger;