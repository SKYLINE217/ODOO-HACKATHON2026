# SKILL: Backend (API)

Full contract: `backend.md`. This file is the execution order and pitfalls, not the endpoint list — copy endpoint shapes from there, don't retype them here.

## Build order

1. Scaffold Express app + folder structure from `backend.md` §0. Wire up the MySQL connection using the schema Dev A (you) already created. Push to `main` early so Dev B has a real app to branch from.
2. Stub `requireAuth`/`requireRole` as pass-through no-ops temporarily (`req.user = { id: 1, role: 'fleet_manager' }`) so you're not blocked waiting on Dev B — swap in the real middleware the moment it's ready.
3. Build read-only GETs first (vehicles, drivers, trips, dashboard) — these unblock Dev C immediately and have no business-rule complexity.
4. Build the two dispatch-pool endpoints (`GET /vehicles/dispatch-pool`, `GET /drivers/dispatch-pool`) — Dev C needs these for the trip form early.
5. Build trip create → dispatch → complete → cancel, with the validation chain and transactions exactly as ordered in `backend.md` §4. Test the full example workflow (spec §5) end-to-end via curl/Postman before telling anyone it's done.
6. Build maintenance create/close (with the vehicle-status side effect), then fuel logs and expenses (simpler, no side effects).
7. Build `/reports/*` last — they're read-only aggregations over data that needs to already exist.
8. Swap the stubbed auth middleware for Dev B's real one as soon as it's ready; re-test every route for correct `401`/`403` behavior.

## Definition of done

- [ ] Every response follows the `{ success, data }` / `{ success, error }` envelope, no exceptions
- [ ] Dispatch/complete/cancel/maintenance side effects run in a transaction (kill the DB connection mid-request in a test — nothing should be left half-updated)
- [ ] Dispatch-pool endpoints never return `in_shop`/`retired`/`on_trip` vehicles or expired/suspended drivers
- [ ] Every mutating route has the correct `requireRole([...])` per `access-control.md`
- [ ] Full example workflow (spec §5) runs start to finish without manual DB edits

## Common pitfalls

- Forgetting the transaction wrapper means a crash between "set vehicle to on_trip" and "set driver to on_trip" leaves inconsistent state — this is the #1 way a demo breaks live.
- Returning `password_hash` in any user object — strip it in every controller, not just the auth ones.
- Validating cargo weight/status client-side only and skipping the server check "because the frontend already checks" — the frontend check is UX, this one is the actual rule.
