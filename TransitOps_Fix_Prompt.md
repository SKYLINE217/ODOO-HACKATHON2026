# Prompt: Fix TransitOps codebase (paste into Claude Code / your coding agent)

Copy everything below the line into Claude Code (or another coding agent) with the `Hackathon_backup` repo open as the working directory.

---

You are working in the `TransitOps` repository (Node/Express + MySQL backend, vanilla JS frontend — a fleet management platform). A code review has identified the issues below. Work through them **in the phase order given** — later phases depend on earlier ones being correct (e.g., you can't test RBAC fixes until the app actually boots). After each phase, verify your changes actually work before moving on (see "Verification" at the end of each phase) — don't just edit code and assume it's fixed.

Do not break any currently-working functionality (JWT auth, bcrypt hashing, parameterized queries, rate limiting on login, the RBAC UI-hiding logic, the Leaflet map rendering) — these parts are solid and should be preserved, not rewritten.

---

## Phase 1 — Make the app actually boot and run (P0)

1. **Fix `backend/initDb.js`**: its SQL-statement splitter treats any statement preceded by a `-- comment` header as a comment itself and silently skips it — this currently means `CREATE TABLE users` never runs. Replace the naive split-on-`;` parser with one that strips `-- comment` lines *before* splitting (e.g. `schemaSql.replace(/^--.*$/gm, '')` before `.split(';')`), or switch to executing the whole file in one call with `multipleStatements: true`. Verify by running `node initDb.js` then confirming `SHOW TABLES;` and `DESCRIBE users;` actually work against the target database.

2. **Rewrite `backend/schema.sql`** to define **all 8 tables** the application code actually queries: `users` (already correct), `vehicles`, `drivers`, `trips`, `maintenance_records`, `fuel_logs`, `expenses`, `settings`, and `vehicle_locations`. Base the column names on what `backend/src/controllers/dashboardController.js` and `trackingController.js` actually `SELECT`/`INSERT`/`UPDATE` (e.g. `reg_no`, `name_model`, `capacity`, `capacity_kg`, `license_no`, `category`, `trip_code`, etc.) — **not** on `docs/database.md`, which uses different names (`registration_number`, `max_load_capacity_kg`, `license_number`, `maintenance_logs`, lowercase snake_case status enums). Add appropriate `FOREIGN KEY` constraints, a `UNIQUE` constraint on `trip_code` and `reg_no`/`license_no`, and reasonable indexes (e.g. on `vehicle_locations.vehicle_id`, `trips.status`).

3. **Reconcile `docs/database.md` with the schema you just wrote** — update the doc to match reality (column names, table names, status value casing) so it's trustworthy going forward. Do the same reconciliation for `docs/backend.md` if it also documents field names.

4. **Fix the port mismatch**: `frontend/js/api.js` hardcodes `http://localhost:3005/api/v1` but `backend/server.js` and `.env.example` default to `PORT=3001`, and `README.md` claims `3005`. Pick **3001** as canonical (matches `.env.example` and code) and fix `README.md` to match. Additionally, stop hardcoding the API base URL in a committed JS file — read it from a small `config.js` that isn't hardcoded per-environment, or at minimum make it trivially findable/editable in one place with a comment explaining it must match `PORT`.

5. **Fix `DEMO_CREDENTIALS.md`** to match what `backend/src/config/seed.js` actually creates (`fleet@transitops.demo`, not `manager@transitops.demo`). Then **extend `seed.js`** to actually seed a realistic demo fleet — at minimum: 3+ vehicles in mixed statuses, 3+ drivers (including one with an expired license and one suspended), a couple of completed/dispatched trips, and one active maintenance record — so the dashboard isn't empty on first login. Only run this seeding when `process.env.NODE_ENV !== 'production'` (see Phase 2, item 6).

**Verification for Phase 1:** From a clean checkout, running `cp .env.example .env` → `node initDb.js` → `npm run dev` → opening the frontend must result in: successful login with the demo credentials exactly as documented, and a dashboard showing non-empty seeded data with no console/network errors.

---

## Phase 2 — Close live-exploitable security gaps (P0/P1)

1. **Enforce RBAC on every `GET` route in `backend/src/routes/dashboard.js`**, not just the mutating ones. Use the permission matrix in `docs/access-control.md` as the source of truth (e.g. `driver` must get `403` on `/expenses`, `/analytics`, `/settings`; only `fleet_manager` on `/settings`). Add `requireRole([...])` to each route accordingly. Write a quick script or manual test that logs in as each of the 4 roles and confirms every endpoint returns exactly the expected `200`/`403` per the matrix.

2. **Add a role check to `POST /api/v1/tracking`** in `backend/src/routes/tracking.js` — currently only `requireAuth` is applied. Restrict to `requireRole(['driver', 'fleet_manager'])`. Additionally, in `trackingController.updateLocation`, when the caller's role is `driver`, verify the `vehicle_id` in the request actually belongs to that driver's currently-dispatched trip before accepting the location update (reject with `403` otherwise) — don't let a driver post locations for arbitrary vehicles.

3. **Stop leaking raw database errors** in `backend/src/middleware/errorHandler.js`. Currently `err.message` is returned to the client for any error, including raw MySQL driver exceptions (e.g. `ER_NO_SUCH_TABLE`). Change it so only errors explicitly created via the existing `createError()` helper (i.e. ones with an application-set `statusCode`/`code`) return their message to the client; everything else should log the full error server-side and return a generic `{"code":"INTERNAL_ERROR","message":"An unexpected error occurred."}` with status 500.

4. **Restrict role selection at signup.** In `backend/src/controllers/authController.js`, don't let arbitrary users self-assign `fleet_manager` (or any elevated role) via `POST /auth/signup`. Either hardcode new signups to `role: 'driver'` regardless of what's submitted, or add an admin-only endpoint for creating privileged accounts. Update `frontend/js/signup.js` and `frontend/index.html` to remove the free-choice role selector accordingly (or restrict its options to only the safe default).

5. **Remove the hardcoded DB password fallback** in `backend/initDb.js` (`process.env.DB_PASS || 'Sumit123'`). Instead, throw a clear startup error if `DB_PASS` is not set, rather than silently defaulting to a real-looking credential.

6. **Gate demo-account seeding by environment.** In `backend/server.js`, wrap the `await seedDatabase()` call in `if (process.env.NODE_ENV !== 'production') { ... }` so known weak demo credentials are never auto-created in a production deployment.

7. **Fix the CORS configuration** in `backend/app.js`. `origin: process.env.CORS_ORIGIN || '*'` combined with `credentials: true` is an invalid combination per the CORS spec and silently breaks authenticated cross-origin requests. Require `CORS_ORIGIN` to be explicitly set (throw/log a warning at startup if it's missing), and never fall back to `'*'` while `credentials: true` is set.

8. **Add rate limiting to `POST /auth/signup`** in `backend/src/routes/auth.js`, similar to the existing login limiter but with more generous limits appropriate for account creation (e.g. 10 requests / hour / IP).

**Verification for Phase 2:** Log in as each of the 4 demo roles and, using `curl` (bypassing the frontend entirely), confirm every `GET`/`POST`/`PUT` endpoint under `/api/v1/dashboard` and `/api/v1/tracking` returns the correct `200` or `403` per `docs/access-control.md`. Confirm a deliberately-triggered DB error (e.g. temporarily rename a table) returns a generic message, not the raw driver error.

---

## Phase 3 — Data integrity (P1)

1. **Fix the trip-code race condition** in `dashboardController.createTrip`. The current `SELECT last trip_code` → increment → `INSERT` pattern is not atomic and produces duplicate codes under concurrent requests. Fix this by either: (a) wrapping the read+insert in a transaction using `SELECT ... FOR UPDATE` on a dedicated counter row, (b) adding a `UNIQUE` constraint on `trip_code` with catch-and-retry logic on conflict, or (c) deriving `trip_code` directly from the row's `AUTO_INCREMENT` `id` (e.g. `'TR' + String(id).padStart(3,'0')`, set via an `UPDATE` immediately after insert, or a generated column) so no separate read-then-write step is needed at all. Prefer option (c) if it fits the existing code cleanly — it eliminates the race by construction.

2. **Add real database transactions** to every controller function that performs more than one dependent write. Use the existing (currently unused) `db.getConnection()` helper in `backend/src/config/db.js` — pattern: acquire a connection, `connection.beginTransaction()`, run all statements on that connection, `commit()` on success / `rollback()` on any error, then `connection.release()`. Apply this to at minimum:
   - `createTrip` (insert trip + update vehicle status + update driver status)
   - `updateTripStatus` (update trip + update vehicle + update driver)
   - `createMaintenance` (insert record + update vehicle status)
   - `updateMaintenance` (update record + update vehicle status)

**Verification for Phase 3:** Write a small script (or reuse curl in a loop) that fires 15+ concurrent `POST /dashboard/trips` requests and confirms all resulting `trip_code` values are unique. Manually kill the DB connection mid-way through a `createTrip` call (or add a temporary forced error after the trip INSERT) and confirm the trip row is rolled back rather than left half-committed.

---

## Phase 4 — Make real-time GPS tracking actually real (P1)

1. **Fix the falsy-zero validation bug** in `trackingController.updateLocation`: `if (!vehicle_id || !latitude || !longitude)` incorrectly rejects a valid `0` coordinate. Replace with explicit type/range checks: reject only if `vehicle_id` is missing, or `latitude`/`longitude` are not numbers, or are outside `-90..90` / `-180..180` respectively.

2. **Wire up the driver side of tracking**, which currently does not exist. On the driver's dashboard (`frontend/js/dashboard.js`), when a driver has an active dispatched trip, use `navigator.geolocation.watchPosition()` (with appropriate permission-denied handling and a fallback message if geolocation is unavailable) to get real coordinates, and `POST` them to `/api/v1/tracking` on a reasonable interval (e.g. every 10–15 seconds, or on significant movement). Remove the fake `indianCities` random-city-cycling code in `loadDashboardSummary()` entirely — it currently simulates a live location without ever touching the backend, which is misleading.

3. **Replace 15-second polling with push-based updates** for the fleet manager's live map. Add a WebSocket (Socket.IO recommended, given the Express base) or SSE channel: when `POST /api/v1/tracking` successfully updates a location, broadcast that update to connected fleet-manager clients immediately, instead of having every open dashboard tab poll `GET /tracking/active` independently every 15 seconds. Keep a lightweight periodic poll as a fallback/reconciliation mechanism if you want extra robustness, but the primary update path should be push.

4. **Fix the analytics chart to use real data.** In `loadAnalytics()` (`frontend/js/dashboard.js`), the "Monthly Revenue" chart currently uses a hardcoded array (`[50000, 40000, 300000, ...]`) instead of the `data.monthly_revenue` the backend already computes and returns. Bind the chart to the actual API response. Separately, decide whether to (a) add a genuine `revenue` figure to the `trips` table and have the backend compute real revenue, or (b) rename the metric/chart to reflect what it actually measures (trip count and distance, not currency).

5. **Fix or remove the `trip_compliance` field.** `frontend/js/dashboard.js` renders `d.trip_compliance` in the drivers table, but no backend query ever computes or selects it, so it always renders as `undefined%`. Either add a real compliance calculation to `dashboardController.getDrivers` (e.g. percentage of a driver's trips completed without incident/cancellation) or remove the column from the UI until it's implemented.

**Verification for Phase 4:** Open the driver dashboard on a device/browser with geolocation enabled while a trip is dispatched, confirm real coordinates appear in `vehicle_locations` in the database, and confirm the fleet manager's map marker updates within a couple of seconds of a location change (not just on the next 15s poll). Confirm the analytics chart's numbers change when you add a new completed trip with real distance/revenue data.

---

## Phase 5 — Production hardening (P2, do as time allows)

Work through these roughly in order of effort-to-value:

1. In `backend/server.js`: move `await seedDatabase()` to run **before** `app.listen()` starts accepting connections (currently it's a race — the server can accept traffic while seeding is still in progress). Add `process.on('SIGTERM'/'SIGINT', ...)` handlers that stop accepting new connections, close the MySQL pool, and exit cleanly. Add `process.on('unhandledRejection'/'uncaughtException', ...)` handlers that log and exit rather than leaving the process in an undefined state.
2. In `dashboardController.getDashboardSummary` and `getAnalytics`: replace the sequential `await`ed queries with `Promise.all([...])` wherever the queries are independent of each other, to cut latency on these frequently-hit endpoints.
3. Add pagination (`LIMIT`/`OFFSET` or cursor-based) to `getVehicles`, `getDrivers`, `getTrips`, `getMaintenance`, `getFuelLogs`, and `getExpenses`, with the frontend updated to request pages instead of the full table every time.
4. Introduce a validation library (Joi, Zod, or `express-validator`) for request bodies across all controllers, replacing the current ad hoc `if (!field)` checks, and enforce that `status`/`type`-style fields are restricted to an explicit allow-list matching the DB's constraints.
5. Address JWT lifecycle: either shorten the token lifetime and add a refresh-token flow, or add a lightweight revocation check (e.g. a `token_version` column on `users`, bumped on role change/deactivation, checked on each request) so deactivating a user or changing their role takes effect immediately rather than waiting up to 8 hours.
6. Move the JWT from `sessionStorage` to an httpOnly, Secure, SameSite cookie, with CSRF protection added for state-changing requests, to reduce XSS-based token theft risk. (This is a meaningful frontend/backend refactor — treat as its own sub-task.)
7. Make the two password-length policies consistent (`authController.signup` requires 8+, `dashboardController.changePassword` requires 6+) — pick one minimum and apply it everywhere, front and back end.
8. Fix `apiFetch()` in `frontend/js/api.js` so that on a 401 it `throw`s after clearing the session/redirecting, so callers never proceed with an `undefined` result.
9. Replace `backend/test.js` with a real automated test suite (Jest or Mocha + Supertest), covering at minimum: auth (signup/login/me happy paths and failure cases), RBAC enforcement per role/endpoint, and the trip-code uniqueness fix from Phase 3. Wire it into `npm test` and, ideally, a CI workflow.
10. Implement the "Delete Account" button (`frontend/js/dashboard.js`) for real, or remove it — it currently just shows a toast and does nothing.
11. Implement the CSV export feature described in `docs/access-control.md`'s permission matrix (`fleet_manager` and `financial_analyst` only) — currently listed in the spec but not built anywhere.

---

## General instructions for every phase

- After each change, actually run the app and exercise the affected flow — don't just make the code "look" fixed.
- Keep commits scoped to one logical fix at a time with a clear message referencing which issue it addresses (e.g. `fix: enforce RBAC on dashboard GET routes (#6)`).
- Don't introduce new dependencies unless clearly justified (e.g. Socket.IO for Phase 4.3, a validation library for Phase 5.4) — prefer the smallest change that fully fixes the issue.
- If you find a fix requires a schema change, update `backend/schema.sql` and `docs/database.md` together so they never drift apart again — this drift was itself one of the root causes of Phase 1's issues.
- At the end, produce a short summary of what was changed per phase and any remaining known gaps.
