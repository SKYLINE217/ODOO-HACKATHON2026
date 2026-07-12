# database.md — MySQL Schema (Single Source of Truth)

Owner: **Dev A**. Nobody else edits this file — if backend/frontend need a new field, they ask Dev A to add it here first.

Engine: MySQL 8, `InnoDB`, `utf8mb4_unicode_ci`.

## 0. Canonical enums (used verbatim everywhere — DB, API, frontend)

| Enum | Values (exact strings) |
|---|---|
| `user_role` | `fleet_manager`, `driver`, `safety_officer`, `financial_analyst` |
| `vehicle_status` | `Available`, `On Trip`, `In Shop`, `Retired` |
| `driver_status` | `Available`, `On Trip`, `Off Duty` |
| `driver_safety_status` | `Available`, `On Trip`, `Suspended` |
| `trip_status` | `Draft`, `Dispatched`, `Completed`, `Cancelled` |
| `maintenance_status` | `Active`, `Completed` |
| `vehicle_type` | `Van`, `Truck`, `Mini` |

## 1. `users`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('fleet_manager','driver','safety_officer','financial_analyst') NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

## 2. `vehicles`
```sql
CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reg_no VARCHAR(50) NOT NULL UNIQUE,
  name_model VARCHAR(100) NOT NULL,
  type ENUM('Van', 'Truck', 'Mini') NOT NULL,
  capacity VARCHAR(50) NOT NULL,
  capacity_kg INT NOT NULL DEFAULT 0,
  odometer INT NOT NULL DEFAULT 0,
  acquisition_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('Available', 'On Trip', 'In Shop', 'Retired') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

## 3. `drivers`
```sql
CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  license_no VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  license_expiry DATE NOT NULL,
  contact VARCHAR(50) NOT NULL,
  safety_status ENUM('Available', 'On Trip', 'Suspended') NOT NULL DEFAULT 'Available',
  status ENUM('Available', 'On Trip', 'Off Duty') NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

## 4. `trips`
```sql
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_code VARCHAR(50) NOT NULL UNIQUE,
  source VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  vehicle_id INT,
  driver_id INT,
  cargo_weight_kg INT NOT NULL DEFAULT 0,
  planned_distance_km INT NOT NULL DEFAULT 0,
  status ENUM('Draft', 'Dispatched', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Draft',
  eta VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB;
```

## 5. `maintenance_records`
```sql
CREATE TABLE maintenance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_type VARCHAR(255) NOT NULL,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  service_date DATE NOT NULL,
  status ENUM('Active', 'Completed') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

## 6. `fuel_logs`
```sql
CREATE TABLE fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  log_date DATE NOT NULL,
  liters DECIMAL(8,2) NOT NULL DEFAULT 0,
  fuel_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```

## 7. `expenses`
```sql
CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT,
  vehicle_id INT,
  toll DECIMAL(12,2) NOT NULL DEFAULT 0,
  other DECIMAL(12,2) NOT NULL DEFAULT 0,
  maint_linked DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
) ENGINE=InnoDB;
```

## 8. `settings`
```sql
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  depot_name VARCHAR(255) NOT NULL,
  currency VARCHAR(50) NOT NULL,
  distance_unit VARCHAR(50) NOT NULL
) ENGINE=InnoDB;
```

## 9. `vehicle_locations`
```sql
CREATE TABLE vehicle_locations (
  vehicle_id INT PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
```
