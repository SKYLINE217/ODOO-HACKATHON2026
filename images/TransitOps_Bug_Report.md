# TransitOps (Hackathon_backup) — Bug & Code Review Report

**Repo:** `RaajitSingh1306/Hackathon_backup`
**Stack:** Node.js/Express/MySQL backend, vanilla JS + HTML/CSS frontend
**Review method:** Full read of every backend controller/route/middleware file and every frontend JS file, cross-referenced field-by-field between frontend payloads and backend validators, plus targeted sandbox reproductions (Node syntax checks on all backend files, a scripted reproduction of the CSV-export crash).
**Note:** This repo already contains an older `TransitOps_Code_Review_Report.md`. Much of what it flagged (missing schema tables, broken `initDb.js`, wildcard CORS, signup role self-escalation) has since been **fixed** in the current code. This report reflects the code as it exists right now, not that earlier snapshot.

---

## Executive summary

The backend (auth, RBAC middleware, parameterized queries, transactions on multi-table writes) is solid and shows real security awareness. The **critical problem is on the frontend**: nearly every "create" form in the dashboard sends JSON field names that don't match what the backend controllers expect, so **Add Vehicle, Add Driver, Add Fuel Log, and Add Maintenance are all broken** (they will always fail with a 400 error), and **Add Expense silently succeeds while discarding every field the user typed**. There's also one confirmed crash bug (CSV export), a hardcoded password committed to source, an XSS exposure pattern used throughout the dashboard, and a JWT-in-URL pattern that leaks tokens into logs/history.

| Severity | Count | Description |
|---|---|---|
| 🔴 Critical | 6 | Feature is broken / crashes / data silently lost |
| 🟠 High | 6 | Security-relevant (XSS, token leakage, hardcoded secret, IDOR-adjacent) |
| 🟡 Medium | 8 | Logic gaps, inconsistent validation, stale docs |
| 🟢 Low | 5 | Polish / hardening |

---

## 🔴 Critical — broken or data-destroying features

### 1. "Add Vehicle" form can never succeed
**File:** `frontend/js/dashboard.js` (~line 677-703)

The dynamically-built form uses `name="name"` for the model field, and sends `capacity` as a raw number:
```js
<input type="text" name="name" class="form-input" required>   // should be name_model
...
<input type="number" name="capacity" class="form-input" required>  // schema wants capacity_kg (number) AND capacity (a "Small/Medium/Large" string)
```
The backend (`dashboardController.js::createVehicle`) requires `reg_no, name_model, type, capacity`:
```js
if (!reg_no || !name_model || !type || !capacity) {
  return res.status(400).json({ ... 'Missing required fields.' });
}
```
`name_model` is never sent (the form calls it `name`), so **every submission returns 400** and no vehicle can ever be added through the UI. `capacity_kg` is also never sent, so even a fixed version would silently store `capacity_kg = 0`.

### 2. "Add Driver" form can never succeed
**File:** `frontend/js/dashboard.js` (~line 710-720)

Form fields: `name`, `license_no`, `license_category`, `license_expiry`, `contact_number`.
Backend (`createDriver`) expects: `name, license_no, category, license_expiry, contact`.

`category` and `contact` are never sent → validation `if (!name || !license_no || !category || !license_expiry)` always fails → **Add Driver always 400s.**

### 3. "Add Fuel Log" form can never succeed
**File:** `frontend/js/dashboard.js` (~line 736-745)

Form sends `{ vehicle_id, log_date, liters, cost }`. Backend `createFuelLog` requires `fuel_cost`, not `cost`:
```js
const { vehicle_id, log_date, liters, fuel_cost } = req.body;
if (!vehicle_id || !log_date || !liters || !fuel_cost) { ... 400 ... }
```
`fuel_cost` is always `undefined` → **Add Fuel Log always 400s.**

### 4. "Add Maintenance" form can never succeed
**File:** `frontend/js/dashboard.js` (~line 792-800)

Payload sends `date`, backend `createMaintenance` requires `service_date`:
```js
const { vehicle_id, service_type, cost, service_date, status } = req.body;
if (!vehicle_id || !service_type || !cost || !service_date) { ... 400 ... }
```
`service_date` is always `undefined` → **Add Maintenance always 400s.**

### 5. "Add Expense" silently discards the data the user entered (worse than a 400 — no error is shown)
**File:** `frontend/js/dashboard.js` (~line 766-777) vs. `dashboardController.js::createExpense`

