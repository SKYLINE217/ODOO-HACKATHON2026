/**
 * Security middleware bundle — all hardening from security.md.
 * SKILL-security.md §2: applied at Express scaffold time, not retrofitted later.
 *
 * - Helmet (security.md §2): HTTP security headers
 * - CORS (security.md §2): scoped to frontend origin only, not *
 * - Rate limiter (security.md §6): login endpoint only, not whole API
 *   SKILL-security.md: "Rate limiting the whole API instead of scoping it to
 *   /auth/login — over-throttling legitimate dashboard polling during the demo"
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/** Helmet — security.md §2 */
const helmetMiddleware = helmet();

/** CORS — only the frontend's dev origin, never * */
const corsMiddleware = cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
});

/**
 * Login rate limiter — security.md §6: 5 attempts / 15 min per IP.
 * Applied ONLY to /api/v1/auth/login, not globally.
 */
const loginRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
    },
  },
  // Uses default keyGenerator (req.ip with IPv6 handling)
});

module.exports = { helmetMiddleware, corsMiddleware, loginRateLimiter };
