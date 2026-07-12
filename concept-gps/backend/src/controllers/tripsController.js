'use strict';

const db = require('../config/db');
const { createError } = require('../middleware/errorHandler');

// ── Controllers ──────────────────────────────────────────────────────────────

// GET /api/v1/trips?status=
async function list(req, res, next) {
  try {
    const { status } = req.query;
    const conditions = [];
    const params     = [];

    if (status) { conditions.push('t.status = ?'); params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows  = await db.query(
      `SELECT t.*,
              v.registration_number, v.name_model AS vehicle_name,
              d.name AS driver_name
       FROM trips t
       JOIN vehicles v ON v.id = t.vehicle_id
       JOIN drivers  d ON d.id = t.driver_id
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
}

// GET /api/v1/trips/:id
async function getById(req, res, next) {
  try {
    const [row] = await db.query(
      `SELECT t.*,
              v.registration_number, v.name_model AS vehicle_name, v.max_load_capacity_kg,
              d.name AS driver_name, d.license_expiry_date
       FROM trips t
       JOIN vehicles v ON v.id = t.vehicle_id
       JOIN drivers  d ON d.id = t.driver_id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!row) return next(createError('Trip not found.', 404, 'NOT_FOUND'));
    res.json({ success: true, data: row });
  } catch (err) { next(err); }
}

// POST /api/v1/trips  — creates in 'draft' status
async function create(req, res, next) {
  try {
    const { source, destination, vehicle_id, driver_id,
            cargo_weight_kg, planned_distance_km } = req.body;

    if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight_kg || !planned_distance_km) {
      return next(createError(
        'Missing required fields: source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km.',
        400, 'VALIDATION_ERROR'
      ));
    }

    const result = await db.query(
      `INSERT INTO trips
         (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, req.user.id]
    );

    const [created] = await db.query('SELECT * FROM trips WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
}

// POST /api/v1/trips/:id/dispatch
// Validation chain (server-side, in order):
//   1. Vehicle exists & status='available'
//   2. Driver exists, status='available', license not expired
//   3. cargo_weight_kg <= vehicle.max_load_capacity_kg
//   4. Set trip=dispatched, vehicle=on_trip, driver=on_trip — ONE transaction
async function dispatch(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Load the trip
    const [[trip]] = await conn.execute('SELECT * FROM trips WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!trip) {
      await conn.rollback(); conn.release();
      return next(createError('Trip not found.', 404, 'NOT_FOUND'));
    }
    if (trip.status !== 'draft') {
      await conn.rollback(); conn.release();
      return next(createError(
        `Cannot dispatch a trip with status '${trip.status}'. Only 'draft' trips can be dispatched.`,
        400, 'VALIDATION_ERROR'
      ));
    }

    // 1. Vehicle check
    const [[vehicle]] = await conn.execute(
      'SELECT * FROM vehicles WHERE id = ? FOR UPDATE',
      [trip.vehicle_id]
    );
    if (!vehicle) {
      await conn.rollback(); conn.release();
      return next(createError('Assigned vehicle not found.', 404, 'NOT_FOUND'));
    }
    if (vehicle.status !== 'available') {
      await conn.rollback(); conn.release();
      return next(createError(
        `Vehicle '${vehicle.registration_number}' is not available (current status: ${vehicle.status}).`,
        400, 'DISPATCH_BLOCKED'
      ));
    }

    // 2. Driver check
    const [[driver]] = await conn.execute(
      'SELECT * FROM drivers WHERE id = ? FOR UPDATE',
      [trip.driver_id]
    );
    if (!driver) {
      await conn.rollback(); conn.release();
      return next(createError('Assigned driver not found.', 404, 'NOT_FOUND'));
    }
    if (driver.status !== 'available') {
      await conn.rollback(); conn.release();
      return next(createError(
        `Driver '${driver.name}' is not available (current status: ${driver.status}).`,
        400, 'DISPATCH_BLOCKED'
      ));
    }
    const today = new Date().toISOString().split('T')[0];
    // MySQL2 may return DATE as a Date object or string depending on config — normalize
    const expiryStr = driver.license_expiry_date instanceof Date
      ? driver.license_expiry_date.toISOString().split('T')[0]
      : String(driver.license_expiry_date).slice(0, 10);
    if (expiryStr <= today) {
      await conn.rollback(); conn.release();
      return next(createError(
        `Driver '${driver.name}' has an expired license (expired: ${expiryStr}).`,
        400, 'DISPATCH_BLOCKED'
      ));
    }

    // 3. Cargo weight check
    if (parseFloat(trip.cargo_weight_kg) > parseFloat(vehicle.max_load_capacity_kg)) {
      const excess = (parseFloat(trip.cargo_weight_kg) - parseFloat(vehicle.max_load_capacity_kg)).toFixed(2);
      await conn.rollback(); conn.release();
      return next(createError(
        `Cargo weight ${trip.cargo_weight_kg} kg exceeds vehicle capacity ${vehicle.max_load_capacity_kg} kg (excess: ${excess} kg). Dispatch blocked.`,
        400, 'CAPACITY_EXCEEDED'
      ));
    }

    // 4. All checks passed — update in one transaction
    await conn.execute(
      "UPDATE trips SET status = 'dispatched', dispatched_at = NOW() WHERE id = ?",
      [trip.id]
    );
    await conn.execute(
      "UPDATE vehicles SET status = 'on_trip' WHERE id = ?",
      [vehicle.id]
    );
    await conn.execute(
      "UPDATE drivers SET status = 'on_trip' WHERE id = ?",
      [driver.id]
    );

    await conn.commit();
    conn.release();

    const [updated] = await db.query('SELECT * FROM trips WHERE id = ?', [trip.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
}

// POST /api/v1/trips/:id/complete
// Sets trip=completed, updates odometer, resets vehicle & driver to 'available' — one transaction
async function complete(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[trip]] = await conn.execute('SELECT * FROM trips WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!trip) {
      await conn.rollback(); conn.release();
      return next(createError('Trip not found.', 404, 'NOT_FOUND'));
    }
    if (trip.status !== 'dispatched') {
      await conn.rollback(); conn.release();
      return next(createError(
        `Cannot complete a trip with status '${trip.status}'. Only 'dispatched' trips can be completed.`,
        400, 'VALIDATION_ERROR'
      ));
    }

    const { actual_distance_km, fuel_consumed_liters, revenue } = req.body;
    if (!actual_distance_km || !fuel_consumed_liters) {
      await conn.rollback(); conn.release();
      return next(createError(
        'Missing required fields: actual_distance_km, fuel_consumed_liters.',
        400, 'VALIDATION_ERROR'
      ));
    }

    // Update trip
    await conn.execute(
      `UPDATE trips SET
         status = 'completed',
         completed_at = NOW(),
         actual_distance_km = ?,
         fuel_consumed_liters = ?,
         revenue = ?
       WHERE id = ?`,
      [actual_distance_km, fuel_consumed_liters, revenue || null, trip.id]
    );

    // Update vehicle odometer + reset status
    await conn.execute(
      "UPDATE vehicles SET odometer_km = odometer_km + ?, status = 'available' WHERE id = ?",
      [actual_distance_km, trip.vehicle_id]
    );

    // Reset driver status
    await conn.execute(
      "UPDATE drivers SET status = 'available' WHERE id = ?",
      [trip.driver_id]
    );

    // Auto-create fuel_log row from the completed trip data
    const today = new Date().toISOString().split('T')[0];
    const fuelCost = parseFloat(fuel_consumed_liters) * 130; // approximate ₹/L — fine for demo
    await conn.execute(
      'INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES (?, ?, ?, ?, ?)',
      [trip.vehicle_id, trip.id, fuel_consumed_liters, fuelCost, today]
    );

    await conn.commit();
    conn.release();

    const [updated] = await db.query('SELECT * FROM trips WHERE id = ?', [trip.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
}

// POST /api/v1/trips/:id/cancel
// If dispatched: reset vehicle & driver to 'available'. If draft: just mark cancelled.
async function cancel(req, res, next) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[trip]] = await conn.execute('SELECT * FROM trips WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!trip) {
      await conn.rollback(); conn.release();
      return next(createError('Trip not found.', 404, 'NOT_FOUND'));
    }
    if (!['draft', 'dispatched'].includes(trip.status)) {
      await conn.rollback(); conn.release();
      return next(createError(
        `Cannot cancel a trip with status '${trip.status}'. Only 'draft' or 'dispatched' trips can be cancelled.`,
        400, 'VALIDATION_ERROR'
      ));
    }

    await conn.execute(
      "UPDATE trips SET status = 'cancelled', cancelled_at = NOW() WHERE id = ?",
      [trip.id]
    );

    // Only reset vehicle/driver if trip was actually dispatched (resources were reserved)
    if (trip.status === 'dispatched') {
      await conn.execute(
        "UPDATE vehicles SET status = 'available' WHERE id = ?",
        [trip.vehicle_id]
      );
      await conn.execute(
        "UPDATE drivers SET status = 'available' WHERE id = ?",
        [trip.driver_id]
      );
    }

    await conn.commit();
    conn.release();

    const [updated] = await db.query('SELECT * FROM trips WHERE id = ?', [trip.id]);
    res.json({ success: true, data: updated });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
}

module.exports = { list, getById, create, dispatch, complete, cancel };
