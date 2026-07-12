# backend.md — API Contract & Business Rules

Owner: **Dev A**. This is what Dev C (frontend) codes against and what Dev B's `requireAuth`/`requireRole` middleware wraps. Any endpoint change here must be announced to the team, not silently changed.

## 0. Stack & structure

- Node.js + Express, MySQL via `mysql2` or an ORM (Sequelize/Prisma) — team's choice, locked at kickoff.
- Suggested folder layout:
```
/src
  /config       (db connection, env)
  /middleware   (auth, roles — owned by Dev B, dropped in here)
  /routes       (vehicles.js, drivers.js, trips.js, maintenance.js, fuel.js, expenses.js, reports.js)
  /controllers
  /models
  app.js
  server.js
```
- Base URL: `/api/v1`
- All protected routes require header: `Authorization: Bearer <jwt>` (see `authentication-signin.md`)

## 1. Response envelope (fixed — every endpoint uses this shape)

Success:
```json
{ "success": true, "data": { ... } }
```
Error:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Cargo weight exceeds vehicle capacity" } }
```
Standard HTTP codes: `200` OK, `201` Created, `400` validation error, `401` unauthenticated, `403` forbidden (role), `404` not found, `409` conflict (e.g. duplicate registration number).

## 2. Vehicles — `/api/v1/vehicles`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | all authenticated | query params: `?type=&status=&region=` |
| GET | `/:id` | all authenticated | |
| POST | `/` | fleet_manager | body: `registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, region`. Reject if `registration_number` already exists → `409` |
| PUT | `/:id` | fleet_manager | |
| PATCH | `/:id/status` | fleet_manager | manual status override, e.g. retiring a vehicle |
| GET | `/dispatch-pool` | fleet_manager, driver | returns only vehicles with `status = 'available'` — this is what trip creation UI calls, never the raw `/` list |

## 3. Drivers — `/api/v1/drivers`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | all authenticated | filters: `?status=` |
| GET | `/:id` | all authenticated | |
| POST | `/` | fleet_manager, safety_officer | body: `name, license_number, license_category, license_expiry_date, contact_number` |
| PUT | `/:id` | fleet_manager, safety_officer | |
| PATCH | `/:id/status` | safety_officer | e.g. suspend a driver |
| GET | `/dispatch-pool` | fleet_manager, driver | returns only drivers with `status = 'available' AND license_expiry_date > CURDATE()` |

## 4. Trips — `/api/v1/trips`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | all authenticated | filters: `?status=` |
| GET | `/:id` | all authenticated | |
| POST | `/` | driver, fleet_manager | creates in `draft` status. Body: `source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km` |
| POST | `/:id/dispatch` | driver, fleet_manager | see validation chain below |
| POST | `/:id/complete` | driver, fleet_manager | body: `actual_distance_km, fuel_consumed_liters, revenue?` |
| POST | `/:id/cancel` | driver, fleet_manager | only if status is `dispatched` or `draft` |

### Dispatch validation chain (enforced server-side, in this order — return `400` on first failure)

1. Vehicle exists and `status = 'available'` (reject `in_shop`/`retired`/`on_trip`)
2. Driver exists, `status = 'available'`, and `license_expiry_date > CURDATE()` (reject expired/suspended/on_trip/off_duty)
3. `cargo_weight_kg <= vehicle.max_load_capacity_kg`
4. On pass: set `trips.status = 'dispatched'`, `dispatched_at = NOW()`, `vehicles.status = 'on_trip'`, `drivers.status = 'on_trip'` — **all in one DB transaction**.

### Complete
- Sets `trips.status = 'completed'`, `completed_at = NOW()`, stores `actual_distance_km`/`fuel_consumed_liters`, updates `vehicles.odometer_km += actual_distance_km`, and resets `vehicles.status = 'available'`, `drivers.status = 'available'` — one transaction.
- Optionally auto-creates a `fuel_logs` row from the entered fuel consumed.

### Cancel
- If trip was `dispatched`: reset `vehicles.status = 'available'`, `drivers.status = 'available'`. If it was still `draft`, just mark cancelled, no status side-effects (nothing was ever reserved).

## 5. Maintenance — `/api/v1/maintenance`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | fleet_manager, financial_analyst | filters `?vehicle_id=&status=` |
| POST | `/` | fleet_manager | body: `vehicle_id, type, description, cost`. Creates with `status='active'` → **side effect: sets `vehicles.status = 'in_shop'`** in the same transaction |
| POST | `/:id/close` | fleet_manager | sets `status='closed'`, `closed_at=NOW()` → **side effect: sets `vehicles.status = 'available'` UNLESS vehicle status was manually `retired`** |

## 6. Fuel logs — `/api/v1/fuel-logs`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | fleet_manager, financial_analyst | filters `?vehicle_id=` |
| POST | `/` | fleet_manager, driver | body: `vehicle_id, trip_id?, liters, cost, log_date` |

## 7. Expenses — `/api/v1/expenses`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/` | financial_analyst, fleet_manager | filters `?vehicle_id=&type=` |
| POST | `/` | fleet_manager, financial_analyst | body: `vehicle_id?, trip_id?, type, amount, expense_date, description` |

## 8. Dashboard — `/api/v1/dashboard`

`GET /api/v1/dashboard` — all authenticated. Returns:
```json
{
  "active_vehicles": 12,
  "available_vehicles": 7,
  "vehicles_in_maintenance": 2,
  "active_trips": 4,
  "pending_trips": 3,
  "drivers_on_duty": 5,
  "fleet_utilization_pct": 33.3
}
```
Supports the same `?type=&status=&region=` filters as the vehicle list.

## 9. Reports — `/api/v1/reports`

| Method | Path | Roles | Notes |
|---|---|---|---|
| GET | `/fuel-efficiency` | fleet_manager, financial_analyst | per-vehicle `distance/fuel` |
| GET | `/utilization` | fleet_manager, financial_analyst | fleet-wide % over a date range |
| GET | `/operational-cost` | financial_analyst | per-vehicle fuel+maintenance total |
| GET | `/roi` | financial_analyst | per-vehicle ROI per formula in `database.md` §9 |
| GET | `/export.csv?report=<name>` | financial_analyst | CSV export of any of the above |

## 10. Auth endpoints

Owned/documented by Dev B in `authentication-signin.md` — this file only assumes `POST /api/v1/auth/login`, `POST /api/v1/auth/signup`, `GET /api/v1/auth/me` exist and that `req.user = { id, role }` is available in every controller after the `requireAuth` middleware runs.
