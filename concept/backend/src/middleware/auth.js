/**
 * Authentication middleware — JWT verification.
 *
 * authentication-signin.md §4: JWT signed with HS256, { sub, role, iat, exp }
 * security.md §7: user resolved from JWT only, never trust body fields.
 * SKILL-auth.md: requireAuth must run BEFORE requireRole in middleware chain.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * requireAuth — verifies Bearer token, attaches req.user = { id, email, name, role }.
 * Returns 401 on missing/invalid/expired token.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    // security.md §7: ONLY source of identity — never trust body role/user_id
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Session expired. Please sign in again.' },
      });
    }

    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token.' },
    });
  }
}

module.exports = { requireAuth };
