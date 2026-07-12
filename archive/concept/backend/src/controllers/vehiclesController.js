'use strict';

const db = require('../config/db');
const { createError } = require('../middleware/errorHandler');

const VALID_STATUSES = ['available', 'on_trip', 'in_shop', 'retired'];

// GET /api/v1/vehicles?type=&status=&region=
async function list(req, res, next) {
  try {
    const { type, status, region } = req.query;
    const conditions = [];
    const params     = [];

    if (type)   { conditions.push('type = ?');   params.push(type);   }
    if (status) { conditions.push('status = ?'); params.push(status); }
    if (region) { conditions.push('region = ?'); params.push(region); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows  = await db.query(
      `SELECT * FROM vehicles ${where} ORDER BY created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// GET /api/v1/vehicles/:id
async function getById(req, res, next) {
  try {
    const [row] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!row) return next(createError('Vehicle not found.', 404, 'NOT_FOUND'));
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

// GET /api/v1/vehicles/dispatch-pool
async function getDispatchPool(req, res, next) {
  try {
    const rows = await db.query(
      "SELECT * FROM vehicles WHERE status = 'available' ORDER BY name_model"
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// POST /api/v1/vehicles
async function create(req, res, next) {
  try {
    const { registration_number, name_model, type, max_load_capacity_kg,
            odometer_km, acquisition_cost, region } = req.body;

    if (!registration_number || !name_model || !type || !max_load_capacity_kg || !acquisition_cost) {
      return next(createError('Missing required fields: registration_number, name_model, type, max_load_capacity_kg, acquisition_cost.', 400, 'VALIDATION_ERROR'));
    }

    // Check for duplicate registration number
    const [existing] = await db.query(
      'SELECT id FROM vehicles WHERE registration_number = ?',
      [registration_number]
    );
    if (existing) {
      return next(createError(
        `Registration number '${registration_number}' already exists.`,
        409, 'CONFLICT'
      ));
    }

    const result = await db.query(
      `INSERT INTO vehicles
         (registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, region)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        registration_number,
        name_model,
        type,
        max_load_capacity_kg,
        odometer_km || 0,
        acquisition_cost,
        region || null,
      ]
    );

    const [created] = await db.query('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

// PUT /api/v1/vehicles/:id
async function update(req, res, next) {
  try {
    const { registration_number, name_model, type, max_load_capacity_kg,
            odometer_km, acquisition_cost, region } = req.body;

    const [existing] = await db.query('SELECT id FROM vehicles WHERE id = ?', [req.params.id]);
    if (!existing) return next(createError('Vehicle not found.', 404, 'NOT_FOUND'));

    // Check uniqueness if registration_number is being changed
    if (registration_number) {
      const [dup] = await db.query(
        'SELECT id FROM vehicles WHERE registration_number = ? AND id != ?',
        [registration_number, req.params.id]
      );
      if (dup) return next(createError(`Registration number '${registration_number}' already exists.`, 409, 'CONFLICT'));
    }

    await db.query(
      `UPDATE vehicles SET
         registration_number = COALESCE(?, registration_number),
         name_model          = COALESCE(?, name_model),
         type                = COALESCE(?, type),
         max_load_capacity_kg= COALESCE(?, max_load_capacity_kg),
         odometer_km         = COALESCE(?, odometer_km),
         acquisition_cost    = COALESCE(?, acquisition_cost),
         region              = COALESCE(?, region)
       WHERE id = ?`,
      [registration_number, name_model, type, max_load_capacity_kg,
       odometer_km, acquisition_cost, region, req.params.id]
    );

    const [updated] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

// PATCH /api/v1/vehicles/:id/status
async function patchStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(
        `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
        400, 'VALIDATION_ERROR'
      ));
    }

    const [existing] = await db.query('SELECT id FROM vehicles WHERE id = ?', [req.params.id]);
    if (!existing) return next(createError('Vehicle not found.', 404, 'NOT_FOUND'));

    await db.query('UPDATE vehicles SET status = ? WHERE id = ?', [status, req.params.id]);
    const [updated] = await db.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

module.exports = { list, getById, getDispatchPool, create, update, patchStatus };
