import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Base fields to include in every log
  base: {
    app: 'cc-church-api',
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

/**
 * Log an API request with structured fields for Kibana
 * Uses ECS-safe field names to avoid conflicts
 */
export function logRequest(request, additionalFields = {}) {
  const url = new URL(request.url);

  logger.info({
    event_type: 'api_request',
    http_method: request.method,
    api_path: url.pathname,
    query_params: Object.fromEntries(url.searchParams),
    user_agent: request.headers.get('user-agent'),
    content_type: request.headers.get('content-type'),
    ...additionalFields,
  }, `${request.method} ${url.pathname}`);
}

/**
 * Log an API response with structured fields for Kibana
 * Uses ECS-safe field names to avoid conflicts
 */
export function logResponse(request, response, additionalFields = {}) {
  const url = new URL(request.url);

  logger.info({
    event_type: 'api_response',
    http_method: request.method,
    api_path: url.pathname,
    http_status: response.status,
    ...additionalFields,
  }, `${request.method} ${url.pathname} - ${response.status}`);
}

/**
 * Log an API error with structured fields for Kibana
 * Uses ECS-safe field names to avoid conflicts
 */
export function logError(request, error, additionalFields = {}) {
  const url = new URL(request.url);

  logger.error({
    event_type: 'api_error',
    http_method: request.method,
    api_path: url.pathname,
    error_message: error.message,
    error_name: error.name,
    error_stack: error.stack,
    ...additionalFields,
  }, `${request.method} ${url.pathname} - ERROR: ${error.message}`);
}

/**
 * Middleware wrapper to automatically log requests/responses
 */
export function withLogging(handler) {
  return async (request, context) => {
    const startTime = Date.now();
    logRequest(request);

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      logResponse(request, response, { duration_ms: duration });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(request, error, { duration_ms: duration });
      throw error;
    }
  };
}

export default logger;
