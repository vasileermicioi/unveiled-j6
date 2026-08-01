## Why

Events store a Bezirk-style `neighborhood` and member profiles store multi-select `districts`, which cannot grow past Berlin Bezirke and block a postal-based location model. This step lands the extensible `country` / `city` / `zip_code` trio at schema and domain layers (Germany + Berlin only for this release) so admin, public, and onboarding UI steps can switch without inventing validation.

## What Changes

- **BREAKING:** Remove `events.neighborhood`; add required `events.country` (default `DE`), `events.city` (default `berlin`), and `events.zip_code`.
- **BREAKING:** Replace profile `districts: text[]` with `country`, `city`, and `zip_code` on `users.profile` JSONB; clear legacy `districts` on preference writes.
- Add shared `validatePostalCode({ country, city, zipCode })` with a city registry; register only `(DE, berlin)` (5-digit format + Berlin PLZ membership). Unsupported `(country, city)` pairs fail closed.
- Domain create/update/preference paths default omitted country/city to `DE` / `berlin`; reject unsupported pairs if supplied; require a valid Berlin zip under those defaults.
- Update catalog create/update/series inputs, seed helpers, and package tests/fixtures that set `neighborhood`.
- Out of scope: admin/public/onboarding UI copy and forms (steps 02–03); travel distance; docs/e2e (step 04); registering additional cities/countries.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Event location fields become `country` / `city` / `zip_code` (no `neighborhood`); create/update defaults and postal validation under `(DE, berlin)`.
- `member-profile`: Location preference storage becomes `country` / `city` / `zip_code` on `users.profile` (no active `districts` collection); preference saves validate via the same postal registry.

## Impact

- **Schema / migrations:** `packages/db/src/schema/events.ts`, `packages/db/src/schema/users.ts` (`UserProfile` typing), Drizzle migration via `bun run db:generate` / `db:migrate`.
- **Domain:** Catalog create/update/series in `@unveiled/db`; preference/onboarding save paths in `@unveiled/auth` and/or web libs that persist location; shared postal helper (prefer `@unveiled/db` or `@unveiled/auth` / `@unveiled/config` per design — registry shape required either way).
- **Constants:** `DISTRICTS` usage for active preference validation stops for location saves; Berlin PLZ allowlist/ranges live under the `(DE, berlin)` registry entry.
- **Fixtures / seed:** `packages/db` integration tests, seed helpers, and any demo seed that sets `neighborhood` or `districts`.
- **App compile shims:** Minimal type-safe updates so lint/typecheck pass if web parsers still reference `neighborhood` / `districts` (full UI owned by steps 02–03).
- **Source brief:** `.dev-plan/current-iteration/berlin-zip-code-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `berlin-zip-code-02-admin-and-public-ui`, `berlin-zip-code-03-onboarding-and-profile-ui`
- **Verification:** `bun run lint`; `bun run typecheck`; targeted `@unveiled/db` (and auth if touched) unit tests for PLZ accept/reject under `(DE, berlin)` and reject for unsupported city/country
