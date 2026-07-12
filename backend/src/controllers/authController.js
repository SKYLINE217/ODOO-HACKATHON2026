'use strict';

/**
 * Auth controller — signup, login, me.
 *
 * authentication-signin.md §2-5: bcrypt ≥10 rounds, JWT { sub, role },
 *   never return password_hash, generic 401 on login failure.
 * security.md §6: generic "Invalid email or password" message.
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const BCRYPT_ROUNDS = 10; // authentication-signin.md §2

/** Canonical roles — database.md §0 */
const VALID_ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];

// ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/signup
// authentication-signin.md §3: { name, email, password, role }
// ─────────────────────────────────────────────────────────────
async function signup(req, res) {
  try {
    const { name, email, password, role, license_no, vehicle_name, vehicle_no } = req.body;

    // ── Validate required fields ──
    if (!name || !email || !password || !license_no) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, password, and license number are required.' },
      });
    }

    // ── Validate email format ──
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email address.' },
      });
    }

    // ── Password policy: 8+ chars (authentication-signin.md §2) ──
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters.' },
      });
    }

    // ── Public signup is always assigned the lowest-privilege role ──
    // Elevated roles (fleet_manager, safety_officer, financial_analyst)
    // must be provisioned by an administrator directly in the database.
    const assignedRole = 'driver';

    // ── Check for duplicate email — 409 conflict ──
    const existing = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'An account with this email already exists.' },
      });
    }

    // ── Hash password — bcrypt ≥10 rounds ──
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // ── Insert user ──
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, assignedRole]
    );

    // ── Insert driver ──
    await db.query(
      'INSERT INTO drivers (name, license_no, category, license_expiry, contact, safety_status, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, license_no, 'Light', '2030-01-01', email, 'Available', 'Available']
    );

    // ── Insert vehicle ──
    if (vehicle_name && vehicle_no) {
      try {
        await db.query(
          'INSERT INTO vehicles (reg_no, name_model, type, capacity, capacity_kg, odometer, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [vehicle_no, vehicle_name, 'Van', 'Small', 1500, 0, 500000.00, 'Available']
        );
      } catch (err) {
        console.warn('[Auth] Error inserting vehicle during signup:', err.message);
      }
    }

    // authentication-signin.md §3: response 201, no password_hash
    return res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        name,
        email,
        role: assignedRole,
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

// ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// authentication-signin.md §3: returns { token, user }
// security.md §6: generic "Invalid email or password" on failure
// ─────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' },
      });
    }

    // Generic message — never reveal whether email exists
    const genericError = {
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
    };

    // ── Look up user — parameterized query (security.md §4) ──
    const rows = await db.query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json(genericError);
    }

    const user = rows[0];

    // ── Check if account is active ──
    if (!user.is_active) {
      return res.status(401).json(genericError);
    }

    // ── Verify password ──
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json(genericError);
    }

    // ── Sign JWT — authentication-signin.md §4 ──
    const token = jwt.sign(
      {
        sub:   user.id,
        email: user.email,
        name:  user.name,
        role:  user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        algorithm: 'HS256',
      }
    );

    // Return token + user (never password_hash)
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
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

// ─────────────────────────────────────────────────────────────
// GET /api/v1/auth/me
// authentication-signin.md §3: returns current user (no password_hash)
// ─────────────────────────────────────────────────────────────
async function me(req, res) {
  try {
    const rows = await db.query(
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

    return res.status(200).json({
      success: true,
      data: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        is_active:  user.is_active,
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
