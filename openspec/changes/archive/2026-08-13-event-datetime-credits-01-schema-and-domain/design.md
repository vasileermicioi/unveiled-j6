## Context

Parent feature: per-occurrence credits (`.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`), step 01 — schema + catalog domain only.

Current state:

- `events.date_times timestamptz[] NOT NULL` with check `cardinality >= 1`; `events.date_time` is the denormalized primary/next instant, synced on create/update/clone.
- `events.credit_price integer NOT NULL` is a single event-level price. Booking still charges this column (step 04 owns slot-scoped charging).
- `CreateEventInput` / `UpdateEventInput` / `CloneEventInput` take `dateTimes: Date[]` plus a single `creditPrice` (clone copies `source.creditPrice`).
- `sortUniqueDateTimes` / `tryNormalizeEventDateTimes` / `primaryDateTimeFromList` live in `packages/db/src/catalog/datetime.ts`. Duplicate instants are **silently unique-merged** today.
- Seeds and most tests pass only `dateTimes` + `creditPrice`.

Product locks for this feature: parallel integer array (no `event_occurrences` table); reject duplicate instants on the paired path; keep denormalized `credit_price` as the primary/next slot’s price; capacity stays event-scoped. UI, range builder, and booking-slot selection are later steps.

Constraints: business logic in `@unveiled/db`; Europe/Berlin for `date_time` / `start_time_minutes` / `weekday`; injectable `now?: Date` on write helpers; do not drop `date_time` btree indexes.

## Goals / Non-Goals

**Goals:**

- Persist `occurrence_credit_prices integer[]` with the same cardinality as `date_times`; backfill from `credit_price`; NOT NULL; DB checks for equal cardinality and every element `>= 0`.
- Domain helper pairs `{ startsAt, creditPrice }`, sorts by instant, rejects empty and duplicate instants.
- Legacy callers that pass only `dateTimes` + one `creditPrice` unique-sort dates (existing helper) then fill every credit with that price.
- Create/update/clone persist both arrays and set denormalized `credit_price` from the primary occurrence.
- Tests cover pairing, sort, duplicate reject, length mismatch, negative credits, primary credit denormalize, legacy fill, and at least one multi-price create/update.

**Non-Goals:**

- Admin create/edit/clone form islands, per-row credits UI, or dropping the event-level Credits field (step 02).
- Range builder / partner-hours defaults (step 03).
- Checkout dropdown, `bookings.date_time`, `bookEvent` signature, waitlist promotion slot (step 04).
- Canonical Gherkin / schema-overview sweep / e2e (step 05). A one-line PR note is enough if schema-overview is drafted here.
- Per-occurrence capacity or inventory; dropping `credit_price` or `date_time`.

## Decisions

1. **Parallel arrays, not a child table (parent lock)**
   - **Choice:** Add `events.occurrenceCreditPrices` as `integer("occurrence_credit_prices").array().notNull()`. Checks: `cardinality(date_times) = cardinality(occurrence_credit_prices)` and `0 <= ALL (occurrence_credit_prices)` (Postgres CHECK cannot contain a `NOT EXISTS` subquery). Keep `credit_price` as denormalized primary/next price.
   - **Rationale:** Matches locked storage; smallest blast radius for cards/feed/map that already read `credit_price`; booking unchanged this step.
   - **Alternatives:** `event_occurrences` table (rejected in parent guide); JSONB list (weaker checks, worse typing).

2. **Two normalize paths: paired (strict) vs legacy fill (compat)**
   - **Choice:** Add `EventOccurrence = { startsAt: Date; creditPrice: number }` and `tryNormalizeEventOccurrences` (or equivalent result type) in `datetime.ts`.
     - **Paired path** (`occurrences[]` or `dateTimes` + `occurrenceCreditPrices` of equal length): pair by index, sort by `startsAt` ascending so credits follow their instant, reject empty, reject two rows that share the same epoch ms, reject any `creditPrice < 0` or non-integer. Do **not** call `sortUniqueDateTimes` here — that helper silently drops duplicates.
     - **Legacy path** (only `dateTimes` + one `creditPrice`): existing `tryNormalizeEventDateTimes` (unique-sort) then `array_fill` that price. Empty still maps to `EMPTY_DATE_TIMES`. Negative `creditPrice` is rejected.
   - **Rationale:** Parent lock forbids silent unique-merge when credits can differ; existing seeds/tests and the current admin single-price field must keep working until step 02.
   - **Alternatives:** Always reject duplicates, including today’s `[next, next]` create test (breaks mergeability); always unique-merge and pick one credit (violates the lock).

