'use strict';

const db = require('../config/db');
const { createError } = require('../middleware/errorHandler');

const VALID_STATUSES = ['available', 'on_trip', 'off_duty', 'suspended'];

// GET /api/v1/drivers?status=
async function list(req, res, next) {
  try {
    const { status } = req.query;
    const conditions = [];
    const params     = [];

    if (status) { conditions.push('status = ?'); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows  = await db.query(
      `SELECT * FROM drivers ${where} ORDER BY name ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// GET /api/v1/drivers/:id
async function getById(req, res, next) {
  try {
    const [row] = await db.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    if (!row) return next(createError('Driver not found.', 404, 'NOT_FOUND'));
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

// GET /api/v1/drivers/dispatch-pool
// Returns only drivers with status='available' AND non-expired license
async function getDispatchPool(req, res, next) {
  try {
    const rows = await db.query(
      `SELECT * FROM drivers
       WHERE status = 'available'
         AND license_expiry_date > CURDATE()
       ORDER BY name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// POST /api/v1/drivers
async function create(req, res, next) {
  try {
    const { name, license_number, license_category, license_expiry_date,
            contact_number, user_id } = req.body;

    if (!name || !license_number || !license_category || !license_expiry_date) {
      return next(createError(
        'Missing required fields: name, license_number, license_category, license_expiry_date.',
        400, 'VALIDATION_ERROR'
      ));
    }

    // Check unique license_number
    const [existing] = await db.query(
      'SELECT id FROM drivers WHERE license_number = ?',
      [license_number]
    );
    if (existing) {
      return next(createError(
        `License number '${license_number}' already exists.`,
        409, 'CONFLICT'
      ));
    }

    const result = await db.query(
      `INSERT INTO drivers
         (user_id, name, license_number, license_category, license_expiry_date, contact_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id || null, name, license_number, license_category, license_expiry_date, contact_number || null]
    );

    const [created] = await db.query('SELECT * FROM drivers WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

// PUT /api/v1/drivers/:id
async function update(req, res, next) {
  try {
    const { name, license_number, license_category, license_expiry_date, contact_number } = req.body;

    const [existing] = await db.query('SELECT id FROM drivers WHERE id = ?', [req.params.id]);
    if (!existing) return next(createError('Driver not found.', 404, 'NOT_FOUND'));

    if (license_number) {
      const [dup] = await db.query(
        'SELECT id FROM drivers WHERE license_number = ? AND id != ?',
        [license_number, req.params.id]
      );
      if (dup) return next(createError(`License number '${license_number}' already exists.`, 409, 'CONFLICT'));
    }

    await db.query(
      `UPDATE drivers SET
         name                = COALESCE(?, name),
         license_number      = COALESCE(?, license_number),
         license_category    = COALESCE(?, license_category),
         license_expiry_date = COALESCE(?, license_expiry_date),
         contact_number      = COALESCE(?, contact_number)
       WHERE id = ?`,
      [name, license_number, license_category, license_expiry_date, contact_number, req.params.id]
    );

    const [updated] = await db.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

// PATCH /api/v1/drivers/:id/status  (safety_officer only)
async function patchStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
        400, 'VALIDATION_ERROR'
      ));
    }

    const [existing] = await db.query('SELECT id FROM drivers WHERE id = ?', [req.params.id]);
    if (!existing) return next(createError('Driver not found.', 404, 'NOT_FOUND'));

    await db.query('UPDATE drivers SET status = ? WHERE id = ?', [status, req.params.id]);
    const [updated] = await db.query('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

module.exports = { list, getById, getDispatchPool, create, update, patchStatus };
