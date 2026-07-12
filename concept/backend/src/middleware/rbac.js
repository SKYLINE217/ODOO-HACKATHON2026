/**
 * RBAC middleware — role-based access control enforcement.
 *
 * access-control.md §3: backend is the source of truth, 403 even if frontend hides the button.
 * SKILL-ac.md: "frontend hiding a button proves nothing about the API"
 *
 * Two complementary guards:
 *   requireRole(...roles)          — simple role whitelist
 *   requirePermission(capability)  — checks the full permission matrix
 */

const { PERMISSIONS } = require('../constants/permissions');

/**
 * requireRole — checks if req.user.role is in the allowed list.
 *
 * authentication-signin.md §5:
 *   router.post('/vehicles', requireAuth, requireRole('fleet_manager'), controller.create);
 *
 * @param  {...string} allowedRoles
 */
function requireRole(...rolesArg) {
  // Flatten in case Dev A passed an array: requireRole(['fleet_manager', 'driver'])
  const allowedRoles = Array.isArray(rolesArg[0]) ? rolesArg[0] : rolesArg;
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        },
      });
    }

    next();
  };
}

/**
 * requirePermission — checks the capability against the full permission matrix.
 *
 * @param {string} capability - key from PERMISSIONS (e.g. 'create:vehicle')
 */
function requirePermission(capability) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Authentication required.' },
      });
    }

    const allowedRoles = PERMISSIONS[capability];

    if (!allowedRoles) {
      // Developer error — capability not registered in permissions.js
      console.error(`[RBAC] Unknown capability: "${capability}". Add it to constants/permissions.js.`);
      return res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: 'Internal configuration error.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.',
        },
      });
    }

    next();
  };
}

module.exports = { requireRole, requirePermission };