3. **Write-helper API on create/update/clone**
   - **Choice:** Optional `occurrenceCreditPrices?: number[]` on `CreateEventInput` / `UpdateEventInput` / `CloneEventInput`. Resolve in one catalog helper used by all three writes:
     | Input | Behavior |
     |---|---|
     | `occurrenceCreditPrices` set | Paired path with `dateTimes` (create/clone required; update uses existing `dateTimes` when omitted). Length must match **after** the dates used for pairing (update-without-`dateTimes`: stored list length). |
     | `dateTimes` set, credits omitted | Legacy unique-sort + fill from `creditPrice` (create: required; update: `input.creditPrice ?? existing.creditPrice`; clone: `source.creditPrice`). |
     | Neither array on update, `creditPrice` set | Fill **all** stored slots with that price (legacy admin still posts one Credits field). |
     | Neither array, `creditPrice` omitted | Leave both arrays; denormalized `credit_price` stays the primary slot’s stored price. |
   - After normalize: persist `date_times` + `occurrence_credit_prices`; set `date_time` via existing `primaryDateTimeFromList`; set `credit_price` to the credit at that same primary index; derive `start_time_minutes` / `weekday` from primary as today.
   - **Clone:** `dateTimes` stays required (admin clone always posts dates). Omitting `occurrenceCreditPrices` fills from `source.creditPrice` (flatten). Step 02 will post parallel credits so clone can keep mixed prices. Do not copy source per-slot prices by instant-matching in this step.
   - **Rationale:** One write path; current callers typecheck without UI changes.
   - **Alternatives:** Require `occurrences: EventOccurrence[]` only (breaks every call site); remap clone credits by instant (nice, but extra behavior not needed until the clone form posts rows).

4. **CatalogValidationError codes**
   - **Choice:** Keep `EMPTY_DATE_TIMES`. Add `DUPLICATE_OCCURRENCE_INSTANTS`, `OCCURRENCE_LENGTH_MISMATCH`, `NEGATIVE_CREDIT_PRICE`. Throw from `events.ts` wrappers (`requireNormalizedOccurrences` / `requireLegacyFilledOccurrences`); keep `datetime.ts` free of catalog error types (return `null` or a small result union).
   - **Rationale:** Matches existing `CatalogValidationError` pattern (`EMPTY_DATE_TIMES`). Do not reuse `DUPLICATE_SERIES_SLOTS` (series API is gone).
   - **Alternatives:** Collapse all to `REQUIRED_FIELD` (opaque for tests).

5. **Primary credit follows the same `now` as primary datetime**
   - **Choice:** Reuse injectable `now?: Date` already on create/update/clone. After sorting, find the primary instant with `primaryDateTimeFromList`, then take the credit at that index. Example: past slot priced 1 + future slot priced 3 → `date_time` is the future instant and `credit_price` is 3.
   - **Rationale:** Cards/feed/map stay consistent; booking this step still charges that denormalized price.
   - **Alternatives:** Always use `occurrence_credit_prices[0]` (wrong when the earliest slot is past).

6. **Drizzle migration shape**
   - **Choice:** Add nullable `occurrence_credit_prices integer[]`; `UPDATE events SET occurrence_credit_prices = array_fill(credit_price, ARRAY[cardinality(date_times)])`; set NOT NULL; add the two checks. Generate via `bun run db:generate` then apply `bun run db:migrate`. Do not rewrite historical `credit_ledger` rows.
   - **Rationale:** Step plan names `array_fill`; `credit_price` is already NOT NULL; existing `date_times` cardinality check guarantees a non-empty dimension.
   - **Alternatives:** `array_agg` from `generate_series` (equivalent, more verbose).

## Risks / Trade-offs

- **[Risk] Stale `credit_price` if a path writes `occurrence_credit_prices` without sync** → Mitigation: only create/update/clone write both arrays, through the same normalize helper. No raw partial array updates.
- **[Risk] Legacy unique-merge vs paired reject** → Mitigation: document in helper JSDoc; unit-test both; integration test that `dateTimes: [a, a]` + single `creditPrice` still unique-merges, while parallel credits with duplicate instants reject.
- **[Risk] Update `creditPrice` alone overwrites mixed slot prices** → Accepted until step 02 removes the event-level Credits field. After step 02 the admin will post `occurrenceCreditPrices` on every datetime edit.
- **[Trade-off] Clone without credits flattens to `source.creditPrice`** → Accepted; step 02 clone rows will send the parallel array.
- **[Trade-off] Booking still charges denormalized `credit_price`** → Required for mergeability; step 04 switches charging to the chosen slot.
- **[Trade-off] Optional schema-overview draft** → Step 05 owns the canonical doc sweep; mention the new column in the PR if drafted here.

## Migration Plan

1. Add the Drizzle column + checks; generate and apply the migration; backfill via `array_fill(credit_price, ARRAY[cardinality(date_times)])`.
2. Add occurrence types/helpers in `datetime.ts`; extend catalog inputs; wire create/update/clone; add error codes.
3. Leave seed call sites on `dateTimes` + `creditPrice` unless a seed would violate NOT NULL (backfill should make existing rows valid).
4. Add unit tests in `datetime.test.ts` and a multi-price create/update in `catalog.integration.test.ts`.
5. Run `bun run lint`, `bun run typecheck`, and the listed `@unveiled/db` tests.
6. Rollback: reverse the additive column before dependents write mixed prices; after deploy, forward-fix or restore from backup. Do not drop `credit_price`.

## Open Questions

- None blocking. Canonical `docs/product/database/schema-overview.md` and Gherkin updates wait for step 05 unless a one-line schema note is cheaper to include in this PR.
