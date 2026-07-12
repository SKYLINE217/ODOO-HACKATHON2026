/**
 * Seed script — run with `npm run seed`
 * Generates proper bcrypt hashes and inserts demo data.
 * database.md §10: 1 user per role, 3 vehicles, 3 drivers, 2 trips, 1 maintenance log.
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const DEMO_PASSWORD = 'password123';
const BCRYPT_ROUNDS = 10;

async function seed() {
  const connection = await pool.getConnection();

  try {
    console.log('[Seed] Starting...');

    // Generate proper bcrypt hash
    const hash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
    console.log(`[Seed] Password hash generated for demo password "${DEMO_PASSWORD}"`);

    await connection.beginTransaction();

    // ── Clear existing data (reverse FK order) ──
    await connection.execute('DELETE FROM expenses');
    await connection.execute('DELETE FROM fuel_logs');
    await connection.execute('DELETE FROM maintenance_logs');
    await connection.execute('DELETE FROM trips');
    await connection.execute('DELETE FROM drivers');
    await connection.execute('DELETE FROM vehicles');
    await connection.execute('DELETE FROM users');

    // Reset auto-increment
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE vehicles AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE drivers AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE trips AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE maintenance_logs AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE fuel_logs AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE expenses AUTO_INCREMENT = 1');

    // ── Users: 1 per role ──
    await connection.execute(
      `INSERT INTO users (name, email, password_hash, role) VALUES
        (?, ?, ?, 'fleet_manager'),
        (?, ?, ?, 'driver'),
        (?, ?, ?, 'safety_officer'),
        (?, ?, ?, 'financial_analyst')`,
      [
        'Raven Kapoor',  'raven@transitops.com',  hash,
        'Arjun Mehta',   'arjun@transitops.com',  hash,
        'Priya Sharma',  'priya@transitops.com',  hash,
        'Neha Gupta',    'neha@transitops.com',   hash,
      ]
    );
    console.log('[Seed] 4 users created (1 per role)');

    // ── Vehicles: 3 with mixed statuses ──
    await connection.execute(
      `INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, status, region) VALUES
        ('MH-12-AB-1234', 'Tata Ace Gold',      'Truck', 1500.00, 45230.50, 750000.00, 'available', 'Mumbai'),
        ('DL-01-CD-5678', 'Mahindra Bolero',     'Van',    800.00, 32100.00, 550000.00, 'on_trip',   'Delhi'),
        ('KA-03-EF-9012', 'Ashok Leyland Dost',  'Truck', 2000.00, 78500.00, 900000.00, 'in_shop',   'Bangalore')`
    );
    console.log('[Seed] 3 vehicles created (available, on_trip, in_shop)');

    // ── Drivers: clean, expired license, suspended ──
    await connection.execute(
      `INSERT INTO drivers (user_id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES
        (2, 'Arjun Mehta',    'DL-2024-001234', 'HMV', '2027-06-15', '+91-9876543210', 95.5, 'available'),
        (NULL, 'Vikram Singh', 'MH-2022-005678', 'LMV', '2025-01-10', '+91-9876543211', 72.0, 'off_duty'),
        (NULL, 'Rahul Verma',  'KA-2023-009012', 'HMV', '2027-12-31', '+91-9876543212', 40.0, 'suspended')`
    );
    console.log('[Seed] 3 drivers created (available, expired-license/off_duty, suspended)');

    // ── Trips: 2 completed ──
    await connection.execute(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_liters, revenue, status, created_by, dispatched_at, completed_at) VALUES
        ('Mumbai Warehouse', 'Pune Depot',     1, 1, 1200.00, 150.00, 155.50, 22.00, 15000.00, 'completed', 1, '2026-07-10 08:00:00', '2026-07-10 14:30:00'),
        ('Delhi Hub',        'Jaipur Terminal', 2, 1,  500.00, 280.00, 285.00, 38.50, 28000.00, 'completed', 1, '2026-07-09 06:00:00', '2026-07-09 16:00:00')`
    );
    console.log('[Seed] 2 completed trips created');

    // ── Maintenance: 1 active (vehicle 3 = in_shop) ──
    await connection.execute(
      `INSERT INTO maintenance_logs (vehicle_id, type, description, cost, status) VALUES
        (3, 'Engine Overhaul', 'Complete engine rebuild — cylinder head gasket failure', 45000.00, 'active')`
    );
    console.log('[Seed] 1 active maintenance log created');

    // ── Fuel logs ──
    await connection.execute(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES
        (1, 1, 22.00, 2200.00, '2026-07-10'),
        (2, 2, 38.50, 3850.00, '2026-07-09')`
    );
    console.log('[Seed] 2 fuel logs created');

    // ── Expenses ──
    await connection.execute(
      `INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date, description) VALUES
        (1, 1, 'toll',  350.00, '2026-07-10', 'Mumbai-Pune Expressway toll'),
        (2, 2, 'toll',  500.00, '2026-07-09', 'Delhi-Jaipur NH48 toll'),
        (3, NULL, 'maintenance', 45000.00, '2026-07-11', 'Engine overhaul parts + labor')`
    );
    console.log('[Seed] 3 expenses created');

    await connection.commit();
    console.log('\n[Seed] ✅ All seed data inserted successfully!');
    console.log('\n[Seed] Demo credentials:');
    console.log('  fleet_manager:     raven@transitops.com  / password123');
    console.log('  driver:            arjun@transitops.com  / password123');
    console.log('  safety_officer:    priya@transitops.com  / password123');
    console.log('  financial_analyst: neha@transitops.com   / password123');
  } catch (err) {
    await connection.rollback();
    console.error('[Seed] ❌ Error:', err.message);
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
