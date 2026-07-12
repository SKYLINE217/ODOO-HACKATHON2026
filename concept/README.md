# TransitOps — Team Docs & Work Split

This folder is the single source of truth for the hackathon build. Read this file first.

## The golden rule

**Nothing gets coded until `database.md` and the "API Contract" section of `backend.md` are agreed by all 3 of you.** Everything else (frontend components, auth middleware, access rules) is written *against* those two documents. If all three of you code against the same contract, merging at the end is just `git merge` — not a redesign.

Budget the first **30–45 minutes** of the 8 hours for this: sit together, lock the schema and endpoint list, then split and go heads-down.

## Team split (3 people, 2 docs each)

| Person | Owns | Builds |
|---|---|---|
| **Dev A — Data & API** | `database.md`, `backend.md` | MySQL schema + all CRUD/business-rule endpoints |
| **Dev B — Identity & Security** | `authentication-signin.md`, `access-control.md`, `security.md` | Login/signup, JWT middleware, RBAC guards, hardening |
| **Dev C — Frontend** | `frontend.md` | All pages/components, consuming the API contract as-is |

Security.md is grouped with Dev B because most of it (auth headers, rate limiting on login, password rules) is implemented inside the same middleware layer Dev B is already writing. Dev A applies the DB-level parts (parameterized queries, unique constraints) as they build.

## Why this split won't collide at merge time

1. **One schema, one owner.** Dev A finalizes `database.md` first; Dev B and Dev C only *reference* table/column names, never invent their own.
2. **One API contract, one owner.** Every endpoint Dev C calls from the frontend is copy-pasted from `backend.md`, not guessed. If a needed endpoint is missing, it gets added to `backend.md` (not improvised in the frontend code).
3. **Enums are defined once** in `database.md` and reused verbatim (same strings, same casing) in `backend.md` validation, `access-control.md` role checks, and `frontend.md` dropdowns/badges.
4. **Auth is a black box to everyone else.** Dev B exposes exactly two things the others need: (a) the `/api/v1/auth/*` endpoints (documented in `authentication-signin.md`) and (b) an Express middleware `requireAuth` / `requireRole(...)` that Dev A drops into their routes. Dev C only needs to know: store the JWT, send it as `Authorization: Bearer <token>`, and what `role` comes back in `/me`.
5. **Response envelope is fixed** (see `backend.md`) so Dev C's API layer can be written before every endpoint even exists — just stub the shape.

## Suggested stack (change if your team knows something better, but lock it in the first 10 minutes)

- **DB:** MySQL 8
- **Backend:** Node.js + Express + `mysql2`/Sequelize (or Prisma with the MySQL connector)
- **Auth:** JWT (access token only — skip refresh tokens, not worth it in 8 hours)
- **Frontend:** React + React Router + fetch/axios wrapper + Context (or Redux if the team is faster with it) + a chart lib (Recharts/Chart.js) for the bonus analytics

## Git workflow to avoid conflicts

- One shared repo, 3 branches: `feat/backend`, `feat/auth`, `feat/frontend`.
- Backend and auth both touch the Express app — Dev A scaffolds the base Express app + folder structure in the first 15 min and pushes to `main` once, so Dev B branches off something real instead of an empty repo.
- Frontend never touches backend code and vice versa — the only shared contract is `backend.md` + `authentication-signin.md`.
- Merge order at the end: `feat/backend` → `feat/auth` → `feat/frontend`, testing after each merge.

## File index

- `database.md` — MySQL schema, all tables, enums, relationships (Dev A)
- `backend.md` — REST API contract + business-rule enforcement (Dev A)
- `authentication-signin.md` — login/signup flow, JWT shape, endpoints (Dev B)
- `access-control.md` — role → permission matrix, middleware design (Dev B)
- `security.md` — hardening checklist (Dev B, applied by all)
- `frontend.md` — pages, components, state, API integration (Dev C)
