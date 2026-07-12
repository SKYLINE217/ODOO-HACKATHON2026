'use strict';

/**
 * Central error handler — must be registered LAST in app.js.
 *
 * Converts any thrown Error into the fixed response envelope:
 *   { success: false, error: { code, message } }
 */
function errorHandler(err, req, res, _next) {
  const status  = err.statusCode || 500;
  const code    = err.code       || 'INTERNAL_ERROR';
  const message = err.message    || 'An unexpected error occurred.';

  if (status === 500) {
    console.error('[ERROR]', req.method, req.originalUrl, err);
  }

  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

/** Helper to build a structured API error. */
function createError(message, statusCode = 400, code = 'BAD_REQUEST') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

module.exports = { errorHandler, createError };
