## Why

Catalog events store only event-level `total_capacity` / `remaining_capacity`, so later Date & tickets UI cannot round-trip Shared vs Per date allocation. This step persists `capacity_mode` and a parallel `occurrence_capacities[]` array and wires catalog create/update/clone, with no admin UI. It is the schema + domain foundation for parent feature `event-date-tickets` (step 01 of 04).

## What Changes

- Add Postgres enum `capacity_mode` (`SHARED` | `PER_OCCURRENCE`) and `events.capacity_mode` NOT NULL default `SHARED`.
- Add `events.occurrence_capacities integer[] NOT NULL` with the same cardinality as `date_times`; check every element `>= 0`; backfill existing rows with `array_fill(total_capacity, ARRAY[cardinality(date_times)])`.
- Keep event-level `total_capacity` and `remaining_capacity`. Booking and waitlist stay on those columns (no per-slot remaining).
- Extend occurrence normalize to pair `{ startsAt, creditPrice, capacity }`. Reject empty lists, duplicate instants, negative credits, negative capacities, and length mismatch. When capacities are omitted, fill every element from `totalCapacity` and treat the event as `SHARED`.
- Create/update/clone accept `capacityMode` + `occurrenceCapacities` (or capacities on the occurrence list). `PER_OCCURRENCE`: `total_capacity` equals `sum(occurrence_capacities)` and that sum MUST be `>= 1`. `SHARED`: caller’s `totalCapacity` (default 10) is the event total; the array is filled with that value.
- Clone copies `capacity_mode` and `occurrence_capacities` (re-normalized against the clone’s datetimes) and sets `remaining_capacity` equal to `total_capacity`. Update keeps `recalculateRemainingCapacity` when the derived or posted total changes.
- Export `CapacityMode` from `@unveiled/db`. New `CatalogValidationError` codes: `NEGATIVE_CAPACITY`, `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`.
- Unit tests in `datetime.test.ts`; integration create/update/clone in `catalog.integration.test.ts` / `clone-event.integration.test.ts`.
- Out of scope: admin form, parsers, booking/waitlist per-slot remaining, voucher mismatch error, Gherkin/e2e, canonical `docs/product/` sweep (step 04). Seeds that pass only `totalCapacity` keep working.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Schema adds `capacity_mode` and parallel `occurrence_capacities`; catalog writes persist capacities in datetime-sorted order; `SHARED` fills the array from event-level `total_capacity`; `PER_OCCURRENCE` derives `total_capacity` as the sum; create/update/clone accept paired occurrences or legacy fill; clone copies mode + array; booking remaining stays event-scoped.

## Impact

- **DB:** `packages/db/src/schema/events.ts`, new Drizzle migration under `packages/db/drizzle/` (next after `0023`). Optional one-line draft in `docs/product/database/schema-overview.md`; canonical doc sweep is step 04.
- **Domain:** `packages/db/src/catalog/datetime.ts` (`EventOccurrence` + `tryNormalizeEventOccurrences`), `packages/db/src/catalog/events.ts` (`CreateEventInput` / `UpdateEventInput` / `CloneEventInput`), `packages/db/src/catalog/validation.ts` (`applyEventDefaults`), `packages/db/src/catalog/errors.ts` (new validation codes), package tests (`datetime.test.ts`, `catalog.integration.test.ts`, `clone-event.integration.test.ts`).
- **Dependents:** Seeds and callers that pass only `totalCapacity` stay valid (`SHARED` + fill). Admin routes need no UI change in this step. Booking/waitlist unchanged (still event-level remaining).
- **Source brief:** `.dev-plan/current-iteration/event-date-tickets-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/event-date-tickets-parent-guide.md`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun --filter @unveiled/db test src/catalog/datetime.test.ts` (no cloud); integration tests when `DATABASE_URL` is set
