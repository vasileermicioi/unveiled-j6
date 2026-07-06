## Why

Step 01 added catalog persistence (`images`, `partners`, `events`) and the `@unveiled/images` pipeline, but admin routes and public pages still need shared, tested business logic for partner/event CRUD, validation, derived datetime fields, and image attach/replace orchestration. Without a domain layer and idempotent demo seed, staging cannot populate sample data and later catalog steps (admin UI, public surfaces) would duplicate rules in route handlers.

## What Changes

- Add catalog domain module(s) under `@unveiled/db` (`packages/db/src/catalog/`) with partner CRUD, event CRUD (including series creation), image attach/replace helpers, capacity recalculation, and a stub `exportRedemptionCodesCsv`.
- Enforce validation aligned with `admin-partners.feature` and `admin-events.feature`: required partner fields, optional logo; required event image (upload XOR remote URL); redemption rules for `SECRET_CODE` / `VOUCHER`; creation defaults; series slot uniqueness; derived `start_time_minutes` and `weekday` from `date_time` in Europe/Berlin.
- Implement `scripts/seed-demo.ts` invoked by `bun run seed:demo` — inserts sample partners (remote URL logos) and upcoming events only when both tables are empty; no-op otherwise.
- Add unit/integration tests in `packages/db/src/catalog/*.test.ts` covering validation failures, defaults, rename propagation, capacity recalculation, and seed idempotency.
- Update `packages/db/README.md` with catalog exports and seed usage; add `@unveiled/images` dependency to `@unveiled/db`.
- **Out of scope:** HonoX admin routes, `@unveiled/ui`, public pages, partner portal-access UI, PARTNER role provisioning, multipart form parsing.

## Capabilities

### New Capabilities

_(none — domain rules extend the existing catalog capability)_

### Modified Capabilities

- `event-catalog`: Add domain-layer requirements for partner/event validation and lifecycle, image attach orchestration, capacity recalculation, and idempotent demo seed.

## Impact

- **Packages:** `@unveiled/db` (new `catalog/` module, tests, README); `@unveiled/images` becomes a runtime dependency of `@unveiled/db`.
- **Scripts:** New `scripts/seed-demo.ts` (root `seed:demo` script already stubbed in `package.json`).
- **Environment:** `DATABASE_URL` required for seed and integration tests; R2 vars required when seed processes remote logo URLs.
- **Downstream:** Consumed by `catalog-03-admin-partners-and-dashboard`, `catalog-04-admin-events-crud`, `catalog-05-public-surfaces-and-release`.
- **Verification:** `cd packages/db && bun test`, `bun run seed:demo` twice on fresh DB, `bun run typecheck`, `bun run lint`.
