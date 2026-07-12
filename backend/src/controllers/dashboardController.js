'use strict';

/**
 * Dashboard data controller — serves all dashboard module data.
 * Each function queries the database and returns structured data
 * for the frontend dashboard pages.
 */

const db = require('../config/db');

// ── Vehicles ──────────────────────────────────────────────────

exports.getVehicles = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (type && type !== 'All') {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (reg_no LIKE ? OR name_model LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY id ASC';
    const rows = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const { reg_no, name_model, type, capacity, capacity_kg, odometer, acquisition_cost } = req.body;
    if (!reg_no || !name_model || !type || !capacity) {
      return res.status(400).json({ success: false, error: { message: 'Missing required fields.' } });
    }
    await db.query(
      'INSERT INTO vehicles (reg_no, name_model, type, capacity, capacity_kg, odometer, acquisition_cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [reg_no, name_model, type, capacity, capacity_kg || 0, odometer || 0, acquisition_cost || 0]
    );
    res.status(201).json({ success: true, data: { message: 'Vehicle created.' } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: { message: 'Registration number already exists.' } });
    }
    next(err);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, odometer } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (odometer !== undefined) { updates.push('odometer = ?'); params.push(odometer); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No fields to update.' } });
    }

    params.push(id);
    const result = await db.query(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: { message: 'Vehicle not found.' } });
    }
    res.json({ success: true, data: { message: 'Vehicle updated.' } });
  } catch (err) { next(err); }
};

// ── Drivers ───────────────────────────────────────────────────

exports.getDrivers = async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY id ASC';
    const rows = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.createDriver = async (req, res, next) => {
  try {
    const { name, license_no, category, license_expiry, contact } = req.body;
    if (!name || !license_no || !category || !license_expiry) {
      return res.status(400).json({ success: false, error: { message: 'Missing required fields.' } });
    }
    await db.query(
      'INSERT INTO drivers (name, license_no, category, license_expiry, contact) VALUES (?, ?, ?, ?, ?)',
      [name, license_no, category, license_expiry, contact || '']
    );
    res.status(201).json({ success: true, data: { message: 'Driver created.' } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: { message: 'License number already exists.' } });
    }
    next(err);
  }
};

exports.updateDriverStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, safety_status } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (safety_status) { updates.push('safety_status = ?'); params.push(safety_status); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No fields to update.' } });
    }

    params.push(id);
    const result = await db.query(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: { message: 'Driver not found.' } });
    }
    res.json({ success: true, data: { message: 'Driver updated.' } });
  } catch (err) { next(err); }
};

// ── Trips ─────────────────────────────────────────────────────

