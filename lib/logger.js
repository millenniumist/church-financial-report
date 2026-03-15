const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'set-cookie'];

const level = process.env.LOG_LEVEL || 'info';
const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[level] ?? levels.info;

function shouldLog(msgLevel) {
  return (levels[msgLevel] ?? 99) <= currentLevel;
}

function log(msgLevel, fields, msg) {
  if (!shouldLog(msgLevel)) return;
  const fn = msgLevel === 'error' ? console.error : console.log;
  fn(JSON.stringify({ level: msgLevel, time: Date.now(), ...fields, msg }));
}

export const logger = {
  info: (fields, msg) => log('info', fields, msg ?? fields),
  warn: (fields, msg) => log('warn', fields, msg ?? fields),
  error: (fields, msg) => log('error', fields, msg ?? fields),
  debug: (fields, msg) => log('debug', fields, msg ?? fields),
  child: (ctx) => ({
    info: (fields, msg) => log('info', { ...ctx, ...fields }, msg ?? fields),
    warn: (fields, msg) => log('warn', { ...ctx, ...fields }, msg ?? fields),
    error: (fields, msg) => log('error', { ...ctx, ...fields }, msg ?? fields),
    debug: (fields, msg) => log('debug', { ...ctx, ...fields }, msg ?? fields),
  }),
};

export function createLogger(context) {
  return logger.child(context);
}

export function logRequest(request, additionalFields = {}) {
  const url = new URL(request.url);
  logger.info({
    event_type: 'api_request',
    method: request.method,
    path: url.pathname,
    ...additionalFields,
  }, `${request.method} ${url.pathname}`);
}

export function logResponse(request, response, additionalFields = {}) {
  const url = new URL(request.url);
  logger.info({
    event_type: 'api_response',
    method: request.method,
    path: url.pathname,
    status: response.status,
    ...additionalFields,
  }, `${request.method} ${url.pathname} ${response.status}`);
}

export function logError(request, error, additionalFields = {}) {
  const url = new URL(request.url);
  logger.error({
    event_type: 'api_error',
    method: request.method,
    path: url.pathname,
    error: error.message,
    stack: error.stack,
    ...additionalFields,
  }, `${request.method} ${url.pathname} ERROR: ${error.message}`);
}

export function withLogging(handler) {
  return async (request, context) => {
    const url = new URL(request.url);
    const isHealthCheck = url.pathname === '/api/health' || url.pathname === '/health';
    const startTime = Date.now();

    if (!isHealthCheck) logRequest(request);

    try {
      const response = await handler(request, context);
      if (!isHealthCheck) logResponse(request, response, { duration_ms: Date.now() - startTime });
      return response;
    } catch (error) {
      if (!isHealthCheck) logError(request, error, { duration_ms: Date.now() - startTime });
      throw error;
    }
  };
}

export default logger;
