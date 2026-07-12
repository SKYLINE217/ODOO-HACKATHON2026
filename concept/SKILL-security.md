# SKILL: Security Hardening

Full checklist: `security.md`. This file is when to apply each item during the build, not the checklist itself.

## Build order (interleaved with backend/auth work, not a separate phase)

1. **Before first commit:** create `.env` + `.env.example`, add `.env` to `.gitignore`. Do this before any secret ever touches git history — much harder to fix after the fact.
2. **When scaffolding Express (with Dev A):** add `helmet`, configure CORS to the frontend's dev origin only, add `express-rate-limit` on the auth routes.
3. **When writing any controller that accepts a body (with Dev A):** add schema validation (`zod`/`joi`) matching the fields in `backend.md` — reject extra/unknown fields.
4. **When writing login (you, per `authentication-signin.md`):** generic error messages, bcrypt rounds ≥10, rate limit.
5. **When writing the frontend API client (with Dev C):** confirm token goes in `sessionStorage` not `localStorage`, confirm no `dangerouslySetInnerHTML` is used anywhere user text is rendered.
6. **Last 30 min:** quick pass — check no secrets in git history (`git log -p | grep -i secret` as a sanity check), confirm every mutating route actually has `requireRole`, confirm parameterized queries are used throughout (grep for any string-concatenated SQL).

## Definition of done

- [ ] No secrets in the repo (checked `.env.example` only has placeholders)
- [ ] `helmet` + scoped CORS + rate limiting on login active
- [ ] All inputs validated server-side, not just client-side
- [ ] No raw string concatenation into SQL anywhere
- [ ] Login errors don't leak account existence

## Common pitfalls

- Adding security middleware at the very end instead of at scaffold time — retrofitting CORS/helmet after 50 routes exist is more error-prone than baking it in from route #1.
- Validating on the frontend and assuming that's sufficient — always assumed bypassable; the frontend check is UX, the backend check is security (same principle as `access-control.md`).
- Rate limiting the whole API instead of scoping it to `/auth/login` — over-throttling legitimate dashboard polling during the demo is an easy self-inflicted bug.
