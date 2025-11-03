import { logger } from '../logger';

/**
 * Middleware to log API requests and responses
 * Usage: Wrap your API handler with this function
 */
export function withLogger(handler) {
  return async (req, res) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a child logger with request context
    const log = logger.child({
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });

    // Log incoming request
    log.info({
      type: 'request',
      headers: {
        'content-type': req.headers['content-type'],
        'host': req.headers.host,
      },
      query: req.query,
    }, 'Incoming request');

    // Capture the original res.json and res.send to log responses
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;

    let responseBody;
    let responseSent = false;

    // Override res.json
    res.json = function (data) {
      if (!responseSent) {
        responseBody = data;
        responseSent = true;
      }
      return originalJson.call(this, data);
    };

    // Override res.send
    res.send = function (data) {
      if (!responseSent) {
        responseBody = data;
        responseSent = true;
      }
      return originalSend.call(this, data);
    };

    // Override res.end
    res.end = function (...args) {
      if (!responseSent) {
        responseSent = true;
      }
      return originalEnd.call(this, ...args);
    };

    try {
      // Execute the actual API handler
      const result = await handler(req, res);

      // Log successful response
      const duration = Date.now() - startTime;
      log.info({
        type: 'response',
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseSize: responseBody ? JSON.stringify(responseBody).length : 0,
      }, `Request completed`);

      return result;
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      log.error({
        type: 'error',
        statusCode: res.statusCode || 500,
        duration: `${duration}ms`,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
      }, 'Request failed');

      // Re-throw to let Next.js handle the error
      throw error;
    }
  };
}

/**
 * Simple function to log API events without wrapping
 */
export function logApi(context, message) {
  logger.info(context, message);
}

export default withLogger;
