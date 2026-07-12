-- TransitOps — Seed data for demo
-- Run AFTER schema.sql
-- Passwords are bcrypt hashes of "Password123!" — Dev B should regenerate for real auth

USE transitops;

-- ============================================================
-- Users (1 per role)
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Alice Manager',   'alice@transitops.dev',    '$2b$10$X4kv7j5Z8nQ3rL0pM7uIieNi1P2nWp6VnKbVJ3VbBQvQ6V0X6F1Gu', 'fleet_manager'),
  ('Bob Driver',      'bob@transitops.dev',      '$2b$10$X4kv7j5Z8nQ3rL0pM7uIieNi1P2nWp6VnKbVJ3VbBQvQ6V0X6F1Gu', 'driver'),
  ('Carol Safety',    'carol@transitops.dev',    '$2b$10$X4kv7j5Z8nQ3rL0pM7uIieNi1P2nWp6VnKbVJ3VbBQvQ6V0X6F1Gu', 'safety_officer'),
  ('Dave Finance',    'dave@transitops.dev',     '$2b$10$X4kv7j5Z8nQ3rL0pM7uIieNi1P2nWp6VnKbVJ3VbBQvQ6V0X6F1Gu', 'financial_analyst');

-- ============================================================
-- Vehicles (3 — mixed statuses)
-- ============================================================
INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, status, region) VALUES
  ('TRK-001', 'Tata Prima 4028.S',   'Truck', 10000.00, 42500.00, 3500000.00, 'available', 'North'),
  ('VAN-002', 'Force Traveller 3350', 'Van',    1500.00,  8200.00,  850000.00, 'in_shop',   'South'),
  ('BIK-003', 'Hero Splendor+',       'Bike',    120.00,  15000.00,  75000.00, 'available', 'East');

-- ============================================================
-- Drivers (3 — one expired license, one suspended, one clean)
--   driver_id=1 links to user Bob (user_id=2)
-- ============================================================
INSERT INTO drivers (user_id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES
  (2,    'Bob Driver',    'LIC-2024-BOB',  'HGV',  '2027-12-31', '9876543210', 100.0, 'available'),
  (NULL, 'Priya Sharma',  'LIC-2019-PRI',  'LGV',  '2024-01-01', '9123456780',  72.0, 'available'),  -- expired license
  (NULL, 'Ravi Kumar',    'LIC-2022-RAV',  'HGV',  '2026-06-30', '9012345678',  85.0, 'suspended');  -- suspended

-- ============================================================
-- Trips (2 completed, 1 draft)
-- ============================================================
INSERT INTO trips
  (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km,
   actual_distance_km, fuel_consumed_liters, revenue, status, created_by,
   dispatched_at, completed_at)
VALUES
  ('Mumbai Depot', 'Pune Hub',    1, 1, 4500.00, 150.00, 152.30, 28.50, 18000.00, 'completed', 1, '2026-07-01 08:00:00', '2026-07-01 11:30:00'),
  ('Pune Hub',     'Nashik Yard', 1, 1, 3200.00, 210.00, 213.00, 38.00, 25000.00, 'completed', 1, '2026-07-03 07:00:00', '2026-07-03 12:45:00'),
  ('Mumbai Depot', 'Thane Stop',  3, 1,   80.00,  35.00, NULL,   NULL,  NULL,     'draft',     2, NULL,                  NULL);

-- ============================================================
-- Maintenance log (1 active — van is in shop)
-- ============================================================
INSERT INTO maintenance_logs (vehicle_id, type, description, cost, status) VALUES
  (2, 'Brake Pad Replacement', 'Front and rear brake pads worn out — replacing both axles.', 12500.00, 'active');

-- ============================================================
-- Fuel logs (linked to completed trips)
-- ============================================================
INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES
  (1, 1, 28.50, 3705.00, '2026-07-01'),
  (1, 2, 38.00, 4940.00, '2026-07-03');

-- ============================================================
-- Expenses (tolls on the two completed trips)
-- ============================================================
INSERT INTO expenses (vehicle_id, trip_id, type, amount, expense_date, description) VALUES
  (1, 1, 'toll', 320.00, '2026-07-01', 'Mumbai-Pune expressway toll'),
  (1, 2, 'toll', 450.00, '2026-07-03', 'Pune-Nashik highway toll');
