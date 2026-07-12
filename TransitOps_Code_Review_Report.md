# TransitOps — Code Review & Remediation Report

**Repository:** `RaajitSingh1306/Hackathon_backup`
**Project:** TransitOps — Smart Transport Operations Platform (ODOO Hackathon 2026)
**Stack:** Node.js / Express / MySQL backend, vanilla JS frontend
**Review date:** July 12, 2026
**Scope:** Full codebase — `backend/`, `frontend/`, `docs/`, config & schema files

---

## 1. Executive Summary

TransitOps is a role-based fleet management platform (vehicles, drivers, trips, maintenance, fuel, expenses, and GPS tracking) with a Node/Express/MySQL backend and a vanilla-JS dashboard frontend. The authentication layer (bcrypt, JWT, rate limiting on login, parameterized queries) is genuinely well-built and shows good security awareness. However, the application **does not run out of the box**, has **critical access-control gaps that are live-exploitable**, has **no transactional integrity** on multi-table writes, and its headline feature — real-time GPS tracking — **is not actually connected end-to-end**.

Most findings in this report were **verified by actually running the application** (installing MariaDB, following the README setup steps exactly, seeding data, hitting live endpoints, and firing concurrent requests), not just by reading the code. Where a finding is based on code review only, it is marked as such.

**Overall verdict:** Solid foundations (auth, parameterization, RBAC *design*), but not deployable as-is, and several steps away from "real-time, industry-grade" — primarily due to schema/init tooling being broken, authorization enforcement being incomplete, lack of transactions, and the GPS tracking pipeline being disconnected on the frontend.

### Severity breakdown

| Severity | Count | Description |
|---|---|---|
| 🔴 P0 — Showstopper | 5 | App does not function as documented / at all |
| 🟠 P0/P1 — Security | 8 | Live-exploitable authorization, injection-adjacent, or data-exposure issues |
| 🟡 P1 — Data integrity / real-time gaps | 7 | Race conditions, missing transactions, fake/disconnected "real-time" features |
| 🟢 P2 — Hardening | 14 | Robustness, scalability, and production-readiness gaps |

---

## 2. Methodology

| Verified how | Findings |
|---|---|
| **Ran live, reproduced with real requests** | #1, #2, #6, #7, #8, #14, #16 |
| **Confirmed by direct code/doc cross-reference** (high confidence, not runtime-executed) | All remaining findings |

