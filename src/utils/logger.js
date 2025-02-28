const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format with detailed information
const detailedFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.printf(info => {
    const { timestamp, level, message, metadata, stack } = info;
    let logOutput = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace if available
    if (stack) {
      logOutput += `\n${stack}`;
    }
    
    // Add metadata if not empty
    if (metadata && Object.keys(metadata).length > 0) {
      logOutput += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    
    return logOutput;
  })
);

// Colorized console format
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  detailedFormat
);

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'silly', // 'silly' is the most verbose level in winston
  levels: winston.config.npm.levels, // Standard npm levels
  format: detailedFormat,
  defaultMeta: { service: 'dropship-crawler' },
  transports: [
    // Console output with colors
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true
    }),
    // Critical errors log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    // Warnings and above
    new winston.transports.File({ 
      filename: 'logs/warn.log', 
      level: 'warn',
      maxsize: 10485760,
      maxFiles: 5
    }),
    // Detailed debug information
    new winston.transports.File({ 
      filename: 'logs/debug.log', 
      level: 'debug',
      maxsize: 20971520, // 20MB
      maxFiles: 5
    }),
    // All logs combined
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 52428800, // 50MB
      maxFiles: 10
    })
  ],
  exitOnError: false
});

// Log unhandled exceptions and rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

// Add convenience methods for better context logging
logger.debug = (message, contextData) => {
  logger.log('debug', message, { context: contextData });
};

logger.info = (message, contextData) => {
  logger.log('info', message, { context: contextData });
};

logger.warn = (message, contextData) => {
  logger.log('warn', message, { context: contextData });
};

logger.error = (message, error, contextData) => {
  const errorData = error instanceof Error ? { 
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...error
  } : error;
  
  logger.log('error', message, { 
    error: errorData,
    context: contextData
  });
};

// Add process monitoring
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
});

// Add performance monitoring
const startTime = new Date();
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  logger.debug('Performance statistics', {
    uptime: `${Math.floor((new Date() - startTime) / 1000 / 60)} minutes`,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    }
  });
}, 300000); // Every 5 minutes

module.exports = logger;
