import pino from 'pino';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'set-cookie'];
const LOG_BODY_LIMIT = Number(process.env.LOG_BODY_LIMIT ?? 4096);

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
    request_url: request.url,
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
    request_url: request.url,
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
    request_url: request.url,
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
    const requestContext = await buildRequestContext(request);
    logRequest(request, requestContext);

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;
      const responseContext = await buildResponseContext(response);

      logResponse(request, response, {
        duration_ms: duration,
        ...requestContext,
        ...responseContext,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(request, error, {
        duration_ms: duration,
        ...requestContext,
      });
      throw error;
    }
  };
}

export default logger;

async function buildRequestContext(request) {
  const rawHeaders = headersToObject(request.headers);
  return {
    request_headers: sanitizeHeaders(rawHeaders),
    request_body: await readBodySafely(() => request.clone().text(), request.headers.get('content-type')),
    client_ip: extractClientIp(rawHeaders),
  };
}

async function buildResponseContext(response) {
  if (!response) return {};
  const rawHeaders = headersToObject(response.headers);
  return {
    response_headers: sanitizeHeaders(rawHeaders),
    response_body: await readBodySafely(() => response.clone().text(), response.headers.get('content-type')),
  };
}

async function readBodySafely(readerFn, contentType) {
  try {
    const bodyText = await readerFn();
    return formatBodyForLog(bodyText, contentType);
  } catch (error) {
    return `[unavailable: ${error.message}]`;
  }
}

function headersToObject(headers) {
  const obj = {};
  if (!headers) return obj;
  for (const [key, value] of headers.entries()) {
    obj[key] = value;
  }
  return obj;
}

function sanitizeHeaders(headers) {
  const sanitized = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function extractClientIp(headers) {
  if (!headers) return null;
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (
    headers['x-real-ip'] ||
    headers['cf-connecting-ip'] ||
    headers['x-client-ip'] ||
    null
  );
}

function formatBodyForLog(bodyText, contentType) {
  if (!bodyText) return null;

  if (contentType && !isTextualContentType(contentType)) {
    return `[binary content: ${contentType}, length=${bodyText.length}]`;
  }

  if (bodyText.length <= LOG_BODY_LIMIT) {
    return bodyText;
  }

  return `${bodyText.slice(0, LOG_BODY_LIMIT)}… [truncated ${bodyText.length - LOG_BODY_LIMIT} chars]`;
}

function isTextualContentType(contentType = '') {
  const lowered = contentType.toLowerCase();
  return ['json', 'text', 'xml', 'form'].some((type) => lowered.includes(type));
}
