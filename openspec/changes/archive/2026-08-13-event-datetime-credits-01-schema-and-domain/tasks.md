## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`packages/db/src/schema/events.ts`, `packages/db/src/catalog/datetime.ts`, `packages/db/src/catalog/events.ts`, `packages/db/src/catalog/errors.ts`, drizzle under `packages/db`)
- [x] 1.2 Lock approach in PR notes: parallel `occurrence_credit_prices`; keep denormalized `credit_price` as primary/next slot price; do not drop `date_time` indexes; booking still charges `events.credit_price`

## 2. Schema & migration

- [x] 2.1 Add `occurrenceCreditPrices` integer array on Drizzle `events` plus checks: `cardinality(date_times) = cardinality(occurrence_credit_prices)` and every element `>= 0`
- [x] 2.2 Generate migration (`bun run db:generate`): add column, backfill `array_fill(credit_price, ARRAY[cardinality(date_times)])`, set NOT NULL + checks; apply locally (`bun run db:migrate`)

## 3. Domain helpers

- [x] 3.1 Add `EventOccurrence` and `tryNormalizeEventOccurrences` (or equivalent) in `datetime.ts`: pair by index, sort by instant, reject empty and duplicate instants, reject credits `< 0`; do not silently unique-merge on the paired path
- [x] 3.2 Add legacy fill helper: unique-sort `dateTimes` via existing `sortUniqueDateTimes` / `tryNormalizeEventDateTimes`, then fill every credit with the single `creditPrice`
- [x] 3.3 Add `CatalogErrorCode` values `DUPLICATE_OCCURRENCE_INSTANTS`, `OCCURRENCE_LENGTH_MISMATCH`, `NEGATIVE_CREDIT_PRICE`; keep `EMPTY_DATE_TIMES`; throw from `events.ts` wrappers, not from `datetime.ts`

## 4. Catalog domain writes

- [x] 4.1 Extend `CreateEventInput` / `UpdateEventInput` / `CloneEventInput` with optional `occurrenceCreditPrices?: number[]`; resolve via the design write table (paired vs legacy fill vs update-`creditPrice`-alone fills all slots)
- [x] 4.2 On create/update/clone: persist both arrays; set `date_time` from `primaryDateTimeFromList`; set `credit_price` from the primary occurrence’s credit; keep Europe/Berlin derived fields; injectable `now?: Date`
- [x] 4.3 Clone: `dateTimes` stays required; omitted `occurrenceCreditPrices` fills from `source.creditPrice`
- [x] 4.4 Leave seed call sites on `dateTimes` + `creditPrice` unless a seed would violate the new NOT NULL column

## 5. Tests

- [x] 5.1 Unit tests in `datetime.test.ts`: duplicate reject, length mismatch, negative credit, primary credit denormalize (past=1 / future=3), legacy single-price fill (including unique-merge of duplicate instants)
- [x] 5.2 Catalog integration: create/update with two distinct prices (sorted order + denormalized `credit_price`); existing multi-datetime tests that pass only `dateTimes` + `creditPrice` still pass

## 6. Verification & handoff

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `bun --filter @unveiled/db test src/catalog/datetime.test.ts src/catalog/catalog.integration.test.ts` (and any new occurrence-credits tests) — datetime unit tests pass without cloud; integration exits 0 when `DATABASE_URL` is available
- [x] 6.4 Mark step 01 done in the parent guide; do not rewrite canonical Gherkin (step 05); optional one-line schema-overview note in the PR