exports.getTrips = async (req, res, next) => {
  try {
    const sql = `
      SELECT t.*, v.name_model AS vehicle_name, v.reg_no, d.name AS driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `;
    const rows = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.createTrip = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km } = req.body;
    if (!source || !destination) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ success: false, error: { message: 'Source and destination are required.' } });
    }

    // Capacity validation
    if (vehicle_id && cargo_weight_kg) {
      const [rows] = await conn.execute('SELECT capacity_kg FROM vehicles WHERE id = ?', [vehicle_id]);
      const vehicle = rows[0];
      if (vehicle && cargo_weight_kg > vehicle.capacity_kg) {
        await conn.rollback(); conn.release();
        return res.status(400).json({
          success: false,
          error: {
            message: `Capacity exceeded by ${cargo_weight_kg - vehicle.capacity_kg} kg. Dispatch blocked.`,
            code: 'CAPACITY_EXCEEDED'
          }
        });
      }
    }

    const status = vehicle_id && driver_id ? 'Dispatched' : 'Draft';

    // Insert with a placeholder trip_code, then derive from AUTO_INCREMENT id (race-free)
    const [insertResult] = await conn.execute(
      'INSERT INTO trips (trip_code, source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['TEMP', source, destination, vehicle_id || null, driver_id || null, cargo_weight_kg || 0, planned_distance_km || 0, status]
    );
    const tripId = insertResult.insertId;
    const tripCode = 'TR' + String(tripId).padStart(3, '0');
    await conn.execute('UPDATE trips SET trip_code = ? WHERE id = ?', [tripCode, tripId]);

    // Update vehicle and driver status if dispatched
    if (status === 'Dispatched') {
      if (vehicle_id) await conn.execute("UPDATE vehicles SET status = 'On Trip' WHERE id = ?", [vehicle_id]);
      if (driver_id) await conn.execute("UPDATE drivers SET status = 'On Trip', safety_status = 'On Trip' WHERE id = ?", [driver_id]);
    }

    await conn.commit();
    conn.release();
    res.status(201).json({ success: true, data: { message: 'Trip created.', trip_code: tripCode, status } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

exports.updateTripStatus = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ success: false, error: { message: 'Status is required.' } });
    }

    const [rows] = await conn.execute('SELECT * FROM trips WHERE id = ?', [id]);
    const trip = rows[0];
    if (!trip) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ success: false, error: { message: 'Trip not found.' } });
    }

    await conn.execute('UPDATE trips SET status = ? WHERE id = ?', [status, id]);

    // On Complete/Cancel: free up vehicle and driver
    if (status === 'Completed' || status === 'Cancelled') {
      if (trip.vehicle_id) await conn.execute("UPDATE vehicles SET status = 'Available' WHERE id = ?", [trip.vehicle_id]);
      if (trip.driver_id) await conn.execute("UPDATE drivers SET status = 'Available', safety_status = 'Available' WHERE id = ?", [trip.driver_id]);
    }

    await conn.commit();
    conn.release();
    res.json({ success: true, data: { message: `Trip status updated to ${status}.` } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// ── Maintenance ───────────────────────────────────────────────

exports.getMaintenance = async (req, res, next) => {
  try {
    const sql = `
      SELECT m.*, v.name_model AS vehicle_name
      FROM maintenance_records m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.id DESC
    `;
    const rows = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.createMaintenance = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { vehicle_id, service_type, cost, service_date, status } = req.body;
    if (!vehicle_id || !service_type || !cost || !service_date) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ success: false, error: { message: 'Missing required fields.' } });
    }

    await conn.execute(
      'INSERT INTO maintenance_records (vehicle_id, service_type, cost, service_date, status) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, service_type, cost, service_date, status || 'Active']
    );

    // Set vehicle to "In Shop" when maintenance is active
    if (!status || status === 'Active') {
      await conn.execute("UPDATE vehicles SET status = 'In Shop' WHERE id = ?", [vehicle_id]);
    }

    await conn.commit();
    conn.release();
    res.status(201).json({ success: true, data: { message: 'Maintenance record created.' } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

exports.updateMaintenance = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ success: false, error: { message: 'Status is required.' } });
    }

    const [rows] = await conn.execute('SELECT * FROM maintenance_records WHERE id = ?', [id]);
    const record = rows[0];
    if (!record) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ success: false, error: { message: 'Record not found.' } });
    }

    await conn.execute('UPDATE maintenance_records SET status = ? WHERE id = ?', [status, id]);

    // When completed, set vehicle back to Available
    if (status === 'Completed' && record.vehicle_id) {
      await conn.execute("UPDATE vehicles SET status = 'Available' WHERE id = ?", [record.vehicle_id]);
    }

    await conn.commit();
    conn.release();
    res.json({ success: true, data: { message: 'Maintenance record updated.' } });
  } catch (err) {
    await conn.rollback();
    conn.release();
    next(err);
  }
};

// ── Fuel Logs ─────────────────────────────────────────────────

