## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`packages/db/src/schema/events.ts`, `packages/db/src/catalog/datetime.ts`, `packages/db/src/catalog/events.ts`, `packages/db/src/catalog/validation.ts`, `packages/db/src/catalog/errors.ts`, drizzle under `packages/db`, migration `0019` as the template)
- [x] 1.2 Lock approach in PR notes: parallel `occurrence_capacities`; enum `capacity_mode` default `SHARED`; SHARED always rewrites the array from `total_capacity`; booking remaining stays event-level; do not add `SHARED_CAPACITY_MISMATCH`

## 2. Schema & migration

- [x] 2.1 Add `capacityModeEnum` (`SHARED` | `PER_OCCURRENCE`) plus `capacityMode` (NOT NULL default `SHARED`) and `occurrenceCapacities` integer array on Drizzle `events`; export type `CapacityMode`; add checks `cardinality(date_times) = cardinality(occurrence_capacities)` and `0 <= ALL (occurrence_capacities)`
- [x] 2.2 Generate migration (`bun run db:generate`): create enum, add columns, backfill `SHARED` + `array_fill(total_capacity, ARRAY[cardinality(date_times)])`, set NOT NULL + checks; apply locally (`bun run db:migrate`)

## 3. Domain helpers

- [x] 3.1 Extend `EventOccurrence` with optional `capacity`; extend `NormalizedEventOccurrences` with `occurrenceCapacities`; add `NEGATIVE_CAPACITY` (and capacity `LENGTH_MISMATCH`) to the datetime result union; pair/sort capacities with instants; reject negative or non-integer capacities; do not silently unique-merge on the paired path
- [x] 3.2 Keep legacy credit fill; add SHARED capacity fill (`dateTimes.map(() => totalCapacity)`) used when capacities are omitted
- [x] 3.3 Add `CatalogErrorCode` values `NEGATIVE_CAPACITY` and `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`; map them from `throwFromNormalize`; PER_OCCURRENCE sum `< 1` uses `REQUIRED_FIELD`; keep datetime.ts free of catalog error types

## 4. Catalog domain writes

- [x] 4.1 Default `capacityMode` to `SHARED` in `applyEventDefaults`; extend `CreateEventInput` / `UpdateEventInput` / `CloneEventInput` with optional `capacityMode?: CapacityMode` and `occurrenceCapacities?: number[]`
- [x] 4.2 Resolve mode + total + array per the design write table: SHARED (or omitted capacities) fills from `totalCapacity`; PER_OCCURRENCE requires equal-length capacities and sets `total_capacity` to the sum (`>= 1`); ignore posted per-row capacities in SHARED
- [x] 4.3 On create/clone set `remaining_capacity = total_capacity`. On update call `recalculateRemainingCapacity` when the **derived** total changes (including PER_OCCURRENCE sum changes when `input.totalCapacity` was omitted). Do not flatten a PER_OCCURRENCE array on a `totalCapacity`-only update
- [x] 4.4 Clone: copy `input.capacityMode ?? source.capacityMode`; omitted capacities + SHARED fills from `source.totalCapacity`; omitted capacities + PER_OCCURRENCE copies `source.occurrenceCapacities` (length mismatch rejects). Leave seed call sites on `totalCapacity` only

## 5. Tests

- [x] 5.1 Unit tests in `datetime.test.ts`: paired capacities sort with instants, negative capacity reject, capacity length mismatch, SHARED/legacy fill when capacities omitted
- [x] 5.2 Catalog integration: create SHARED `{12,12}` with two datetimes; create PER_OCCURRENCE capacities 4 and 6 → `total_capacity` 10; existing `totalCapacity`-only creates still persist SHARED fill
- [x] 5.3 Clone integration: clone copies `capacity_mode` and `occurrence_capacities`; `remaining_capacity` equals `total_capacity`

## 6. Verification & handoff

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `bun --filter @unveiled/db test src/catalog/datetime.test.ts` — exits 0 (no cloud)
- [x] 6.4 Run `bun --filter @unveiled/db test src/catalog/catalog.integration.test.ts src/catalog/clone-event.integration.test.ts` — exits 0 when `DATABASE_URL` is set
- [x] 6.5 Mark step 01 done in the parent guide; do not rewrite canonical Gherkin (step 04); optional one-line schema-overview note in the PR
