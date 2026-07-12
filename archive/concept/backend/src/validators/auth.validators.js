/**
 * Auth validation schemas — Zod.
 * authentication-signin.md §2-3: field shapes, password 8+ chars.
 * security.md §3: enforce enum values server-side.
 */

const { z } = require('zod');
const { VALID_ROLES } = require('../constants/enums');

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').max(150),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(VALID_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` }),
  }),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { signupSchema, loginSchema };
