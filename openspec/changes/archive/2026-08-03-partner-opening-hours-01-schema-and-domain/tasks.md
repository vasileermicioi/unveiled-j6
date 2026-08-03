## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm prerequisites (`packages/db/src/schema/partners.ts`, `catalog/partners.ts` create/update/get, `CatalogValidationError`, schema-overview partners section)
- [x] 1.2 Lock JSON shape and clear-on-disable rules for implementer notes (seven keys; `{closed:true}` or `{open,close}`; no overnight)

## 2. Schema & migration

- [x] 2.1 Add `hasOpeningHours` boolean NOT NULL default false and `openingHours` jsonb nullable (typed) to Drizzle `partners` schema
- [x] 2.2 Run `bun run db:generate`; review migration SQL (defaults; no invented hours backfill)

## 3. Domain types & validation

- [x] 3.1 Define shared types (`OpeningHoursDay`, `OpeningHoursWeek`, day-key union) plus `parseOpeningHours` / `assertOpeningHoursForWrite` (or equivalent) in `@unveiled/db`
- [x] 3.2 Reject missing day keys, bad `HH:MM`, `open >= close`, and enabled+null hours via `CatalogValidationError`; when disabled, coerce `opening_hours` to null

## 4. Partner create/update wiring

- [x] 4.1 Extend `CreatePartnerInput` / `UpdatePartnerInput` with `hasOpeningHours` / `openingHours`; persist on create/update; return fields on selects
- [x] 4.2 Ensure omit-on-create defaults to hours-off; update with `hasOpeningHours: false` clears stored schedule
- [x] 4.3 Export helpers from catalog barrel if needed for step 02/tests

## 5. Tests

- [x] 5.1 Unit tests for accept/reject matrix (full week, closed days, inverted range, missing key, bad time format)
- [x] 5.2 Integration/create-update tests: persist valid schedule; disable clears hours; invalid write does not partially persist

## 6. Verification & handoff

- [x] 6.1 Run `bun run db:generate` (migration reflects columns) and `cd packages/db && bun test` — exit 0
- [x] 6.2 Run `bun run typecheck` and `bun run lint` — exit 0
- [x] 6.3 Optionally patch partners section in `docs/product/database/schema-overview.md`; mark step 01 done in parent guide; note form field names for step 02