Form sends `{ category, amount, expense_date }`. Backend expects `{ trip_id, vehicle_id, toll, other, maint_linked }`, **none of which have required-field validation**:
```js
const { trip_id, vehicle_id, toll, other, maint_linked } = req.body;
const total = (parseFloat(toll)||0) + (parseFloat(other)||0) + (parseFloat(maint_linked)||0);
await db.query('INSERT INTO expenses ...', [trip_id||null, vehicle_id||null, toll||0, other||0, maint_linked||0, total]);
```
Because there's no required-field check, this **returns 201 success** and inserts a row with `trip_id = NULL, vehicle_id = NULL, toll = 0, other = 0, maint_linked = 0, total = 0`. The user sees "Expense added" but the category, amount, and date they typed vanish completely, and a zero-value ghost row is added to the analytics that feed the ROI/operational-cost figures.

**Root cause for #1–#5:** it looks like the frontend forms were built against an earlier/different version of the API contract (or a different teammate's assumed field names) than what `dashboardController.js` actually implements, and the two were never integration-tested together.

### 6. CSV export (`GET /dashboard/export/:table`) crashes on every non-empty table
**File:** `backend/src/controllers/dashboardController.js::exportCsv`

```js
const [rows] = await db.query(`SELECT * FROM ${table} ORDER BY id DESC`);
```
`db.query()` (in `config/db.js`) already returns the row **array** directly (`const [rows] = await pool.execute(...); return rows;`), so this line re-destructures that array and only grabs its **first row object**, assigning it to a variable confusingly named `rows`. The immediately following code then does:
```js
if (rows.length === 0) { ... }              // rows is now an object -> rows.length is undefined
const header = Object.keys(rows[0]).join(','); // rows[0] is undefined -> TypeError
```
I reproduced this in isolation — `Object.keys(rows[0])` throws `TypeError: Cannot convert undefined or null to object`. Any export request against a table with data returns a raw 500 (caught by `next(err)`, but still a hard failure of the feature — a fleet manager can never successfully export data). Note this differs from every *other* controller method (`getVehicles`, `getTrips`, etc.), which correctly use `const rows = await db.query(...)` without destructuring — this is an isolated, copy-paste-style slip in just this one function.

---

## 🟠 High — security-relevant

### 7. Reflected/stored XSS pattern used throughout the dashboard
**File:** `frontend/js/dashboard.js` (multiple locations: lines ~125, ~183, ~200, ~225, ~242, ~246, ~280, ~291, ~297, ~307, ~599-606) and `frontend/js/api.js::showToast` (line 56)

Every table/list/toast/map-popup render uses raw template-literal interpolation into `.innerHTML`:
```js
tbody.innerHTML = data.map(v => `<tr><td>${v.reg_no}</td><td>${v.name_model}</td>...`).join('');
```
`v.name_model`, `v.reg_no`, driver `name`, trip `source`/`destination`, maintenance `service_type`, and the GPS popup's `driver_name`/`reg_no` all originate from **user-writable fields** (`createVehicle`, `createDriver`, `createTrip` accept free-text strings with no sanitization or output-encoding). Any authenticated user with create access (e.g. a `driver` creating a trip, or a `fleet_manager` adding a vehicle) can enter `<img src=x onerror=alert(document.cookie)>` as a name/source/destination, and it will execute in the browser of **every other user** who later views that table, trip board, or the live GPS map popup — including higher-privilege roles. This is a classic stored-XSS pattern; every one of these ~12 call sites needs to either use `textContent`/DOM node creation or pass values through an HTML-escaping helper before interpolation.

### 8. JWT sent as a URL query parameter
**Files:** `backend/src/middleware/auth.js` (lines 22-25), `frontend/js/dashboard.js` (lines 218, 571)

`requireAuth` accepts `?token=...` as a fallback to the `Authorization` header (needed because `EventSource` can't set custom headers), and the frontend actively uses this for both the CSV export link and the SSE tracking stream:
```js
window.open(`${API_BASE}/dashboard/export/vehicles?token=${token}`, '_blank');
...
const sseUrl = `${API_BASE}/tracking/stream?token=${token}`;
```
Putting a bearer token in a URL means it can end up in browser history, server access logs, proxy logs, and the `Referer` header of any resource the resulting page loads. This is a known anti-pattern; at minimum the export endpoint doesn't need it (it's a normal fetch-able GET, not an `EventSource`) and should use the `Authorization` header like every other call in `api.js`.

### 9. Hardcoded database password committed to source
**File:** `backend/drop_tables.js`, line 9

