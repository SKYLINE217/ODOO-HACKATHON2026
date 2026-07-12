'use strict';

const db = require('../config/db');
const { createError } = require('../middleware/errorHandler');

// GET /api/v1/fuel-logs?vehicle_id=
async function list(req, res, next) {
  try {
    const { vehicle_id } = req.query;
    const conditions = [];
    const params     = [];

    if (vehicle_id) { conditions.push('fl.vehicle_id = ?'); params.push(vehicle_id); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows  = await db.query(
      `SELECT fl.*, v.registration_number, v.name_model AS vehicle_name
       FROM fuel_logs fl
       JOIN vehicles v ON v.id = fl.vehicle_id
       ${where}
       ORDER BY fl.log_date DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// POST /api/v1/fuel-logs
async function create(req, res, next) {
  try {
    const { vehicle_id, trip_id, liters, cost, log_date } = req.body;
    if (!vehicle_id || !liters || !cost || !log_date) {
      return next(createError(
        'Missing required fields: vehicle_id, liters, cost, log_date.',
        400, 'VALIDATION_ERROR'
      ));
    }

    const [vehicleCheck] = await db.query('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicleCheck) return next(createError('Vehicle not found.', 404, 'NOT_FOUND'));

    const result = await db.query(
      'INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, trip_id || null, liters, cost, log_date]
    );

    const [created] = await db.query('SELECT * FROM fuel_logs WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

module.exports = { list, create };
