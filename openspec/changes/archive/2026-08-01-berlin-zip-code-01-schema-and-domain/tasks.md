## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/berlin-zip-code-01-schema-and-domain.md` and parent guide Location Model + migration notes
- [x] 1.2 Inventory current `neighborhood` / `districts` / `DISTRICTS` usages in `packages/db`, `packages/auth`, and `apps/web` call sites that must typecheck after the change

## 2. Postal validator

- [x] 2.1 Add `validatePostalCode({ country, city, zipCode })` + registry in `@unveiled/db` with only `(DE, berlin)` registered (5-digit format + documented Berlin PLZ ranges 10115–14199); typed errors for missing/invalid/unsupported
- [x] 2.2 Export helper/types/errors from `@unveiled/db` package entry
- [x] 2.3 Unit tests: valid Berlin under DE/berlin pass; malformed and non-Berlin fail; unsupported country/city fail

## 3. Schema migration

- [x] 3.1 Update `packages/db/src/schema/events.ts`: add `country` / `city` / `zip_code`; remove `neighborhood`
- [x] 3.2 Update `UserProfile` in `packages/db/src/schema/users.ts`: add `country` / `city` / `zip_code`; keep optional legacy `districts` for reads
- [x] 3.3 Generate migration (`bun run db:generate`) with Bezirk→representative-PLZ backfill, `DE`/`berlin` defaults, then NOT NULL `zip_code` and drop `neighborhood`
- [x] 3.4 Apply migration locally/staging (`bun run db:migrate`) and confirm columns

## 4. Catalog domain

- [x] 4.1 Update `CreateEventInput` / `UpdateEventInput` / series inputs: replace `neighborhood` with `zipCode` (+ optional `country`/`city`); default omitted to `DE`/`berlin`; call `validatePostalCode` on create/update/series
- [x] 4.2 Update insert/update paths and any catalog validation helpers to persist the location trio
- [x] 4.3 Update seed helpers and package fixtures/tests that set `neighborhood` to use Berlin zips under `DE`/`berlin`

## 5. Preference / onboarding domain

- [x] 5.1 Change `LocationStepPayload` and `validateOnboardingStepPayload("location")` to accept zip (+ optional country/city), validate via `validatePostalCode`, clear `districts`, set `max_distance: null`
- [x] 5.2 Update `isLocationStepDone` / progress inference to use `profile.zip_code` instead of `districts`
- [x] 5.3 Update `updateMemberPreferences` (and related profile merge) to persist the location trio and clear legacy `districts`
- [x] 5.4 Update `@unveiled/auth` unit/integration tests for location/preferences

## 6. Compile shims and verification

- [x] 6.1 Minimal `apps/web` parser/type updates so references to `neighborhood` / `districts` typecheck (full UI chrome deferred to steps 02–03)
- [x] 6.2 Run `bun run lint` — exit 0
- [x] 6.3 Run `bun run typecheck` — exit 0
- [x] 6.4 Run targeted `@unveiled/db` (and auth if touched) unit tests for postal + preference/location paths — exit 0
- [x] 6.5 Confirm invalid PLZ / unsupported city throw typed errors usable by later UI mappers
- [x] 6.6 Mark step done in parent guide; note migration/backfill + city-key (`berlin`) + PLZ-range decision for step 04 `gaps-and-decisions.md`
