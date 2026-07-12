# SKILL: Access Control (RBAC)

Full contract: `access-control.md`. This file is the execution order, not the permission matrix.

## Build order

1. Finalize the permission matrix in `access-control.md` with the team *before* coding — this is a 10-minute conversation that saves rework later. Especially confirm the safety_officer reports-scope decision (§2 note).
2. Implement `requireRole(...roles)` as part of the auth middleware work (see `authentication-signin.md` SKILL) — this is the enforcement mechanism.
3. Hand Dev A the matrix as a simple reference table (copy straight from `access-control.md`) so they wire the right roles into each route as they build it, rather than guessing.
4. Hand Dev C the same matrix for the `<ProtectedRoute roles={[...]}>` wrapper and nav-item visibility.
5. Once both sides are wired, do a pass logging in as each of the 4 roles and confirming: correct nav items shown, correct pages accessible, correct `403` on direct API calls to disallowed actions (test with curl, not just clicking through the UI — the UI hiding a button proves nothing about the API).

## Definition of done

- [ ] Every row in the permission matrix has been implemented on the backend (403 works) — not just hidden on the frontend
- [ ] All 4 roles tested end-to-end at least once
- [ ] Frontend nav/buttons match the matrix (no role sees a button that 403s when clicked)

## Common pitfalls

- Treating frontend hiding as "access control done" — it's UX only. Always verify the backend `403` independently.
- Letting the matrix drift: someone adds an endpoint mid-hackathon and forgets to add a row here — update the matrix first, then implement, per `access-control.md` §4.
- Safety officer and financial_analyst permissions look similar (both read-heavy) — double check you didn't copy-paste one role's checks onto the other's routes.
