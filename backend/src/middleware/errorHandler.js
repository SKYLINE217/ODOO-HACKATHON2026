'use strict';

/**
 * Central error handler — must be registered LAST in app.js.
 *
 * Converts any thrown Error into the fixed response envelope:
 *   { success: false, error: { code, message } }
 */
function errorHandler(err, req, res, _next) {
  // Only expose messages from errors explicitly created via createError()
  // (those have a statusCode set by application code). Everything else
  // is logged server-side and the client gets a generic message.
  const isAppError = !!err.statusCode;
  const status  = err.statusCode || 500;
  const code    = isAppError ? (err.code || 'BAD_REQUEST') : 'INTERNAL_ERROR';
  const message = isAppError ? err.message : 'An unexpected error occurred.';

  // Always log 500s server-side with full details
  if (status >= 500 || !isAppError) {
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