```js
password: process.env.DB_PASS || 'Sumit123',
```
A real-looking password is committed as a fallback default in a script that ships in the public repo. Even as a "just for local dev" convenience, this is a credential leak (it may well be reused as a real MySQL root password on the developer's machine) and is inconsistent with `initDb.js`, which correctly *refuses* to run without `DB_PASS` set (`throw new Error('DB_PASS environment variable must be set...')`). `drop_tables.js` should follow the same pattern.

### 10. Driver identity is matched by name string, not by a foreign key — breaks (and is spoofable) when names collide or change
**Files:** `backend/src/controllers/trackingController.js` (lines 31-39), `backend/src/config/seed.js`, `dashboardController.js::updateUserProfile`

There is no `user_id` column on the `drivers` table linking a login account to a driver record. Instead, authorization for GPS updates is done by string-matching names:
```js
`SELECT t.id FROM trips t JOIN drivers d ON t.driver_id = d.id
 WHERE d.name = (SELECT name FROM users WHERE id = ?) AND t.vehicle_id = ? AND t.status = 'Dispatched'`
```
Two problems:
- **Self-inflicted breakage:** a driver can change their own display name via `PUT /dashboard/profile` (`updateUserProfile` has no restriction on this). The moment they do, this query stops matching and their GPS tracking silently stops authorizing (403 on every location update), with no indication of why.
- **Collision risk:** if two `drivers` rows (or two `users`) ever share a name — entirely possible, nothing enforces uniqueness on `name` — a driver could be authorized to post GPS updates "as" a different vehicle/trip than their own, or be blocked incorrectly. This should be a real foreign key (`drivers.user_id → users.id`), not a name join.

### 11. `frontend_design` signup UI offers privileged roles it cannot grant (misleading, not exploitable — but worth fixing)
**Files:** `frontend/index.html` (lines 59-65), `frontend/js/signup.js` (line 116), `backend/src/controllers/authController.js` (line 56)

The signup form presents a dropdown letting a new user pick `Fleet Manager`, `Safety Officer`, or `Financial Analyst`:
```html
<select id="role" class="form-select">
  <option value="fleet_manager">Fleet Manager</option>
  <option value="driver">Driver</option>
  <option value="safety_officer">Safety Officer</option>
  <option value="financial_analyst">Financial Analyst</option>
</select>
```
and `signup.js` sends whatever is selected. The backend is correctly written to **ignore this entirely** and hardcode `const assignedRole = 'driver';` — so this is not a privilege-escalation vulnerability. But it is a functional/UX bug: the UI actively promises a capability ("sign up as Fleet Manager") that silently doesn't happen, and the resulting account is a `driver` with no explanation given to the user. The dropdown should either be removed from the signup form, or the UI should clearly state that elevated roles require admin provisioning.

### 12. No row-level scoping on fuel logs / trips exposes company-wide financial data to every driver
**File:** `backend/src/routes/dashboard.js` (line 42), `dashboardController.js::getFuelLogs`

`GET /dashboard/fuel-logs` is allowed for role `driver`, and returns **all** fuel logs for **all** vehicles with no `WHERE` filter by the requesting user's assigned vehicle/trips. Any driver account can see the full fleet's fuel cost history, not just their own trips. This may be an intentional operational-transparency choice, but given `financial_analyst` is a separate, more restricted role elsewhere in the same route file, it looks more like an oversight than a deliberate design decision. Worth confirming with the team.

---

## 🟡 Medium — logic gaps, inconsistent validation, stale docs

### 13. `updateMaintenance` doesn't validate that `status` was actually provided
**File:** `dashboardController.js::updateMaintenance`, lines 284-313

Unlike `updateTripStatus` (which 400s if `status` is missing), `updateMaintenance` runs `UPDATE maintenance_records SET status = ?` even if `status` is `undefined` — MySQL will reject `undefined` bound params in some drivers or silently coerce to `NULL`, either wiping the status or throwing an opaque 500 depending on `mysql2`'s handling, rather than returning a clean 400.

### 14. `updateVehicle` / `updateDriverStatus` return "success" even when the ID doesn't exist
**File:** `dashboardController.js`, lines 57-75 and 114-132

Both run a blind `UPDATE ... WHERE id = ?` and always respond `{ success: true, data: { message: 'Vehicle updated.' } }`, even if zero rows were affected (i.e., the ID doesn't exist). Contrast with `updateMaintenance`/`updateTripStatus`, which correctly `SELECT` first and 404 if not found. This inconsistency means a typo'd or stale vehicle/driver ID from the frontend fails silently instead of surfacing an error.

### 15. `createError()` helper is defined but never used — most non-happy-path errors return a generic message
**File:** `backend/src/middleware/errorHandler.js`, lines 30-35 + `grep` confirms zero call sites elsewhere in the codebase.

The error-handling middleware is designed around explicit `createError(message, statusCode, code)` calls that set `err.statusCode` so the client gets a specific message. But no controller ever calls it — every thrown error that isn't already special-cased (like `ER_DUP_ENTRY`) falls through to the generic `'An unexpected error occurred.'` with a 500, even for things like an invalid `vehicle_id` foreign key on `createExpense`/`createFuelLog` (which MySQL would reject with `ER_NO_REFERENCED_ROW_2`). Users get an unhelpful "unexpected error" for what are really 400-level input mistakes.

### 16. No numeric bounds/sign validation on money and quantity fields
**Files:** `createVehicle`, `createFuelLog`, `createExpense`, `createMaintenance` (all in `dashboardController.js`)

None of these validate that `acquisition_cost`, `fuel_cost`, `toll`, `other`, `cost`, `liters`, `odometer`, `cargo_weight_kg` are non-negative. A negative fuel cost or negative liters would pass straight through to the DB and silently corrupt the `SUM()`-based analytics in `getAnalytics`/`getDashboardSummary` (fuel efficiency, ROI, operational cost).

### 17. `DEMO_CREDENTIALS.md` is out of sync with `backend/src/config/seed.js`
**Files:** `DEMO_CREDENTIALS.md` vs `backend/src/config/seed.js`

The docs claim: *"The system is seeded with 10 Vehicles, 8 Drivers, 15 Trips, and extensive Maintenance & Financial Data."* The actual `seedDatabase()` function inserts **3 vehicles, 3 drivers, 2 trips, and 1 maintenance record**, and seeds **zero** fuel logs and **zero** expenses. Anyone following the docs to demo the Analytics or Fuel/Expenses tabs will find them mostly or entirely empty. The docs table also lists the driver demo account's "Name" as `Driver Demo`, but `seed.js` actually names that user `Raj Patel`.

### 18. Vehicle "capacity" is overloaded across two different semantics with no reconciliation
**Files:** `schema.sql` (lines 16-28), `dashboardController.js::createVehicle`

`vehicles.capacity` is a free-text `VARCHAR` (intended for values like `"Small"/"Medium"/"Large"`, per the seed data), while `vehicles.capacity_kg` is the actual numeric figure used everywhere for real logic (`createTrip`'s over-capacity check compares `cargo_weight_kg` against `capacity_kg`, never `capacity`). The "Add Vehicle" form (bug #1) collects a *number* into a field literally called `capacity`, which — even once the `name_model` bug is fixed — would still store the numeric string into the wrong column (`capacity`, not `capacity_kg`), leaving `capacity_kg` at its default of `0` and making every newly-added vehicle immediately fail (or trivially pass) the capacity check in `createTrip`.

### 19. `updateUserProfile` allows changing `email` with no re-verification and no uniqueness pre-check (relies solely on DB constraint)
**File:** `dashboardController.js::updateUserProfile`, lines 533-561

Email changes take effect immediately with no confirmation step (no "verify new email" flow), and the only duplicate-detection is a caught `ER_DUP_ENTRY` from the unique constraint — functionally fine, but there's no protection against a user typing a typo'd email and getting silently locked out of ever using their old one (no email-change audit/undo).

### 20. `deleteAccount` leaves orphaned/stale references instead of a clear data-retention decision
**File:** `dashboardController.js::deleteAccount`, lines 591-606

The code comment admits the gap: *"We could also delete related records in drivers/trips/etc. but for this prototype just deleting the user is fine..."* Because `drivers` is only linked to `users` by name (see #10), deleting a user account does **not** deactivate or remove the corresponding `drivers` row — that driver stays fully active, assignable to trips, and visible in the fleet, with no owning login account. This is a data-integrity gap worth a deliberate decision (cascade-deactivate, or block deletion while trips are active) rather than the current silent no-op.

---

## 🟢 Low — polish / hardening

21. **`addDriverBtn`, `addFuelBtn`, `addExpenseBtn` have no `data-roles` attribute** (`dashboard.html`), so they render for every role even though the backend will reject the POST for roles that aren't allowed (e.g. a `financial_analyst` sees "+ Add Driver" but gets a 403 on submit). Backend enforcement makes this safe, but it's a confusing dead button for the wrong roles.
22. **`package.json` has no `test` script** — `backend/test.js` is a manual smoke-test script (spins up real HTTP calls against a running server) but isn't wired into `npm test`, so it can't be run in CI and doesn't show up as a discoverable test entry point.
23. **`showToast()` messages are rendered via `innerHTML`** even for purely server-generated error strings (see #7) — even error text from a validation message is unnecessary risk once combined with any future change that echoes user input into an error message.
24. **`vehicles.type` ENUM is `('Van','Truck','Mini')`** but the "Add Vehicle" form's dropdown order/labels match this — fine today, but there's no shared source of truth between the DB enum and the frontend `<select>` options, so the two will silently drift if either is changed independently.
25. **`archive/` folder (concept, concept-drishti, concept-gps, security-test.js) is ~1.6MB of superseded prototype code** committed alongside the real app — worth removing from the final submission if judges are expected to review the primary code path, since it doubles the surface area to review and doesn't reflect the shipped app.

---

## Summary table

| # | Severity | Issue | File(s) |
|---|---|---|---|
| 1 | 🔴 | Add Vehicle form field-name mismatch → always fails | `frontend/js/dashboard.js` |
| 2 | 🔴 | Add Driver form field-name mismatch → always fails | `frontend/js/dashboard.js` |
| 3 | 🔴 | Add Fuel Log form field-name mismatch → always fails | `frontend/js/dashboard.js` |
| 4 | 🔴 | Add Maintenance form field-name mismatch → always fails | `frontend/js/dashboard.js` |
| 5 | 🔴 | Add Expense silently discards user input, inserts a zero row | `frontend/js/dashboard.js`, `dashboardController.js` |
| 6 | 🔴 | CSV export crashes (bad array destructure) | `dashboardController.js::exportCsv` |
| 7 | 🟠 | Stored-XSS pattern via unescaped `innerHTML` (~12 sites) | `frontend/js/dashboard.js`, `api.js` |
| 8 | 🟠 | JWT passed as URL query param (export + SSE) | `middleware/auth.js`, `dashboard.js` |
| 9 | 🟠 | Hardcoded DB password fallback in source | `backend/drop_tables.js` |
| 10 | 🟠 | Driver identity matched by name string, not FK | `trackingController.js`, `seed.js` |
| 11 | 🟠 | Signup UI offers roles it silently can't grant | `index.html`, `signup.js`, `authController.js` |
| 12 | 🟠 | Drivers can view all fleet fuel-cost data, unscoped | `routes/dashboard.js` |
| 13 | 🟡 | `updateMaintenance` doesn't validate `status` present | `dashboardController.js` |
| 14 | 🟡 | `updateVehicle`/`updateDriverStatus` "succeed" on nonexistent IDs | `dashboardController.js` |
| 15 | 🟡 | `createError()` helper defined, never used | `errorHandler.js` |
| 16 | 🟡 | No non-negative validation on cost/quantity fields | `dashboardController.js` |
| 17 | 🟡 | `DEMO_CREDENTIALS.md` out of sync with actual seed data | `DEMO_CREDENTIALS.md`, `seed.js` |
| 18 | 🟡 | `capacity` vs `capacity_kg` semantics overloaded/confused | `schema.sql`, `dashboardController.js` |
| 19 | 🟡 | Email change has no verification/undo path | `dashboardController.js` |
| 20 | 🟡 | Account deletion orphans linked driver record | `dashboardController.js` |
| 21 | 🟢 | Create buttons shown to roles that can't use them | `dashboard.html` |
| 22 | 🟢 | No `npm test` script wired to `test.js` | `backend/package.json` |
| 23 | 🟢 | Toasts render via `innerHTML` unnecessarily | `api.js` |
| 24 | 🟢 | No shared source of truth for vehicle-type enum | schema vs frontend |
| 25 | 🟢 | ~1.6MB of superseded prototype code left in repo | `archive/` |

---

## Suggested fix order

1. **Fix the five broken create-forms (#1–#5)** — this is the single biggest gap between "looks done" and "actually works"; none of the primary CRUD flows for Vehicles, Drivers, Fuel, Maintenance, or Expenses currently function through the UI.
2. **Fix the CSV export crash (#6)** — one-line fix (`const rows = await db.query(...)`, no destructure).
3. **Escape all dynamic `innerHTML` interpolation or switch to `textContent`/DOM building (#7)** — this is a real stored-XSS exposure across most of the dashboard.
4. **Remove the hardcoded password default and the JWT-in-URL pattern where avoidable (#8, #9).**
5. **Replace name-string driver matching with a real foreign key (#10)** — this quietly breaks itself the moment a driver edits their profile name.
6. Everything else in Medium/Low can follow as hardening passes.
