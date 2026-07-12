/**
 * signup-drishti.js
 * 
 * Express controller for user registration (Sign up).
 * This file handles inserting a new user into the MySQL `users` table.
 * It uses bcrypt to hash the password before saving.
 * 
 * Integration:
 * Dev A / Dev B can import `signup` from this file and attach it to their Express router:
 * router.post('/api/v1/auth/signup', signupController.signup);
 */

const bcrypt = require('bcrypt');
// Assuming the shared MySQL connection pool is exported from db.js
// const db = require('./config/db');

/**
 * POST /api/v1/auth/signup
 * Body: { name, email, password, role }
 */
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Basic validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, email, password, and role are required.' }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 8 characters long.' }
      });
    }

    // 2. Validate role against allowed ENUM values
    const validRoles = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid role specified.' }
      });
    }

    // 3. Check if user already exists
    // NOTE: Uncomment when `db` is properly imported in your project
    /*
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      // In production, we typically return a generic message or just success to prevent email enumeration,
      // but for a signup form, returning "Email already in use" is common UX.
      return res.status(409).json({
        success: false,
        error: { message: 'An account with this email already exists.' }
      });
    }
    */

    // 4. Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 5. Insert into MySQL database
    /*
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    const newUserId = result.insertId;
    */
    
    // Mocking the new ID for the sake of the standalone file
    const newUserId = Math.floor(Math.random() * 1000);

    // 6. Return response WITHOUT the password hash (per authentication-signin.md)
    res.status(201).json({
      success: true,
      data: {
        id: newUserId,
        name,
        email,
        role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
};
