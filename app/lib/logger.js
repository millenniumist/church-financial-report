import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const elasticsearchEnabled = process.env.ELASTICSEARCH_ENABLED === 'true';
const elasticsearchNode = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';

// Base logger configuration
const baseConfig = {
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV || 'production',
    service: 'cc-church-api',
  },
};

// Transport configuration
const getTransport = () => {
  const targets = [];

  // Pretty print for development
  if (isDevelopment) {
    targets.push({
      target: 'pino-pretty',
      level: 'debug',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    });
  }

  // Elasticsearch transport for production
  if (elasticsearchEnabled && !isDevelopment) {
    targets.push({
      target: 'pino-elasticsearch',
      level: 'info',
      options: {
        index: 'cc-church-logs',
        node: elasticsearchNode,
        esVersion: 8,
        flushBytes: 1000,
        consistency: 'one',
        'bulk-insert': {
          size: 100,
          interval: 5000,
        },
      },
    });
  }

  // Always log to stdout in JSON format (for Docker logs)
  if (!isDevelopment) {
    targets.push({
      target: 'pino/file',
      level: 'info',
      options: {},
    });
  }

  return targets.length > 0 ? { targets } : undefined;
};

// Create logger with appropriate transport
export const logger = pino(
  baseConfig,
  getTransport() ? pino.transport(getTransport()) : undefined
);

// Helper functions for structured logging
export const logRequest = (req, metadata = {}) => {
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    headers: req.headers,
    ...metadata,
  }, 'Incoming request');
};

export const logResponse = (req, res, duration, metadata = {}) => {
  logger.info({
    type: 'response',
    method: req.method,
    url: req.url,
    status: res.status,
    duration: `${duration}ms`,
    ...metadata,
  }, 'Request completed');
};

export const logError = (error, context = {}) => {
  logger.error({
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  }, 'Error occurred');
};

export const logHealth = (status, metadata = {}) => {
  const logLevel = status === 'healthy' ? 'info' : 'error';
  logger[logLevel]({
    type: 'health-check',
    status,
    ...metadata,
  }, `Health check: ${status}`);
};

export default logger;