exports.getFuelLogs = async (req, res, next) => {
  try {
    const sql = `
      SELECT f.*, v.name_model AS vehicle_name
      FROM fuel_logs f
      LEFT JOIN vehicles v ON f.vehicle_id = v.id
      ORDER BY f.log_date DESC
    `;
    const rows = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.createFuelLog = async (req, res, next) => {
  try {
    const { vehicle_id, log_date, liters, fuel_cost } = req.body;
    if (!vehicle_id || !log_date || !liters || !fuel_cost) {
      return res.status(400).json({ success: false, error: { message: 'Missing required fields.' } });
    }
    await db.query(
      'INSERT INTO fuel_logs (vehicle_id, log_date, liters, fuel_cost) VALUES (?, ?, ?, ?)',
      [vehicle_id, log_date, liters, fuel_cost]
    );
    res.status(201).json({ success: true, data: { message: 'Fuel log created.' } });
  } catch (err) { next(err); }
};

// ── Expenses ──────────────────────────────────────────────────

exports.getExpenses = async (req, res, next) => {
  try {
    const sql = `
      SELECT e.*, t.trip_code, v.name_model AS vehicle_name, t.status AS trip_status
      FROM expenses e
      LEFT JOIN trips t ON e.trip_id = t.id
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY e.id DESC
    `;
    const rows = await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { trip_id, vehicle_id, toll, other, maint_linked } = req.body;
    const total = (parseFloat(toll) || 0) + (parseFloat(other) || 0) + (parseFloat(maint_linked) || 0);
    await db.query(
      'INSERT INTO expenses (trip_id, vehicle_id, toll, other, maint_linked, total) VALUES (?, ?, ?, ?, ?, ?)',
      [trip_id || null, vehicle_id || null, toll || 0, other || 0, maint_linked || 0, total]
    );
    res.status(201).json({ success: true, data: { message: 'Expense created.' } });
  } catch (err) { next(err); }
};

// ── Analytics / Dashboard Summary ─────────────────────────────

exports.getDashboardSummary = async (req, res, next) => {
  try {
    // Run all independent queries in parallel
    const [
      [vehicles],
      [available],
      [inMaint],
      [activeTrips],
      [pendingTrips],
      [driversOnDuty],
      statusBreakdown,
      recentTrips
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM vehicles'),
      db.query("SELECT COUNT(*) as total FROM vehicles WHERE status = 'Available'"),
      db.query("SELECT COUNT(*) as total FROM vehicles WHERE status = 'In Shop'"),
      db.query("SELECT COUNT(*) as total FROM trips WHERE status IN ('Dispatched')"),
      db.query("SELECT COUNT(*) as total FROM trips WHERE status = 'Draft'"),
      db.query("SELECT COUNT(*) as total FROM drivers WHERE status IN ('Available', 'On Trip')"),
      db.query("SELECT status, COUNT(*) as count FROM vehicles GROUP BY status ORDER BY FIELD(status, 'Available','On Trip','In Shop','Retired')"),
      db.query(`
        SELECT t.trip_code, v.name_model AS vehicle, d.name AS driver, t.status, t.eta
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN drivers d ON t.driver_id = d.id
        ORDER BY t.id DESC LIMIT 6
      `)
    ]);

    const totalVehicles = vehicles.total || 0;
    const availableVehicles = available.total || 0;
    const utilization = totalVehicles > 0 ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100) : 0;

    res.json({
      success: true,
      data: {
        stats: {
          active_vehicles: totalVehicles,
          available_vehicles: availableVehicles,
          vehicles_in_maintenance: inMaint.total || 0,
          active_trips: activeTrips.total || 0,
          pending_trips: pendingTrips.total || 0,
          drivers_on_duty: driversOnDuty.total || 0,
          fleet_utilization: utilization,
        },
        vehicle_status: statusBreakdown,
        recent_trips: recentTrips,
      },
    });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    // Run all independent queries in parallel
    const [
      [totalFuel],
      [totalDist],
      [vehicles],
      [available],
      [totalMaint],
      [totalAcq],
      costliestVehicles,
      monthlyData
    ] = await Promise.all([
      db.query('SELECT SUM(liters) as total_liters, SUM(fuel_cost) as total_fuel_cost FROM fuel_logs'),
      db.query("SELECT SUM(planned_distance_km) as total_km FROM trips WHERE status = 'Completed'"),
      db.query('SELECT COUNT(*) as total FROM vehicles'),
      db.query("SELECT COUNT(*) as total FROM vehicles WHERE status = 'Available'"),
      db.query('SELECT SUM(cost) as total FROM maintenance_records'),
      db.query('SELECT SUM(acquisition_cost) as total FROM vehicles'),
      db.query(`
        SELECT v.name_model,
          COALESCE((SELECT SUM(cost) FROM maintenance_records WHERE vehicle_id = v.id), 0) +
          COALESCE((SELECT SUM(fuel_cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) as total_cost
        FROM vehicles v
        ORDER BY total_cost DESC
        LIMIT 5
      `),
      db.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month,
               COUNT(*) as trips,
               SUM(planned_distance_km) as km
        FROM trips
        WHERE status = 'Completed'
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
        LIMIT 12
      `)
    ]);

    const fuelEfficiency = (totalFuel.total_liters && totalDist.total_km)
      ? (parseFloat(totalDist.total_km) / parseFloat(totalFuel.total_liters)).toFixed(1) : '0.0';

    const totalVehicles = vehicles.total || 1;
    const utilization = Math.round(((totalVehicles - (available.total || 0)) / totalVehicles) * 100);

    const operationalCost = (parseFloat(totalFuel.total_fuel_cost) || 0) + (parseFloat(totalMaint.total) || 0);
    const roi = totalAcq.total ? ((operationalCost / parseFloat(totalAcq.total)) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      data: {
        fuel_efficiency: fuelEfficiency + ' km/l',
        fleet_utilization: utilization + '%',
        operational_cost: operationalCost,
        vehicle_roi: roi + '%',
        costliest_vehicles: costliestVehicles,
        monthly_revenue: monthlyData,
      },
    });
  } catch (err) { next(err); }
};

// ── Settings ──────────────────────────────────────────────────

exports.getSettings = async (req, res, next) => {
  try {
    const rows = await db.query('SELECT * FROM settings LIMIT 1');
    const settings = rows[0] || { depot_name: 'Gandhinagar Depot GJ4', currency: 'INR (Rs.)', distance_unit: 'Kilometers' };
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { depot_name, currency, distance_unit } = req.body;
    const rows = await db.query('SELECT id FROM settings LIMIT 1');

    if (rows.length > 0) {
      await db.query(
        'UPDATE settings SET depot_name = ?, currency = ?, distance_unit = ? WHERE id = ?',
        [depot_name, currency, distance_unit, rows[0].id]
      );
    } else {
      await db.query(
        'INSERT INTO settings (depot_name, currency, distance_unit) VALUES (?, ?, ?)',
        [depot_name, currency, distance_unit]
      );
    }
    res.json({ success: true, data: { message: 'Settings saved.' } });
  } catch (err) { next(err); }
};

// ── User Profile ──────────────────────────────────────────────

exports.getUserProfile = async (req, res, next) => {
  try {
    const [user] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) { updates.push('email = ?'); params.push(email); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No fields to update.' } });
    }

    params.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    
    // Fetch updated user to return
    const [updated] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: { message: 'Email already in use.' } });
    }
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: { message: 'Both current and new passwords are required.' } });
    }
    if (new_password.length < 8) {
      return res.status(400).json({ success: false, error: { message: 'New password must be at least 8 characters.' } });
    }

    const [user] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: { message: 'Current password is incorrect.' } });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
    res.json({ success: true, data: { message: 'Password changed successfully.' } });
  } catch (err) { next(err); }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Ensure the user exists
    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found.' } });
    }

    // Delete user from db
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    // We could also delete related records in drivers/trips/etc. but for this prototype just deleting the user is fine, or set their role to disabled.
    res.json({ success: true, data: { message: 'Account deleted successfully.' } });
  } catch (err) { next(err); }
};

exports.exportCsv = async (req, res, next) => {
  try {
    const table = req.params.table;
    const allowedTables = ['trips', 'expenses', 'fuel_logs', 'vehicles', 'drivers'];
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid table for export.' } });
    }

    const rows = await db.query(`SELECT * FROM ${table} ORDER BY id DESC`);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'No data to export.' } });
    }

    // Convert JSON to CSV
    const header = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(row => {
      return Object.values(row).map(val => {
        // Simple escaping for CSV: replace null with empty, wrap in quotes if contains comma
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',');
    });

    const csvData = [header, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${table}_export_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvData);
  } catch (err) { next(err); }
};
