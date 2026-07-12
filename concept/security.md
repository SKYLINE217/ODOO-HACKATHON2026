# security.md — Hardening Checklist

Owner: **Dev B** (implemented mostly in the Express middleware layer; Dev A applies the DB-level items; Dev C applies the client-side items).

## 1. Secrets & config

- All secrets (`JWT_SECRET`, `DB_PASSWORD`, `DB_USER`) in a `.env` file, never committed. Commit a `.env.example` with blank values instead.
- `.env` added to `.gitignore` before the first commit.

## 2. Transport & headers

- Use `helmet` middleware for sensible default HTTP security headers.
- Enable CORS narrowly — allow only the frontend's dev origin (e.g. `http://localhost:5173`), not `*`.
- Serve over HTTPS in any deployed demo (most hosting platforms give this for free — don't disable it).

## 3. Input validation

- Validate every request body server-side with a schema library (`zod`/`joi`) — never trust the frontend's validation alone.
- Reject unknown/extra fields rather than silently ignoring them.
- Enforce the enum values from `database.md` §0 server-side — a role or status string that isn't in the canonical list is a `400`, not a silent fallback.

## 4. SQL injection

- Use parameterized queries / prepared statements everywhere (`mysql2` placeholders `?`, or your ORM's query builder). Never string-concatenate user input into SQL.

## 5. XSS

- React escapes output by default — just avoid `dangerouslySetInnerHTML` anywhere user-entered text (trip source/destination, maintenance description, etc.) is rendered.
- Sanitize/trim free-text fields server-side before storing.

## 6. Auth-specific

- Passwords hashed with bcrypt (≥10 rounds) — see `authentication-signin.md`.
- Login errors are generic (`"Invalid email or password"`) — don't leak whether the email exists.
- Rate-limit `/api/v1/auth/login` (e.g. `express-rate-limit`, 5 attempts / 15 min per IP) to blunt brute-force attempts.
- JWT stored client-side in `sessionStorage`, not `localStorage`, and never logged to the console in production builds.

## 7. Authorization

- Every mutating endpoint checks role server-side per `access-control.md` — frontend hiding a button is not access control.
- A user can only be resolved from their JWT (`req.user`), never trust a `role` or `user_id` field passed in the request body to determine permissions.

## 8. Data integrity

- Status-changing operations (dispatch, complete, cancel, open/close maintenance) run inside a single DB transaction so a partial failure can't leave a vehicle "on_trip" with no matching trip, etc. (see `backend.md` §4–5).
- Unique constraints on `registration_number` and `license_number` at the DB level, not just app-level checks (race conditions).

## 9. If time allows (bonus, not required)

- Basic audit log table (`who did what, when`) for status-changing actions.
- Helmet's `contentSecurityPolicy` tightened beyond defaults.
- Refresh-token rotation instead of one long-lived 8h token.
