-- =====================================================
-- TransitOps — MySQL Schema
-- Source of truth: database.md
-- Run order: users → vehicles → drivers → trips →
--            maintenance_logs → fuel_logs → expenses
-- SKILL-database.md §3: order respects FK dependencies
-- =====================================================

CREATE DATABASE IF NOT EXISTS transitops
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE transitops;

-- §1. users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('fleet_manager','driver','safety_officer','financial_analyst') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- §2. vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_number VARCHAR(30) NOT NULL UNIQUE,
  name_model VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  max_load_capacity_kg DECIMAL(10,2) NOT NULL,
  odometer_km DECIMAL(12,2) NOT NULL DEFAULT 0,
  acquisition_cost DECIMAL(12,2) NOT NULL,
  status ENUM('available','on_trip','in_shop','retired') NOT NULL DEFAULT 'available',
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- §3. drivers
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) NOT NULL UNIQUE,
  license_category VARCHAR(20) NOT NULL,
  license_expiry_date DATE NOT NULL,
  contact_number VARCHAR(20),
  safety_score DECIMAL(4,1) NOT NULL DEFAULT 100.0,
  status ENUM('available','on_trip','off_duty','suspended') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_drivers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- §4. trips
CREATE TABLE IF NOT EXISTS trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  cargo_weight_kg DECIMAL(10,2) NOT NULL,
  planned_distance_km DECIMAL(10,2) NOT NULL,
  actual_distance_km DECIMAL(10,2) NULL,
  fuel_consumed_liters DECIMAL(10,2) NULL,
  revenue DECIMAL(12,2) NULL,
  status ENUM('draft','dispatched','completed','cancelled') NOT NULL DEFAULT 'draft',
  created_by INT NOT NULL,
  dispatched_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
  CONSTRAINT fk_trips_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

-- §5. maintenance_logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('active','closed') NOT NULL DEFAULT 'active',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_maint_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB;

-- §6. fuel_logs
CREATE TABLE IF NOT EXISTS fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_id INT NULL,
  liters DECIMAL(10,2) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_fuel_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
) ENGINE=InnoDB;

-- §7. expenses
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NULL,
  trip_id INT NULL,
  type ENUM('toll','maintenance','other') NOT NULL DEFAULT 'other',
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_expense_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_expense_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
) ENGINE=InnoDB;

-- §8. vehicle_locations (GPS Tracking)
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_id INT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_locations_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_locations_trip FOREIGN KEY (trip_id) REFERENCES trips(id)
) ENGINE=InnoDB;
