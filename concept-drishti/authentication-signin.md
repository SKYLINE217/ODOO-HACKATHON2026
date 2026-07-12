# authentication-signin.md — Login / Signup Flow

Owner: **Dev B**. Backend and frontend both integrate against this file only — no guessing token shapes.

## 1. Flow summary

1. User signs up or is seeded directly into `users` table with a role (hackathon: seed roles, signup optional bonus).
2. Login with email + password → server verifies hash → issues JWT.
3. Client stores JWT (see storage note below) and sends it as `Authorization: Bearer <token>` on every request after login.
4. `requireAuth` middleware verifies the token on protected routes and attaches `req.user`.

## 2. Password handling

- Hash with `bcrypt`, min. 10 salt rounds.
- Never return `password_hash` in any API response — strip it in the controller before sending.
- Minimum password policy (hackathon-reasonable): 8+ characters. Enforce on the client for UX and again on the server (never trust client-only validation — see `security.md`).

## 3. Endpoints — `/api/v1/auth`

### `POST /api/v1/auth/signup` (optional if you seed users instead)
Body:
```json
{ "name": "Alex Doe", "email": "alex@transitops.com", "password": "secret123", "role": "driver" }
```
`role` must be one of the canonical `user_role` enum values in `database.md`. Response `201`:
```json
{ "success": true, "data": { "id": 4, "name": "Alex Doe", "email": "alex@transitops.com", "role": "driver" } }
```

### `POST /api/v1/auth/login`
Body:
```json
{ "email": "alex@transitops.com", "password": "secret123" }
```
Response `200`:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 4, "name": "Alex Doe", "email": "alex@transitops.com", "role": "driver" }
  }
}
```
Invalid credentials → `401` with generic message `"Invalid email or password"` (never reveal whether the email exists — see `security.md`).

### `GET /api/v1/auth/me`
Requires `Authorization: Bearer <token>`. Returns the current user (same shape as `user` above). This is what the frontend calls on app load to restore session state and determine which UI to render.

## 4. JWT contents

```json
{ "sub": 4, "role": "driver", "iat": 169..., "exp": 169... }
```
- Secret from `process.env.JWT_SECRET` (never hardcoded — see `security.md`).
- Expiry: 8 hours (matches hackathon session length; no refresh token needed).
- Signing algorithm: HS256.

## 5. Middleware contract (what Dev A plugs into their routes)

```js
// requireAuth: verifies JWT, attaches req.user = { id, role }, else 401
router.get('/vehicles', requireAuth, vehicleController.list);

// requireRole: array of allowed roles, else 403
router.post('/vehicles', requireAuth, requireRole('fleet_manager'), vehicleController.create);
```
Full role matrix lives in `access-control.md` — this file only defines the two function signatures backend routes call.

## 6. Frontend responsibilities (see `frontend.md` for detail)

- Store the JWT in memory + `sessionStorage` (not `localStorage`, to reduce XSS token theft window — acceptable hackathon-grade tradeoff, see `security.md`).
- Attach it to every API call via the shared axios/fetch wrapper.
- On `401` response from any endpoint, clear the token and redirect to `/login`.
- On app load, if a token exists, call `GET /auth/me` to restore session before rendering protected routes.
