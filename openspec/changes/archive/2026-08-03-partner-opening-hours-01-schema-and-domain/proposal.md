## Why

Admins need to publish optional weekly opening hours on venue records so public event detail can show when a partner is typically open. Today `partners` has no schedule fields and create/update cannot store or validate a week schedule. This step is the schema + domain foundation for parent feature `partner-opening-hours` (step 01 of 03).

## What Changes

- Add `partners.has_opening_hours` (boolean NOT NULL, default `false`) and `partners.opening_hours` (jsonb, nullable).
- Lock a weekly JSON shape: keys `mon`|`tue`|`wed`|`thu`|`fri`|`sat`|`sun`; each value either `{ "closed": true }` or `{ "open": "HH:MM", "close": "HH:MM" }` (24h, zero-padded minutes); `open` strictly before `close` on the same calendar day; overnight spans unsupported.
- When `has_opening_hours` is false, writes MUST store `opening_hours` as null (clear any previous schedule). When true, `opening_hours` MUST include all seven days.
- Extend `CreatePartnerInput` / `UpdatePartnerInput` and create/update paths in `@unveiled/db`; return the fields on partner selects.
- Unit/integration tests for accept/reject matrix and clear-on-disable.
- Out of scope: admin forms, event detail rendering, i18n copy, e2e (steps 02–03).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `partner-catalog`: Persist and validate optional weekly opening hours on `partners`; create/update reject invalid schedules with a catalog validation error; disable clears `opening_hours`.

## Impact

- **DB:** `packages/db/src/schema/partners.ts`, new Drizzle migration; optional note in `docs/product/database/schema-overview.md` (full product doc update may wait for step 03).
- **Domain:** `packages/db/src/catalog/partners.ts`, shared opening-hours types/helpers, package tests under `packages/db`.
- **Dependents:** Admin partner routes continue to omit the new fields until step 02 (defaults keep existing rows hours-off).
- **Source brief:** `.dev-plan/current-iteration/partner-opening-hours-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/partner-opening-hours-parent-guide.md`
- **Verification:** `bun run db:generate`; `cd packages/db && bun test`; `bun run typecheck`; `bun run lint`
