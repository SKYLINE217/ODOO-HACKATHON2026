# frontend.md — Pages, Components & API Integration

Owner: **Dev C**. Every API call in this file's components must match `backend.md` and `authentication-signin.md` exactly — same paths, same body field names, same response envelope.

## 1. Stack

React + React Router. State: Context API (simpler for 8 hours) with a small `AuthContext` (current user/token) and either component-local state or a light global store for lists (vehicles/drivers/trips). Charts: Recharts or Chart.js for the bonus analytics.

## 2. Shared API layer (build this first, before any page)

One file, e.g. `src/api/client.js`:
```js
const BASE_URL = '/api/v1';

async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error(json.error?.message || 'Request failed');
  }
  return json.data; // envelope already unwrapped here
}
```
Every page imports from this file — no raw `fetch` calls scattered around, so if the backend response shape ever needs a tweak it's a one-file fix.

## 3. Routing & pages

| Route | Page | Roles that see it (per `access-control.md`) |
|---|---|---|
| `/login` | Login | public |
| `/` | Dashboard (KPIs + filters) | all |
| `/vehicles` | Vehicle registry (list + create/edit modal) | all view; create/edit gated to fleet_manager |
| `/drivers` | Driver management | all view; create/edit gated to fleet_manager/safety_officer |
| `/trips` | Trip list + create/dispatch/complete/cancel actions | fleet_manager, driver |
| `/maintenance` | Maintenance logs | fleet_manager |
| `/fuel-expenses` | Fuel logs + expenses | fleet_manager, driver, financial_analyst |
| `/reports` | Reports & analytics + CSV export | fleet_manager, safety_officer, financial_analyst |

A `<ProtectedRoute roles={[...]}>` wrapper checks `AuthContext.user.role` against the allowed list and redirects to `/` (with a toast) if not permitted — this must mirror `access-control.md` exactly, don't invent a different set of allowed roles per page.

## 4. Component structure (suggested)

```
/src
  /api/client.js
  /context/AuthContext.jsx
  /components
    Layout.jsx (sidebar nav, filtered by role)
    ProtectedRoute.jsx
    StatusBadge.jsx (maps enum value → colored pill, uses the canonical strings from database.md)
    KpiCard.jsx
    DataTable.jsx (reusable table w/ filter/sort props)
  /pages
    Login.jsx
    Dashboard.jsx
    Vehicles.jsx
    Drivers.jsx
    Trips.jsx
    Maintenance.jsx
    FuelExpenses.jsx
    Reports.jsx
```

## 5. Key UI behaviors tied to business rules

- **Trip creation form:** vehicle and driver dropdowns are populated from `GET /vehicles/dispatch-pool` and `GET /drivers/dispatch-pool` — never the full list — so unavailable vehicles/drivers are physically impossible to pick, not just disabled.
- **Cargo weight field:** client-side warning if it exceeds the selected vehicle's `max_load_capacity_kg`, but the actual block happens server-side (§backend.md dispatch validation) — show the server's error message if it still gets through.
- **Status badges:** every status column (`vehicle_status`, `driver_status`, `trip_status`, `maintenance_status`) renders via `StatusBadge`, using the exact enum strings from `database.md` §0 as the source of truth for labels/colors, so a backend enum change can't silently break the UI.
- **Dashboard filters** (`type`, `status`, `region`) are just query params appended to `GET /dashboard` and `GET /vehicles` — same param names on both, per `backend.md`.

## 6. Auth integration

- On app load: check `sessionStorage` for a token → if present, call `GET /auth/me` → populate `AuthContext` → render app. If it fails (expired token), clear and show `/login`.
- Login page posts to `/auth/login`, stores `data.token` in `sessionStorage`, stores `data.user` in `AuthContext`, redirects to `/`.
- Logout: clear `sessionStorage` + context, redirect to `/login`. No server call needed (stateless JWT, no revocation in scope for 8 hours).

## 7. Bonus features (only after mandatory deliverables work end-to-end)

- Charts on `/reports` (fuel efficiency trend, utilization over time, cost breakdown pie).
- Search/filter/sort on `DataTable` (client-side filtering is fine for hackathon data volumes).
- Dark mode via a CSS class toggle + `prefers-color-scheme`.
- License-expiry email reminders and PDF export are backend-driven — flag to Dev A/B if time allows, not a frontend-only task.
