# database.md — MySQL Schema (Single Source of Truth)

Owner: **Dev A**. Nobody else edits this file — if backend/frontend need a new field, they ask Dev A to add it here first.

Engine: MySQL 8, `InnoDB`, `utf8mb4_unicode_ci`.

## 0. Canonical enums (used verbatim everywhere — DB, API, frontend)

| Enum | Values (exact strings) |
|---|---|
| `user_role` | `fleet_manager`, `driver`, `safety_officer`, `financial_analyst` |
| `vehicle_status` | `available`, `on_trip`, `in_shop`, `retired` |
| `driver_status` | `available`, `on_trip`, `off_duty`, `suspended` |
| `trip_status` | `draft`, `dispatched`, `completed`, `cancelled` |
| `maintenance_status` | `active`, `closed` |
| `expense_type` | `toll`, `maintenance`, `other` |

Do not use "Available"/"AVAILABLE" in one layer and "available" in another — always lowercase snake_case, matching this table exactly.

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
  registration_number VARCHAR(30) NOT NULL UNIQUE,
  name_model VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,          -- e.g. Truck, Van, Bike
  max_load_capacity_kg DECIMAL(10,2) NOT NULL,
  odometer_km DECIMAL(12,2) NOT NULL DEFAULT 0,
  acquisition_cost DECIMAL(12,2) NOT NULL,
  status ENUM('available','on_trip','in_shop','retired') NOT NULL DEFAULT 'available',
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

## 3. `drivers`

```sql
CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,                    -- links to a users row IF the driver also logs in; nullable otherwise
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
```

## 4. `trips`

```sql
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  cargo_weight_kg DECIMAL(10,2) NOT NULL,
  planned_distance_km DECIMAL(10,2) NOT NULL,
  actual_distance_km DECIMAL(10,2) NULL,       -- filled on completion
  fuel_consumed_liters DECIMAL(10,2) NULL,     -- filled on completion
  revenue DECIMAL(12,2) NULL,                  -- optional, used for ROI report
  status ENUM('draft','dispatched','completed','cancelled') NOT NULL DEFAULT 'draft',
  created_by INT NOT NULL,                     -- users.id
  dispatched_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_trips_driver FOREIGN KEY (driver_id) REFERENCES drivers(id),
  CONSTRAINT fk_trips_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
```

## 5. `maintenance_logs`

```sql
CREATE TABLE maintenance_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,           -- e.g. Oil Change, Tire Rotation
  description TEXT,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('active','closed') NOT NULL DEFAULT 'active',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_maint_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
) ENGINE=InnoDB;
```

## 6. `fuel_logs`

```sql
CREATE TABLE fuel_logs (
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
```

## 7. `expenses`

```sql
CREATE TABLE expenses (
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
```

## 8. Relationships (ERD in words)

- `users` 1—0..1 `drivers` (a driver *may* have a login account)
- `vehicles` 1—N `trips`, `vehicles` 1—N `maintenance_logs`, `vehicles` 1—N `fuel_logs`, `vehicles` 1—N `expenses`
- `drivers` 1—N `trips`
- `trips` 1—0..N `fuel_logs`, `trips` 1—0..N `expenses`
- `users` 1—N `trips` (as `created_by`)

## 9. Derived/computed values (NOT stored — computed in backend, see `backend.md` §Reports)

- Fleet Utilization % = `on_trip vehicles / total non-retired vehicles`
- Fuel Efficiency = `SUM(actual_distance_km) / SUM(fuel_consumed_liters)` per vehicle
- Operational Cost per vehicle = `SUM(fuel_logs.cost) + SUM(maintenance_logs.cost)`
- Vehicle ROI = `(SUM(trips.revenue) - (SUM(maintenance.cost) + SUM(fuel.cost))) / vehicles.acquisition_cost`

## 10. Seed data checklist (for demo)

At minimum seed: 1 user per role, 3 vehicles (mixed statuses), 3 drivers (one with expired license, one suspended, one clean), 2 completed trips, 1 active maintenance log — this is what the "Example Workflow" in the spec walks through, and what the demo should show live.