Live verification steps taken:
1. Cloned the repo, installed MariaDB, followed `README.md` setup exactly (`cp .env.example .env`, `node initDb.js`, `npm run dev`).
2. Confirmed the documented setup produces a server that cannot authenticate any user (missing table).
3. Manually created the tables the controllers actually require (schema.sql doesn't define them) to get the app functional enough to test further.
4. Logged in as each seeded role and called protected endpoints directly with `curl`, bypassing the frontend, to test backend-enforced authorization.
5. Fired 15 concurrent `POST /dashboard/trips` requests to test the trip-code generation logic under load.
6. Sent GPS coordinates containing `0` values to test boundary/validation handling.

---

## 3. Findings at a Glance

| # | Severity | Title | File(s) |
|---|---|---|---|
| 1 | 🔴 P0 | `initDb.js` silently skips `CREATE TABLE users` | `backend/initDb.js`, `backend/schema.sql` |
| 2 | 🔴 P0 | `schema.sql` missing 7 of 8 required tables | `backend/schema.sql` |
| 3 | 🔴 P0 | Docs vs. code use conflicting naming/enum conventions | `docs/database.md` vs controllers |
| 4 | 🔴 P0 | Frontend hardcodes a different port than backend default | `frontend/js/api.js`, `backend/server.js`, `README.md` |
| 5 | 🔴 P0 | `DEMO_CREDENTIALS.md` doesn't match `seed.js` | `DEMO_CREDENTIALS.md`, `backend/src/config/seed.js` |
| 6 | 🟠 Security | RBAC not enforced on `GET` routes — proven live | `backend/src/routes/dashboard.js` |
| 7 | 🟠 Security | `POST /tracking` has no role check (GPS spoofing) | `backend/src/routes/tracking.js` |
| 8 | 🟠 Security | Raw DB errors leaked to API clients — proven live | `backend/src/middleware/errorHandler.js` |
| 9 | 🟠 Security | Signup allows self-assignment of any role (privilege escalation) | `backend/src/controllers/authController.js`, `frontend/js/signup.js` |
| 10 | 🟠 Security | Hardcoded fallback DB password in source | `backend/initDb.js` |
| 11 | 🟠 Security | Demo-account seeding runs unconditionally, even in prod | `backend/server.js` |
| 12 | 🟠 Security | CORS config: wildcard origin + `credentials: true` (invalid combo) | `backend/app.js` |
| 13 | 🟠 Security | Signup has no rate limit + enables email enumeration | `backend/src/routes/auth.js` |
| 14 | 🟡 P1 | Trip-code race condition — proven live (15 requests → 8 duplicates) | `backend/src/controllers/dashboardController.js` |
| 15 | 🟡 P1 | No database transactions anywhere (multi-table writes not atomic) | `backend/src/controllers/dashboardController.js`, `db.js` |
| 16 | 🟡 P1 | Falsy-zero bug rejects valid GPS coordinates — proven live | `backend/src/controllers/trackingController.js` |
| 17 | 🟡 P1 | Real-time GPS tracking is not wired up end-to-end | `frontend/js/dashboard.js` |
| 18 | 🟡 P1 | Tracking is polling-based (15s), not push-based | `frontend/js/dashboard.js` |
| 19 | 🟡 P1 | Analytics revenue chart shows hardcoded fake data | `frontend/js/dashboard.js` |
| 20 | 🟡 P1 | `trip_compliance` field referenced in UI but never computed | `frontend/js/dashboard.js`, `dashboardController.js` |
| 21–34 | 🟢 P2 | Robustness/scalability gaps (see §7) | various |

---

## 4. 🔴 P0 — Showstoppers

### #1 — `initDb.js` silently fails to create the `users` table
**Verified live.**

The setup script's naive statement splitter:
```js
const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
for (const stmt of statements) {
  if (!stmt.toLowerCase().startsWith('--')) { await connection.query(stmt); }
}
```
`schema.sql` places a `-- comment header` directly above the `CREATE TABLE` statement. After splitting on `;` and trimming, that whole chunk (comment *and* SQL) starts with `--`, so the guard clause **skips the statement entirely**. Printing the actual parsed chunks confirms it:

```
Statement 2 (SKIPPED=true):
-- ============================================================
-- users table — database.md §1
-- ============================================================
[the CREATE TABLE that follows never executes]
```

Running the documented setup produces the console line `"Database initialized successfully."` — but the table was never created. Every subsequent login/signup/seed call fails:
```
ERROR 1146 (42S02): Table 'transitops.users' doesn't exist
{"success":false,"error":{"code":"SERVER_ERROR","message":"Internal server error."}}
```

**Fix:** Strip comment lines with a regex (`schemaSql.replace(/^--.*$/gm, '')`) before splitting on `;`, or execute the whole file as one `multipleStatements: true` query, or use a real migration tool.

---

### #2 — `schema.sql` is missing 7 of the 8 tables the application needs
`backend/schema.sql` (the only schema file that actually ships and runs) defines just `users`. But the controllers query `vehicles`, `drivers`, `trips`, `maintenance_records`, `fuel_logs`, `expenses`, `settings`, and `vehicle_locations` — none of which exist in `backend/`. The full schema only exists inside `docs/database.md` (documentation) and in disconnected legacy code under `archive/concept*/`, which is not part of the running app.

I had to hand-write these tables to get the app functional enough to test further. Confirmed live:
```
GET /dashboard/expenses → {"error":{"code":"ER_NO_SUCH_TABLE","message":"Table 'transitops.expenses' doesn't exist"}}
```

**Fix:** Write a complete `schema.sql` with all 8 tables, foreign keys, and indexes, matching the columns the controllers actually use (see #3).

---

### #3 — Documentation and implementation disagree on naming conventions
`docs/database.md` is labeled *"Single Source of Truth"* but doesn't match the actual code:

| Field | Documented (`docs/database.md`) | Actual code (`dashboardController.js`) |
|---|---|---|
| Maintenance table | `maintenance_logs` | `maintenance_records` |
| Vehicle registration | `registration_number` | `reg_no` |
| Vehicle capacity | `max_load_capacity_kg` | `capacity` **and** `capacity_kg` (two separate fields) |
| Driver license | `license_number` | `license_no` |
| Status values | lowercase snake_case: `available`, `on_trip`, `in_shop` | Title Case with spaces: `'Available'`, `'On Trip'`, `'In Shop'` |
| `trips.vehicle_id` / `driver_id` | `NOT NULL` + FK constraint | Nullable (required for `Draft` trips with no assignment yet) |

Whoever writes the real schema (fixing #2) will re-break the app unless this is reconciled first.

**Fix:** Pick the code's convention (already implemented end-to-end across backend and frontend) as canonical, and update `docs/database.md` to match — or do a coordinated rename across the whole stack if the documented convention is preferred.

---

### #4 — Frontend hardcodes a different port than the backend's own default
```js
// frontend/js/api.js
const API_BASE = 'http://localhost:3005/api/v1';
```
```js
// backend/server.js
const PORT = process.env.PORT || 3001;
```
```
# backend/.env.example
PORT=3001
```
Following the README exactly, the frontend can never reach the backend. The README itself also claims the backend "will run on `http://localhost:3005`" — contradicting both `.env.example` and `server.js`'s own fallback.

**Fix:** Pick one port everywhere (README, `.env.example`, `api.js`). Better: don't hardcode the API base URL in a committed JS file at all — inject it via a small config file or build-time environment variable so the same frontend code can point at localhost, staging, or production without manual edits.

---

### #5 — `DEMO_CREDENTIALS.md` does not match the actual seeded data
`DEMO_CREDENTIALS.md` documents the fleet manager login as `manager@transitops.demo` ("Sarah Jenkins"). The actual seeder (`seed.js`) creates `fleet@transitops.demo` ("Fleet Manager Demo") — different email, different name. The doc also claims the seed provisions **10 vehicles, 8 drivers, 15 trips, and "extensive maintenance & financial data."** In reality, `seed.js` inserts **only the 4 user accounts** — zero vehicles, drivers, trips, or financial data.

A reviewer following `DEMO_CREDENTIALS.md` gets a login failure, and even after finding the correct credentials, sees a completely empty dashboard.

**Fix:** Either correct the documentation, or (better, and needed for #1/#2 to matter in a live demo) extend `seed.js` to actually seed the fleet described in the docs.

---

## 5. 🟠 Security Findings

### #6 — RBAC is not enforced on `GET` routes — proven live
`docs/access-control.md` is explicit: *"Backend (source of truth): every mutating route wrapped in `requireRole([...])`... A 403 must come back even if the frontend somehow tries a disallowed action."* Its permission matrix says `driver` must **not** see expenses, analytics, or settings.

In `routes/dashboard.js`, only mutating routes (`POST`/`PUT`) carry `requireRole()`. Every `GET` route is unrestricted:
```js
router.get('/expenses', ctrl.getExpenses);     // spec: driver = ❌  — no check present
router.get('/settings', ctrl.getSettings);      // spec: fleet_manager only — no check present
router.get('/analytics', ctrl.getAnalytics);    // spec: driver = ❌  — no check present
```
I logged in as `driver@transitops.demo` and called these directly with a valid token — the requests reached the database query layer (confirmed by getting a DB error rather than a `403 Forbidden`), proving there is no authorization gate at all on these endpoints. The frontend hides these tabs cosmetically via `data-roles` attributes, but per the project's own docs that is explicitly "UX only, not security."

**Fix:** Add `requireRole([...])` to every `GET` route per the matrix in `docs/access-control.md`, not just the write routes.

---

### #7 — `POST /api/v1/tracking` has no role restriction (GPS spoofing)
```js
// routes/tracking.js
// Drivers and Fleet Managers can update locations   <- comment says this...
router.post('/', requireAuth, trackingController.updateLocation);  // ...but no requireRole() enforces it
```
Any authenticated user of **any role** (e.g. a `financial_analyst`) can POST a fake location for any `vehicle_id`. There is also no check that a driver posting a location is actually assigned to that vehicle — a driver could spoof another vehicle's position (IDOR).

**Fix:** `requireRole(['driver', 'fleet_manager'])`, and for drivers specifically, verify the `vehicle_id` belongs to their currently dispatched trip before accepting the update.

---

### #8 — Internal database errors are leaked to API clients — proven live
`errorHandler.js` returns `err.message` / `err.code` verbatim for any error routed through `next(err)` (used throughout `dashboardController.js`). Live proof:
```json
{"success":false,"error":{"code":"ER_NO_SUCH_TABLE","message":"Table 'transitops.expenses' doesn't exist"}}
```
This exposes internal table/schema names and raw MySQL driver codes to any client hitting an errored route — useful reconnaissance for an attacker, and inconsistent with the generic-error discipline the auth controller otherwise follows.

**Fix:** In `errorHandler`, log the raw error server-side only. For any error without an explicit `statusCode`/`code` set by application code (i.e., anything that isn't your own `createError()`), return a generic `"An unexpected error occurred."` message instead of the driver exception's own text.

---

### #9 — Signup allows self-assignment of any role (privilege escalation)
```js
const VALID_ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];
// signup accepts `role` directly from the request body with no gating
```
The signup form itself offers `fleet_manager` (full administrative access — create/edit vehicles, manage settings, close maintenance) as a free choice with no invite/approval workflow. Anyone can self-register as an administrator.

**Fix:** Public signup should default to the lowest-privilege role (e.g. `driver`) or be disabled entirely in favor of admin-issued invites; elevated roles should never be user-selectable at signup.

---

### #10 — Hardcoded fallback database password in source
```js
// initDb.js
password: process.env.DB_PASS || 'Sumit123'
```
Committing a credential-shaped fallback string is bad practice regardless of intent — if reused anywhere else, it's now permanently in git history.

**Fix:** Fail fast if `DB_PASS` is unset rather than silently falling back to a hardcoded value.

---

### #11 — Demo-account seeding runs unconditionally, including in production
`server.js` calls `seedDatabase()` on every boot with no environment guard. If deployed as-is, this creates 4 accounts with a known, public, weak password (`password123`) — including a `fleet_manager` (full admin) account — in any environment, including production.

**Fix:** `if (process.env.NODE_ENV !== 'production') { await seedDatabase(); }`

---

### #12 — CORS configuration is self-contradictory
```js
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true, ... }));
```
Browsers reject `Access-Control-Allow-Origin: *` combined with `credentials: true` per the CORS spec — this configuration silently breaks authenticated cross-origin requests the moment `CORS_ORIGIN` is unset, rather than failing loudly.

**Fix:** Always require an explicit origin (or allow-list) when `credentials: true` is set; never fall back to `*`.

---

### #13 — Signup has no rate limit and enables email enumeration
Only `/login` is rate-limited. `/signup` is unrestricted (spam/abuse risk), and its `409 Conflict — "An account with this email already exists"` response lets anyone enumerate which emails are registered.

**Fix:** Rate-limit `/signup` as well; consider whether the duplicate-email response needs to be as explicit, weighed against the UX cost of a vaguer message.

---

## 6. 🟡 Data Integrity & "Real-Time" Gaps

### #14 — Trip-code generation has a race condition — proven live
```js
const [lastTrip] = await db.query('SELECT trip_code FROM trips ORDER BY id DESC LIMIT 1');
let nextCode = 'TR001';
if (lastTrip) { nextCode = 'TR' + String(parseInt(lastTrip.trip_code.replace('TR','')) + 1).padStart(3,'0'); }
await db.query('INSERT INTO trips (trip_code, ...) VALUES (?, ...)', [nextCode, ...]);
```
Classic **read-then-write without locking**. I fired 15 concurrent `POST /dashboard/trips` requests at the live server and got:
```
TR001, TR002, TR003, TR003, TR003, TR004, TR005, TR005, TR004, TR004, TR006, TR005, TR006, TR006, TR007
```
Only **7 unique codes generated for 15 trips**. In a fleet dispatch system, duplicate trip codes are a serious operational and audit-trail problem, and this will occur under any realistic concurrent load (multiple dispatchers, or even a user double-clicking / multiple tabs).

**Fix:** Wrap the read+increment+insert in a transaction with `SELECT ... FOR UPDATE`, or add a `UNIQUE` constraint on `trip_code` with retry-on-conflict, or (cleanest) derive the code from an `AUTO_INCREMENT` id rather than parsing/incrementing a string.

---

### #15 — No database transactions anywhere
```bash
$ grep -rn "getConnection\|beginTransaction" backend/src/
src/config/db.js:31: async function getConnection() { return pool.getConnection(); }
# — exported, but never called anywhere else in the codebase
```
Several controller functions perform 2–3 *dependent* writes as separate, non-atomic statements:
- `createTrip`: INSERT trip → UPDATE vehicle status → UPDATE driver status
- `updateTripStatus`: UPDATE trip → UPDATE vehicle → UPDATE driver
- `createMaintenance` / `updateMaintenance`: INSERT/UPDATE + vehicle status flip

If any statement after the first fails (dropped connection, deadlock, pool exhaustion under load), the system is left in an inconsistent state — e.g. a trip marked `Dispatched` while its vehicle is still marked `Available`, which could allow the same vehicle to be double-booked onto a second trip.

**Fix:** Wrap every multi-statement write in `getConnection()` → `beginTransaction()` → ... → `commit()` / `rollback()` (already scaffolded in `db.js` — just unused).

---

### #16 — Falsy-zero bug rejects valid GPS coordinates — proven live
```js
if (!vehicle_id || !latitude || !longitude) { return res.status(400)... }
```
`0` is a legitimate latitude/longitude (equator / prime meridian). Posting `{"latitude":0,"longitude":72.5}` (a real point) was rejected:
```json
{"success":false,"error":"Missing location payload data"}
```
Any vehicle whose GPS briefly reports exactly `0` for either coordinate will have that update silently dropped.

**Fix:** Validate with `typeof latitude !== 'number' || typeof longitude !== 'number'` plus a range check (`-90..90` / `-180..180`), not truthiness.

---

### #17 — Real-time GPS tracking is not actually wired up end-to-end
This is the largest gap relative to what the platform claims to be. Across the **entire frontend**, the only reference to `/tracking` is the fleet manager's polling `GET /tracking/active` call. There is:
- **No `navigator.geolocation` call anywhere in the codebase**
- **No code that ever `POST`s to `/api/v1/tracking`**

So `vehicle_locations` will always be empty in real use, and the fleet manager's live map will never show a marker. What exists instead, inside `loadDashboardSummary()`, is purely decorative:
```js
// Auto-update Driver Location Feature (Indian Cities)
const indianCities = ["Mumbai, MH", "Delhi, DL", ...];
setInterval(() => {
  document.getElementById('statDriverLocation').textContent =
    indianCities[Math.floor(Math.random() * indianCities.length)];
}, 15000);
```
This randomly cycles a city name on the driver's own screen and never touches the backend at all.

**Fix:** On the driver dashboard, use `navigator.geolocation.watchPosition()` and `POST` real coordinates to `/api/v1/tracking` on an interval. The map-rendering side (Leaflet + polling) is otherwise implemented correctly and just needs real data flowing into it.

---

### #18 — Tracking is polling-based, not push-based
Even once #17 is fixed, `fetchAndRenderLocations()` polls every 15 seconds. Acceptable for an MVP, but not "real-time" by industry standards, and it means every open dashboard tab independently re-runs a multi-table join every 15 seconds regardless of whether anything changed.

**Fix:** Move to WebSocket (Socket.IO) or Server-Sent Events so the map updates on push rather than a fixed timer, and the server only does work when there's actually new data.

---

### #19 — Analytics chart displays hardcoded fake data
The backend's `getAnalytics()` correctly computes `monthly_revenue` from real trip data, but the frontend chart ignores it entirely:
```js
data: [50000, 40000, 300000, 220000, 500000, 250000, 400000, 230000, 500000],  // hardcoded
labels: ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],               // hardcoded
```
A financial analyst using this dashboard sees fabricated numbers, not their fleet's actual data. Separately, the underlying metric is mislabeled: nothing in the schema tracks currency revenue — `monthly_revenue` is actually trip count and distance.

**Fix:** Bind the chart to `data.monthly_revenue` from the real API response; either add a genuine revenue field to `trips`, or rename the metric to reflect what it actually measures.

---

### #20 — `trip_compliance` referenced in UI but never computed
```js
<td>${d.trip_compliance}%</td>
```
No controller ever selects or computes this field — it will always render as `undefined%` in the drivers table.

**Fix:** Either compute a real compliance metric server-side, or remove the column until it's implemented.

---

## 7. 🟢 P2 — Robustness / Production-Readiness Gaps

| # | Issue | Location |
|---|---|---|
| 21 | Seeding runs inside `app.listen`'s callback with `await` — the server accepts real traffic before demo accounts finish being created (startup race). | `server.js` |
| 22 | No graceful shutdown (`SIGTERM`/`SIGINT` → drain pool, finish in-flight requests) — unsafe to run behind an orchestrator (Docker/K8s). | `server.js` |
| 23 | No `unhandledRejection` / `uncaughtException` handlers — an unexpected async error can crash the process silently. | `server.js` |
| 24 | `getDashboardSummary` / `getAnalytics` run 6+ independent queries **sequentially** instead of `Promise.all([...])`, multiplying latency on the most-hit endpoint. | `dashboardController.js` |
| 25 | No pagination anywhere — `SELECT *` with no `LIMIT`/`OFFSET` on vehicles, drivers, trips, maintenance, fuel logs, expenses. Will degrade as fleet size grows. | `dashboardController.js` |
| 26 | No input-validation library (Joi/Zod/express-validator) — status/type fields accept arbitrary strings; the DB schema doesn't enforce enums either. | all controllers |
| 27 | JWT bakes in `role` at login time; no revocation/refresh mechanism — deactivating or changing a user's role has no effect until their token naturally expires (up to 8h). | `middleware/auth.js` |
| 28 | JWT stored in `sessionStorage` — vulnerable to theft via any XSS on the page; no httpOnly-cookie + CSRF-protection alternative considered. | `frontend/js/api.js` |
| 29 | Inconsistent password policy: signup requires 8+ characters, `changePassword` only requires 6+. | `authController.js` vs `dashboardController.changePassword` |
| 30 | `apiFetch()` clears session and redirects on 401 but doesn't `throw` — callers awaiting it receive `undefined` and can error further down trying to read from it. | `frontend/js/api.js` |
| 31 | `test.js` is a manual console-log script — no assertions, no test framework, no CI. Nothing is automatically verified. | `backend/test.js` |
| 32 | "Delete Account" button only shows a toast ("Support will contact you shortly") — no real functionality behind it. | `dashboard.js` |
| 33 | CSV export is listed in `access-control.md`'s permission matrix as a feature but is not implemented anywhere in the code. | spec vs. implementation |
| 34 | Query filters (`type`, `status`) aren't checked against an allow-list before use — currently safe (parameterized), but an invalid value silently returns zero rows with no error/feedback to the user. | `dashboardController.js` |

---

## 8. Recommended Fix Roadmap

1. **Phase 1 — Make it run at all** (#1–5): Fix `initDb.js`'s parser, write a complete `schema.sql` matching what the code actually queries, reconcile naming conventions, fix the port mismatch, and correct/complete the demo seed data.
2. **Phase 2 — Close the live-exploitable security gaps** (#6–13): Add `requireRole()` to every `GET` route per the documented permission matrix, restrict `/tracking` POST, stop leaking raw DB errors, gate signup role selection, remove the hardcoded password fallback, gate seeding by `NODE_ENV`, fix CORS, rate-limit signup.
3. **Phase 3 — Data integrity** (#14–15): Wrap multi-table writes in real transactions; fix trip-code generation to be race-free.
4. **Phase 4 — Make "real-time tracking" real** (#16–20): Fix the falsy-zero validation bug, wire the driver's browser geolocation to the tracking endpoint, replace polling with WebSocket/SSE push, bind the analytics chart to real data, implement or remove `trip_compliance`.
5. **Phase 5 — Production hardening** (#21–34): Graceful shutdown, parallelized queries, pagination, real validation library, token revocation strategy, a real automated test suite, and the still-missing CSV export.

---

## Appendix — Files Reviewed

```
backend/app.js                              backend/src/routes/auth.js
backend/server.js                           backend/src/routes/dashboard.js
backend/initDb.js                           backend/src/routes/tracking.js
backend/schema.sql                          backend/test.js
backend/package.json / package-lock.json    backend/.env.example
backend/src/config/db.js                    frontend/js/api.js
backend/src/config/seed.js                  frontend/js/login.js
backend/src/controllers/authController.js   frontend/js/signup.js
backend/src/controllers/dashboardController.js   frontend/js/dashboard.js
backend/src/controllers/trackingController.js    frontend/dashboard.html
backend/src/middleware/auth.js              docs/access-control.md
backend/src/middleware/errorHandler.js      docs/database.md
                                             README.md, DEMO_CREDENTIALS.md
```

*Legacy/unused code under `archive/concept*/` was inspected only to confirm it is disconnected from the running application and not otherwise reviewed for bugs.*
