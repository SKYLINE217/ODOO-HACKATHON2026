# SKILL: Frontend

Full contract: `frontend.md`. This file is the build order, not the page/component list.

## Build order

1. Scaffold the React app, build the shared `api/client.js` from `frontend.md` §2 first — every page depends on it, and it can be built/tested against mocked responses before the backend is fully ready.
2. Build `AuthContext` + `Login` page + `ProtectedRoute` next. Coordinate with Dev B on the exact `/auth/login` and `/auth/me` response shape before wiring — don't guess field names.
3. While waiting on backend endpoints to be live, build pages against hardcoded mock data matching the exact response shapes in `backend.md` — this lets you build UI in parallel instead of blocking on Dev A. Swap mocks for real `apiFetch` calls as each endpoint comes online.
4. Build `Layout` (role-filtered nav) and `Dashboard` first — simplest read-only page, good smoke test for the whole auth+API pipeline.
5. Build `Vehicles`/`Drivers` (CRUD tables) next, then `Trips` (most complex — dispatch pool dropdowns, cargo weight check, status transitions), then `Maintenance`/`FuelExpenses`, then `Reports` last (depends on everything else having real data to show).
6. Once each page is live against the real backend, re-check role gating: log in as each of the 4 roles and confirm nav + page access matches `access-control.md`.

## Definition of done

- [ ] No raw `fetch()` calls outside `api/client.js`
- [ ] Every status value rendered via `StatusBadge` using the exact enum strings from `database.md` §0
- [ ] Trip form's vehicle/driver dropdowns pull from the dispatch-pool endpoints, not the full list
- [ ] 401 from any call clears the session and redirects to `/login`
- [ ] All 4 roles produce the correct nav/page visibility

## Common pitfalls

- Building the trip form against `GET /vehicles` instead of `GET /vehicles/dispatch-pool` — technically works until a retired vehicle shows up in the dropdown during the demo.
- Hardcoding status label strings/colors per-page instead of one shared `StatusBadge` — a backend enum tweak then requires hunting through every page instead of one component.
- Storing the JWT in `localStorage` "just to get it working" and forgetting to switch to `sessionStorage` before the demo (see `security.md`).
