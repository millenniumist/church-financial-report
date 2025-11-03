import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // In development, use pino-pretty for readable output
  transport: !isProduction ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,

  // In production, output structured JSON logs
  formatters: isProduction ? {
    level: (label) => {
      return { level: label };
    },
  } : undefined,

  // Base fields to include in every log
  base: {
    env: process.env.NODE_ENV,
  },

  // Serialize errors properly
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

// Helper function to create child loggers with context
export function createLogger(context) {
  return logger.child(context);
}

export default logger;
