'use strict';

/**
 * Auth routes — /api/v1/auth
 *
 * authentication-signin.md §3: POST /signup, POST /login, GET /me
 * security.md §6: rate limiter on /login only
 */

const { Router }       = require('express');
const rateLimit        = require('express-rate-limit');
const { requireAuth }  = require('../middleware/auth');
const authController   = require('../controllers/authController');

const router = Router();

// ── Rate limiter for login — security.md §6: 5 attempts / 15 min ──
const loginRateLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 900000,
  max:      parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10)       || 5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error: {
      code:    'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.',
    },
  },
});

// POST /api/v1/auth/signup
router.post('/signup', authController.signup);

// POST /api/v1/auth/login — rate limited
router.post('/login', loginRateLimiter, authController.login);

// GET /api/v1/auth/me — requires auth
router.get('/me', requireAuth, authController.me);

module.exports = router;
