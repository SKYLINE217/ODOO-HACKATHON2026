# access-control.md — Role-Based Access Control

Owner: **Dev B**. This is the master permission matrix — `backend.md` route tables and `frontend.md` UI-gating must match this exactly. If they ever disagree, this file wins.

## 1. Roles (from `database.md` §0)

`fleet_manager`, `driver`, `safety_officer`, `financial_analyst`

## 2. Permission matrix

| Capability | fleet_manager | driver | safety_officer | financial_analyst |
|---|:---:|:---:|:---:|:---:|
| View dashboard/KPIs | ✅ | ✅ | ✅ | ✅ |
| View vehicles list | ✅ | ✅ | ✅ | ✅ |
| Create/edit vehicle | ✅ | ❌ | ❌ | ❌ |
| Retire/change vehicle status | ✅ | ❌ | ❌ | ❌ |
| View drivers list | ✅ | ✅ | ✅ | ✅ |
| Create/edit driver profile | ✅ | ❌ | ✅ | ❌ |
| Suspend / change driver status | ❌ | ❌ | ✅ | ❌ |
| Create trip (draft) | ✅ | ✅ | ❌ | ❌ |
| Dispatch trip | ✅ | ✅ | ❌ | ❌ |
| Complete / cancel trip | ✅ | ✅ | ❌ | ❌ |
| Create maintenance log | ✅ | ❌ | ❌ | ❌ |
| Close maintenance log | ✅ | ❌ | ❌ | ❌ |
| Log fuel | ✅ | ✅ | ❌ | ❌ |
| Log expenses | ✅ | ❌ | ❌ | ✅ |
| View reports & analytics | ✅ | ❌ | ✅ (safety-related only, see note) | ✅ |
| CSV export | ✅ | ❌ | ❌ | ✅ |

Note: Safety Officer's reports view is scoped to driver compliance data (license expiry, safety scores) — not financial reports. If time is tight, it's acceptable to just give safety_officer read access to the whole reports section and hide the cost/ROI widgets client-side; document whichever you pick here.

## 3. Enforcement layers (defense in depth — do both, not just one)

1. **Backend (source of truth):** every mutating route wrapped in `requireRole([...])` per the table in `backend.md`. A `403` must come back even if the frontend somehow tries a disallowed action.
2. **Frontend (UX only, not security):** hide/disable buttons and nav items the current role can't use, per `frontend.md`. This is purely cosmetic — never rely on it to actually block access.

## 4. How to add a new permission mid-hackathon

If a new endpoint or button is added after kickoff: update this matrix first, then implement in backend + frontend. Don't let the matrix drift out of sync — it's the tie-breaker if backend and frontend disagree about who can do what.
