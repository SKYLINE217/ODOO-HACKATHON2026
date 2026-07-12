/**
 * Auth routes — /api/v1/auth
 *
 * authentication-signin.md §3: POST /login, POST /signup, GET /me
 * security.md §6: rate limiter on /login only
 */

const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginRateLimiter } = require('../middleware/security');
const { loginSchema, signupSchema } = require('../validators/auth.validators');
const authController = require('../controllers/auth.controller');

const router = Router();

// POST /api/v1/auth/signup — optional per SKILL-auth.md §6
router.post('/signup', validate(signupSchema), authController.signup);

// POST /api/v1/auth/login — rate limited (security.md §6)
router.post('/login', loginRateLimiter, validate(loginSchema), authController.login);

// GET /api/v1/auth/me — requires auth
router.get('/me', requireAuth, authController.me);

module.exports = router;
