# SKILL: Database (MySQL)

Full contract: `database.md`. This file is the execution order, not the spec — don't duplicate rules here, just follow them.

## Build order (do this first, ~30–45 min, before anyone else starts coding)

1. Spin up MySQL 8 locally (or Docker: `docker run -e MYSQL_ROOT_PASSWORD=pass -p 3306:3306 mysql:8`).
2. Create the database: `CREATE DATABASE transitops CHARACTER SET utf8mb4;`
3. Run the 7 `CREATE TABLE` statements from `database.md` **in this order** (respects FK dependencies): `users` → `vehicles` → `drivers` → `trips` → `maintenance_logs` → `fuel_logs` → `expenses`.
4. Write a `seed.sql` covering the checklist in `database.md` §10 (1 user per role, 3 vehicles, 3 drivers incl. one expired-license and one suspended, 2 completed trips, 1 active maintenance log). Run it immediately — don't wait until the demo to discover the schema doesn't support the example workflow.
5. Sanity-check the full example workflow (spec §5) by hand-running the queries dispatch → complete → maintenance would trigger, confirming FKs and enums don't reject anything.
6. Push `schema.sql` + `seed.sql` to the repo so Dev B and Dev C can spin up an identical local DB.

## Definition of done

- [ ] All 7 tables created, matching `database.md` field-for-field (names, types, enum values)
- [ ] Unique constraints on `registration_number`, `license_number`, `email` actually enforced (test with a duplicate insert)
- [ ] Seed data loads cleanly with zero FK errors
- [ ] `schema.sql`/`seed.sql` committed and runnable by teammates with one command

## Common pitfalls

- MySQL `ENUM` values are case-sensitive strings — a stray `'Available'` vs `'available'` will silently fail to match in a `WHERE` clause. Copy-paste from `database.md` §0, don't retype.
- `ON DELETE CASCADE` isn't specified anywhere in the schema on purpose — deleting a vehicle/driver with trip history should be blocked or soft-deleted (`status='retired'`), not cascade-deleted. Don't add cascades without discussing.
- Timestamps: use `TIMESTAMP` not `DATETIME` for `created_at`/`updated_at` so `ON UPDATE CURRENT_TIMESTAMP` works as written.
