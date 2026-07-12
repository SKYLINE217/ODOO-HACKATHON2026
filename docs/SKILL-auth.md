# SKILL: Authentication & Sign-in

Full contract: `authentication-signin.md`. This file is the execution order, not the endpoint spec.

## Build order

1. Add `bcrypt` and `jsonwebtoken` to the backend project (coordinate with Dev A — you're likely working in the same repo/branch structure).
2. Write the `requireAuth` middleware first — verify JWT from `Authorization: Bearer` header, attach `req.user = { id, role }`, `401` on missing/invalid/expired token. Hand this to Dev A immediately, even before login is fully polished, so they can stop using the stub.
3. Write `requireRole(...roles)` middleware — checks `req.user.role` against the allowed list, `403` if not included. Reference `access-control.md` for the actual per-endpoint role lists (that mapping lives in Dev A's route files, not here).
4. Build `POST /auth/login`: look up user by email, `bcrypt.compare`, sign JWT with `{ sub, role }`, return token + user (no password hash).
5. Build `GET /auth/me`: `requireAuth` + return the current user from `req.user.id`.
6. Build `POST /auth/signup` only if time allows — seeding users directly via `seed.sql` is faster for a hackathon demo and equally valid.
7. Test with all 4 roles against a couple of Dev A's protected endpoints before calling it done.

## Definition of done

- [ ] Login rejects wrong password / nonexistent email with the same generic `401` message
- [ ] Token expires (test with a short-lived token first, e.g. 30s, before setting the real 8h expiry)
- [ ] `requireAuth` and `requireRole` are exported and dropped into Dev A's routes with zero changes needed on their end beyond importing them
- [ ] `/auth/me` never returns `password_hash`
- [ ] Rate limiting active on `/auth/login` (see `security.md`)

## Common pitfalls

- Signing the JWT with a hardcoded secret instead of `process.env.JWT_SECRET` — breaks the moment the app restarts with a different generated secret, or leaks the secret if committed.
- Forgetting `requireAuth` must run *before* `requireRole` in the middleware chain — role check needs `req.user` to already exist.
- Returning different error messages for "wrong password" vs "email not found" — this is a security leak, not just inconsistency (see `security.md`).
