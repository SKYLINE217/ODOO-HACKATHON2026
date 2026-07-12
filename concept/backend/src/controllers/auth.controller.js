/**
 * Auth controller — login, signup, me.
 *
 * authentication-signin.md §2-5: bcrypt ≥10 rounds, JWT { sub, role },
 *   never return password_hash, generic 401 messages.
 * security.md §6: generic error "Invalid email or password" on login failure.
 * SKILL-auth.md §4: sign JWT with { sub, role }, return token + user (no hash).
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const config = require('../config/env');

const BCRYPT_ROUNDS = 10; // authentication-signin.md §2

/**
 * POST /api/v1/auth/signup
 * authentication-signin.md §3: body { name, email, password, role }
 */
async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Check for duplicate email — 409 conflict
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'An account with this email already exists.' },
      });
    }

    // Hash password — bcrypt ≥10 rounds (authentication-signin.md §2)
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    // authentication-signin.md §3: response 201, no password_hash
    return res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        email,
        role,
      },
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
    });
  }
}

/**
 * POST /api/v1/auth/login
 * authentication-signin.md §3: returns { token, user }
 * security.md §6: generic "Invalid email or password" on failure
 * SKILL-auth.md: "Returning different error messages for 'wrong password' vs
 *   'email not found' — this is a security leak"
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Look up user — parameterized query (security.md §4)
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
      [email]
    );

    // Generic message whether email doesn't exist OR password is wrong
    const genericError = {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    };

    if (rows.length === 0) {
      return res.status(401).json(genericError);
    }

    const user = rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json(genericError);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json(genericError);
    }

    // Sign JWT — authentication-signin.md §4: { sub, role, iat, exp }, HS256
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        algorithm: 'HS256',
      }
    );

    // authentication-signin.md §3: return token + user (never password_hash)
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
    });
  }
}

/**
 * GET /api/v1/auth/me
 * authentication-signin.md §3: returns current user from JWT.
 * SKILL-auth.md: "/auth/me never returns password_hash"
 */
async function me(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    const user = rows[0];

    // Never return password_hash
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Internal server error.' },
    });
  }
}

module.exports = { signup, login, me };
