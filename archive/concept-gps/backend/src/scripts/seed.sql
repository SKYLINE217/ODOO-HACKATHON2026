-- =====================================================
-- TransitOps — Seed Data
-- database.md §10: minimum seed for demo
-- Passwords are bcrypt hashes of "password123" (10 rounds)
-- =====================================================

USE transitops;

-- ── 1 user per role (database.md §10) ──
-- Password: "password123" for all demo users
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Raven Kapoor',   'raven@transitops.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'fleet_manager'),
  ('Arjun Mehta',    'arjun@transitops.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'driver'),
  ('Priya Sharma',   'priya@transitops.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'safety_officer'),
  ('Neha Gupta',     'neha@transitops.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'financial_analyst');

-- ── 3 vehicles (mixed statuses) ──
INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, status, region) VALUES
  ('MH-12-AB-1234', 'Tata Ace Gold',      'Truck', 1500.00, 45230.50, 750000.00, 'available', 'Mumbai'),
  ('DL-01-CD-5678', 'Mahindra Bolero',     'Van',   800.00,  32100.00, 550000.00, 'on_trip',   'Delhi'),
  ('KA-03-EF-9012', 'Ashok Leyland Dost',  'Truck', 2000.00, 78500.00, 900000.00, 'in_shop',   'Bangalore');

-- ── 3 drivers (one clean, one expired license, one suspended) ──
INSERT INTO drivers (user_id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES
  (2, 'Arjun Mehta',    'DL-2024-001234', 'HMV', '2027-06-15', '+91-9876543210', 95.5, 'available'),
  (NULL, 'Vikram Singh', 'MH-2022-005678', 'LMV', '2025-01-10', '+91-9876543211', 72.0, 'off_duty'),
  (NULL, 'Rahul Verma',  'KA-2023-009012', 'HMV', '2027-12-31', '+91-9876543212', 40.0, 'suspended');

-- ── 2 completed trips ──
INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, actual_distance_km, fuel_consumed_liters, revenue, status, created_by, dispatched_at, completed_at) VALUES
  ('Mumbai Warehouse', 'Pune Depot',       1, 1, 1200.00, 150.00, 155.50, 22.00, 15000.00, 'completed', 1, '2026-07-10 08:00:00', '2026-07-10 14:30:00'),
  ('Delhi Hub',        'Jaipur Terminal',   2, 1,  500.00, 280.00, 285.00, 38.50, 28000.00, 'completed', 1, '2026-07-09 06:00:00', '2026-07-09 16:00:00');

-- ── 1 active maintenance log (vehicle 3 is in_shop) ──
INSERT INTO maintenance_logs (vehicle_id, type, description, cost, status) VALUES
  (3, 'Engine Overhaul', 'Complete engine rebuild — cylinder head gasket failure', 45000.00, 'active');

-- ── Some fuel logs for completed trips ──
INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES
  (1, 1, 22.00, 2200.00, '2026-07-10'),
  (2, 2, 38.50, 3850.00, '2026-07-09');

-- ── Sample expenses ──
INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date, description) VALUES
  (1, 1, 'toll',  350.00, '2026-07-10', 'Mumbai-Pune Expressway toll'),
  (2, 2, 'toll',  500.00, '2026-07-09', 'Delhi-Jaipur NH48 toll'),
  (3, NULL, 'maintenance', 45000.00, '2026-07-11', 'Engine overhaul parts + labor');
