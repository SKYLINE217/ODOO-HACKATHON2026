'use strict';

const db = require('../config/db');
const { createError } = require('../middleware/errorHandler');

const VALID_TYPES = ['toll', 'maintenance', 'other'];

// GET /api/v1/expenses?vehicle_id=&type=
async function list(req, res, next) {
  try {
    const { vehicle_id, type } = req.query;
    const conditions = [];
    const params     = [];

    if (vehicle_id) { conditions.push('e.vehicle_id = ?'); params.push(vehicle_id); }
    if (type)       { conditions.push('e.type = ?');       params.push(type);       }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows  = await db.query(
      `SELECT e.*,
              v.registration_number, v.name_model AS vehicle_name
       FROM expenses e
       LEFT JOIN vehicles v ON v.id = e.vehicle_id
       ${where}
       ORDER BY e.expense_date DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// POST /api/v1/expenses
async function create(req, res, next) {
  try {
    const { vehicle_id, trip_id, type, amount, expense_date, description } = req.body;
    if (!type || !amount || !expense_date) {
      return next(createError(
        'Missing required fields: type, amount, expense_date.',
        400, 'VALIDATION_ERROR'
      ));
    }
    if (!VALID_TYPES.includes(type)) {
      return next(createError(
        `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}.`,
        400, 'VALIDATION_ERROR'
      ));
    }

    const result = await db.query(
      'INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date, description) VALUES (?, ?, ?, ?, ?, ?)',
      [vehicle_id || null, trip_id || null, type, amount, expense_date, description || null]
    );

    const [created] = await db.query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

module.exports = { list, create };
