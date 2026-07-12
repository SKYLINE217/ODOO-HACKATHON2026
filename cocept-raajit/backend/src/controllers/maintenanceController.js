'use strict';

const db = require('../config/db');
const { createError } = require('../middleware/errorHandler');

// GET /api/v1/maintenance?vehicle_id=&status=
async function list(req, res, next) {
  try {
    const { vehicle_id, status } = req.query;
    const conditions = [];
    const params     = [];

    if (vehicle_id) { conditions.push('m.vehicle_id = ?'); params.push(vehicle_id); }
    if (status)     { conditions.push('m.status = ?');     params.push(status);     }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows  = await db.query(
      `SELECT m.*, v.registration_number, v.name_model AS vehicle_name
       FROM maintenance_logs m
       JOIN vehicles v ON v.id = m.vehicle_id
       ${where}
       ORDER BY m.opened_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// POST /api/v1/maintenance
// Creates active log AND flips vehicle to 'in_shop' — ONE transaction
async function create(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { vehicle_id, type, description, cost } = req.body;
    if (!vehicle_id || !type) {
      await conn.rollback(); conn.release();
      return next(createError('Missing required fields: vehicle_id, type.', 400, 'VALIDATION_ERROR'));
    }

    // Verify vehicle exists
    const [[vehicle]] = await conn.execute(
      'SELECT id, status FROM vehicles WHERE id = ? FOR UPDATE',
      [vehicle_id]
    );
    if (!vehicle) {
      await conn.rollback(); conn.release();
      return next(createError('Vehicle not found.', 404, 'NOT_FOUND'));
    }

    // Insert maintenance log
    const [result] = await conn.execute(
      `INSERT INTO maintenance_logs (vehicle_id, type, description, cost, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [vehicle_id, type, description || null, cost || 0]
    );

    // Side effect: flip vehicle to in_shop
    await conn.execute(
      "UPDATE vehicles SET status = 'in_shop' WHERE id = ?",
      [vehicle_id]
    );

    await conn.commit();
    conn.release();

    const [created] = await db.query(
      'SELECT * FROM maintenance_logs WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
}

// POST /api/v1/maintenance/:id/close
// Closes log AND resets vehicle to 'available' — UNLESS vehicle was manually 'retired'
async function close(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[log]] = await conn.execute(
      'SELECT * FROM maintenance_logs WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    if (!log) {
      await conn.rollback(); conn.release();
      return next(createError('Maintenance log not found.', 404, 'NOT_FOUND'));
    }
    if (log.status === 'closed') {
      await conn.rollback(); conn.release();
      return next(createError('Maintenance log is already closed.', 400, 'VALIDATION_ERROR'));
    }

    // Close the log
    await conn.execute(
      "UPDATE maintenance_logs SET status = 'closed', closed_at = NOW() WHERE id = ?",
      [log.id]
    );

    // Reset vehicle to available ONLY if it's not manually retired
    const [[vehicle]] = await conn.execute(
      'SELECT status FROM vehicles WHERE id = ?',
      [log.vehicle_id]
    );
    if (vehicle && vehicle.status !== 'retired') {
      await conn.execute(
        "UPDATE vehicles SET status = 'available' WHERE id = ?",
        [log.vehicle_id]
      );
    }

    await conn.commit();
    conn.release();

    const [updated] = await db.query('SELECT * FROM maintenance_logs WHERE id = ?', [log.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
}

module.exports = { list, create, close };
