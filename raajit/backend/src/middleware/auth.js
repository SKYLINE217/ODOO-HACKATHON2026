'use strict';

/**
 * Auth middleware stubs — owned by Dev B.
 *
 * Dev B: replace the bodies of requireAuth and requireRole with real JWT
 * verification (jsonwebtoken.verify + DB user lookup). The interface
 * (Express middleware signature, req.user shape) MUST stay identical so
 * no routes need to change.
 *
 * req.user shape after requireAuth runs:
 *   { id: number, role: 'fleet_manager' | 'driver' | 'safety_officer' | 'financial_analyst' }
 */

/**
 * Verify the JWT from Authorization: Bearer <token>.
 * Sets req.user = { id, role } on success.
 * Returns 401 if missing/invalid.
 *
 * STUB: currently trusts every request as fleet_manager.
 */
function requireAuth(req, _res, next) {
  // TODO (Dev B): replace stub with real JWT verification
  req.user = { id: 1, role: 'fleet_manager' };
  next();
}

/**
 * Factory: restrict route to one or more roles.
 * Usage: router.post('/', requireAuth, requireRole(['fleet_manager']), controller)
 *
 * Returns 403 if req.user.role is not in the allowed list.
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
