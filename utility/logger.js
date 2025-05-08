const winston = require('winston');
const chalk = require('chalk');

// Function to colorize messages based on log level
const colorizeMessage = (level, message) => {
  switch (level) {
    case 'info': return chalk.green(message);
    case 'warn': return chalk.yellow(message);
    case 'error': return chalk.red(message);
    case 'debug': return chalk.cyan(message);
    default: return message;
  }
};

// Logger configuration
const baseLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
      const colored = colorizeMessage(level, message);
      return `[${timestamp}] ${level}: ${colored}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

// Custom logger methods
const wrapLogger = (method) => (...args) => {
  const message = args.map(arg => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  }).join(' ');
  baseLogger[method](message);
};

// Export final logger
const logger = {
  info: wrapLogger('info'),
  warn: wrapLogger('warn'),
  error: wrapLogger('error'),
  debug: wrapLogger('debug'),
};

module.exports = logger;
