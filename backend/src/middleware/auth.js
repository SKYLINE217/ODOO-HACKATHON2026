'use strict';

/**
 * Authentication middleware — real JWT verification.
 *
 * Ported from concept-drishti's auth.js, adapted to cocept-raajit conventions.
 * authentication-signin.md §4: JWT signed HS256, { sub, role, iat, exp }
 * SKILL-auth.md: requireAuth must run BEFORE requireRole.
 */

const jwt = require('jsonwebtoken');

/**
 * requireAuth — verifies Bearer token, attaches req.user = { id, email, name, role }.
 * Returns 401 on missing/invalid/expired token.
 */
function requireAuth(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token; // Fallback for EventSource (SSE)
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // security.md §7: ONLY source of identity — never trust body role/user_id
    req.user = {
      id:    decoded.sub,
      email: decoded.email,
      name:  decoded.name,
      role:  decoded.role,
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

/**
 * requireRole — factory: restrict route to one or more roles.
 * Usage: router.post('/', requireAuth, requireRole(['fleet_manager']), handler)
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Role '${req.user.role}' is not permitted to perform this action.`,
        },
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
