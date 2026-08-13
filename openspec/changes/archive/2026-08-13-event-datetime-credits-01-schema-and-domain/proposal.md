## Why

Catalog events already store `date_times[]` and a single `credit_price`, so every occurrence of a multi-datetime event is forced to the same credit cost. Admins need per-occurrence prices (for example cheaper weekday mornings) before the list UI, range builder, and checkout dropdown can ship. This step is the schema + catalog-domain foundation for parent feature `event-datetime-credits` (step 01 of 05).

## What Changes

- Add `events.occurrence_credit_prices integer[] NOT NULL` with the same cardinality as `date_times`; check every element `>= 0`; backfill existing rows with `array_fill(credit_price)` per `date_times` length.
- Keep denormalized `events.credit_price` equal to the primary/next occurrence’s price (same primary instant as `date_time`). Do not drop `credit_price` or `date_time` btree indexes.
- Catalog create/update/clone persist paired datetimes and credits. Callers MAY pass `{ startsAt, creditPrice }[]` or parallel `dateTimes` + `occurrenceCreditPrices`. When only `dateTimes` + one `creditPrice` are supplied, unique-sort dates (existing helper) then fill every credit with that price — existing seeds and tests keep working.
- Domain normalize helper pairs occurrences, sorts by instant, rejects empty lists and **duplicate instants** (no silent unique-merge when credits can differ).
- Unit tests for pairing/sort/reject-duplicate/legacy fill; catalog integration create/update with two prices.
- Out of scope: admin form, range builder, checkout dropdown, `bookings.date_time`, `bookEvent` signature, e2e, canonical Gherkin (later steps). Booking still charges `events.credit_price`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Schema adds parallel `occurrence_credit_prices`; catalog writes persist credits in datetime-sorted order; denormalized `credit_price` follows the primary/next occurrence; create/update/clone accept paired occurrences or legacy single-price fill.

## Impact

- **DB:** `packages/db/src/schema/events.ts`, new Drizzle migration under `packages/db/drizzle/`. Optional draft note in `docs/product/database/schema-overview.md`; canonical doc sweep is step 05.
- **Domain:** `packages/db/src/catalog/datetime.ts` (`EventOccurrence` + `tryNormalizeEventOccurrences`), `packages/db/src/catalog/events.ts` (`CreateEventInput` / `UpdateEventInput` / `CloneEventInput`), `packages/db/src/catalog/errors.ts` (new validation codes), package tests (`datetime.test.ts`, `catalog.integration.test.ts`).
- **Dependents:** Seeds and callers that pass only `dateTimes` + `creditPrice` stay valid. Admin routes need no UI change in this step. Booking is unchanged (still charges denormalized `credit_price`).
- **Source brief:** `.dev-plan/current-iteration/event-datetime-credits-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun --filter @unveiled/db test src/catalog/datetime.test.ts src/catalog/catalog.integration.test.ts` (datetime unit tests without cloud; integration when `DATABASE_URL` is available)
