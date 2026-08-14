## Context

Parent feature: Date & tickets capacity allocation (`.dev-plan/current-iteration/event-date-tickets-parent-guide.md`), step 01 — schema + catalog domain only.

Current state:

- `events.date_times timestamptz[] NOT NULL` with check `cardinality >= 1`; parallel `occurrence_credit_prices integer[]`; denormalized `date_time` / `credit_price`.
- `events.total_capacity` and `events.remaining_capacity` are event-level only. Booking and waitlist already use those columns.
- `CreateEventInput` / `UpdateEventInput` take optional `totalCapacity` (create defaults to 10 via `applyEventDefaults`). `CloneEventInput` copies `source.totalCapacity` and sets `remaining_capacity` equal to that total.
- Occurrence normalize lives in `packages/db/src/catalog/datetime.ts` (`EventOccurrence = { startsAt, creditPrice }`, `tryNormalizeEventOccurrences`, `tryNormalizePairedDateTimesAndCredits`, `tryFillOccurrenceCreditsFromPrice`). Duplicate instants are rejected on the paired path; the legacy single-price path unique-sorts.
- Migration `0019_exotic_madame_web.sql` is the template: nullable column → `array_fill` backfill → NOT NULL → cardinality + `0 <= ALL (...)` checks.
- Latest migration in tree is `0023_young_captain_midlands.sql`.

Product locks for this feature: parallel integer array (no `event_occurrences` table); `SHARED` stored array always matches `date_times` length and is filled with `total_capacity` so switching to Per date on edit pre-fills rows; `PER_OCCURRENCE` derives `total_capacity` as the sum; booking remaining stays event-scoped. Admin form, field order, live totals, and voucher mismatch are later steps.

Constraints: business logic in `@unveiled/db`; Drizzle `public` schema only; Europe/Berlin unchanged; injectable `now?: Date` on write helpers; do not model `neon_auth`.

## Goals / Non-Goals

**Goals:**

- Persist `capacity_mode` (`SHARED` | `PER_OCCURRENCE`, NOT NULL, default `SHARED`) and `occurrence_capacities integer[]` with the same cardinality as `date_times`; backfill from `total_capacity`; DB checks for equal cardinality and every element `>= 0`.
- Domain helper pairs `{ startsAt, creditPrice, capacity }`, sorts by instant, rejects empty, duplicate instants, negative credits, and negative capacities.
- When capacities are omitted, fill every element from `totalCapacity` (create default 10) and treat the event as `SHARED`.
- `PER_OCCURRENCE`: `total_capacity = sum(occurrence_capacities)` and that sum MUST be `>= 1`. `SHARED`: caller’s `totalCapacity` is the event total; rewrite the array to that value.
- Create/update/clone persist mode + both parallel arrays. Update recalculates `remaining_capacity` when the **derived** total changes (not only when `input.totalCapacity` is posted). Clone copies mode + array and sets remaining equal to total.
- Export `CapacityMode` from `@unveiled/db`. Tests cover two capacities, SHARED fill, PER_OCCURRENCE sum, clone copy, and existing `totalCapacity`-only callers.

**Non-Goals:**

- Admin create/edit/clone form, Timing mode field order, all-day hiding clocks, range builder (steps 02–03).
- Live totals, mismatch danger, `CAPACITY_INVENTORY_MISMATCH` (step 03).
- Per-occurrence `remaining_capacity` or booking/waitlist enforcement per datetime.
- Canonical Gherkin / schema-overview sweep / e2e / Ladle (step 04). A one-line schema-overview draft is optional here.
- Changing default `total_capacity` 10, ticket type, or Timing mode defaults.

## Decisions

1. **Parallel arrays + enum, not a child table (parent lock)**
   - **Choice:** Add `capacityModeEnum = pgEnum("capacity_mode", ["SHARED", "PER_OCCURRENCE"])` and columns `capacityMode: capacityModeEnum("capacity_mode").notNull().default("SHARED")` plus `occurrenceCapacities: integer("occurrence_capacities").array().notNull()`. Checks: `cardinality(date_times) = cardinality(occurrence_capacities)` and `0 <= ALL (occurrence_capacities)`. Keep `total_capacity` / `remaining_capacity` as event-level columns. Export `CapacityMode` next to `TimingMode` / `TicketType` (`export * from "./schema"` already re-exports).
   - **Rationale:** Matches locked storage and the `occurrence_credit_prices` pattern; booking stays on existing remaining; smallest blast radius for seeds and callers that only pass `totalCapacity`.
   - **Alternatives:** `event_occurrences` table (rejected in parent / prior datetime-credits work); JSONB list (weaker checks, worse typing); storing capacities only when `PER_OCCURRENCE` (breaks the SHARED pre-fill lock).

2. **SHARED always rewrites the array; skip `SHARED_CAPACITY_MISMATCH`**
   - **Choice:** In `SHARED` (including omitted mode), ignore any posted `occurrenceCapacities` values and fill `dateTimes.map(() => totalCapacity)`. Do **not** add `SHARED_CAPACITY_MISMATCH`. `PER_OCCURRENCE` requires a capacities array of equal length; omitted capacities with explicit `PER_OCCURRENCE` is `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`.
   - **Rationale:** Step plan marks `SHARED_CAPACITY_MISMATCH` optional if the server always rewrites. One write path; switching to Per date on edit later reads a full pre-filled array.
   - **Alternatives:** Reject SHARED posts whose array is not uniform (extra error, no product value this step); persist caller arrays in SHARED (violates the fill lock).

3. **Extend the existing occurrence normalize; keep datetime.ts free of catalog errors**
   - **Choice:** `EventOccurrence = { startsAt: Date; creditPrice: number; capacity?: number }`. `NormalizedEventOccurrences` always includes `occurrenceCapacities: number[]` after this step (filled by the write resolver when omitted). Add failure code `NEGATIVE_CAPACITY` (and reuse `LENGTH_MISMATCH` for a capacities array whose length ≠ `dateTimes`, mapped to `OCCURRENCE_CAPACITY_LENGTH_MISMATCH` in `throwFromNormalize`).
     - **Paired path:** `occurrences[]` or `dateTimes` + `occurrenceCreditPrices` + `occurrenceCapacities` of equal length: pair by index, sort by `startsAt`, reject empty / duplicate instants / `creditPrice < 0` / `capacity < 0` or non-integer. Capacities follow their instant (same as credits).
     - **Legacy capacity fill:** after dates/credits are normalized (existing paired or single-price helpers), `occurrenceCapacities = dateTimes.map(() => totalCapacity)` and `capacityMode = "SHARED"`.
     - Mixed “some rows have `capacity`, some omit it” is `LENGTH_MISMATCH`.
   - **Rationale:** Credits already own the paired vs legacy split; capacities piggy-back so we do not silently unique-merge when per-date values can differ. `futureOccurrences` can keep omitting `capacity` (booking does not need it this step).
   - **Alternatives:** Require `capacity` on every `EventOccurrence` (breaks `futureOccurrences` / checkout zip); a third normalize helper with a different sort (divergence).

4. **Write-helper API on create/update/clone**
   - **Choice:** Optional `capacityMode?: CapacityMode` and `occurrenceCapacities?: number[]` on `CreateEventInput` / `UpdateEventInput` / `CloneEventInput`. Resolve mode + total + array in one catalog helper used by all three writes (after occurrence datetime/credit normalize):

     | Input | Behavior |
     |---|---|
     | `capacityMode` omitted, capacities omitted | `SHARED`; fill from `totalCapacity` (create: `applyEventDefaults` → 10; update: `input.totalCapacity ?? existing.totalCapacity`; clone: `source.totalCapacity`). |
     | `SHARED` (explicit or implied) | Fill array from that total; persist `capacity_mode = SHARED`; `total_capacity` is the caller/existing total (not the sum). |
     | `PER_OCCURRENCE` + `occurrenceCapacities` | Pair with the date list used for credits (create/clone required `dateTimes`; update uses existing when omitted). `total_capacity = sum(capacities)` after sort; reject if sum `< 1` (`REQUIRED_FIELD`). |
     | `PER_OCCURRENCE` + capacities omitted | `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`. |
     | Update: neither mode, capacities, nor `totalCapacity` | Leave stored mode, array, and totals; still refresh remaining only if a later branch changes total. |
     | Update: `totalCapacity` alone, mode stays `SHARED` | Fill all stored slots with the new total; `recalculateRemainingCapacity`. |
     | Update: `totalCapacity` alone, mode stays `PER_OCCURRENCE` | Do **not** flatten mixed per-date capacities. Ignore the posted total for persistence; keep stored array; derived total stays the sum. (Step 03 will post the full array on every datetime edit.) |

   - After resolve: persist `capacity_mode`, `occurrence_capacities`, `total_capacity`; set `remaining_capacity` on create/clone to `total_capacity`; on update call `recalculateRemainingCapacity(existing.totalCapacity, existing.remainingCapacity, nextTotalCapacity)` when `nextTotalCapacity !== existing.totalCapacity` (covers PER_OCCURRENCE sum changes when `input.totalCapacity` was omitted).
   - **Clone:** `dateTimes` stays required. Copy `capacityMode` from `input.capacityMode ?? source.capacityMode`. If `input.occurrenceCapacities` is set, paired path. If omitted and mode is `SHARED`, fill from `source.totalCapacity` for the clone date list length. If omitted and mode is `PER_OCCURRENCE`, pass `source.occurrenceCapacities` into create (same-length copy; different clone date count → `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`). Do not instant-match capacities. `remaining_capacity = total_capacity`.
   - **Rationale:** One write path; current callers typecheck without UI changes; clone tests that use a single datetime keep working.
   - **Alternatives:** Always require `occurrences: EventOccurrence[]` (breaks every call site); remap clone capacities by instant (not needed until the clone form posts rows); flatten PER_OCCURRENCE on `totalCapacity`-only update (loses per-date values before step 03 exists).

5. **CatalogValidationError codes**
   - **Choice:** Add `NEGATIVE_CAPACITY` and `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`. Keep existing `EMPTY_DATE_TIMES`, `DUPLICATE_OCCURRENCE_INSTANTS`, `OCCURRENCE_LENGTH_MISMATCH` (credits), `NEGATIVE_CREDIT_PRICE`. Map datetime `NEGATIVE_CAPACITY` / capacity `LENGTH_MISMATCH` in `throwFromNormalize`. PER_OCCURRENCE sum `< 1` uses `REQUIRED_FIELD` (no extra code). Do not add `SHARED_CAPACITY_MISMATCH`.
   - **Rationale:** Matches the listed step-plan codes; distinct from credit length mismatch so tests and later form errors can tell the arrays apart.
   - **Alternatives:** Reuse `OCCURRENCE_LENGTH_MISMATCH` for capacities (opaque); collapse negatives into `REQUIRED_FIELD`.

6. **`applyEventDefaults`**
   - **Choice:** Default `capacityMode` to `"SHARED"` when omitted. Keep `totalCapacity: input.totalCapacity ?? 10`. Do not default `PER_OCCURRENCE`.
   - **Rationale:** Backfill and seeds match SHARED; parent lock does not change the capacity default of 10.
   - **Alternatives:** Infer PER_OCCURRENCE whenever a capacities array is present (would surprise SHARED callers that accidentally pass an array — we ignore that array in SHARED anyway).

7. **Drizzle migration shape**
   - **Choice:** Create enum `capacity_mode`; add `capacity_mode` NOT NULL DEFAULT `'SHARED'`; add nullable `occurrence_capacities integer[]`; `UPDATE events SET occurrence_capacities = array_fill(total_capacity, ARRAY[cardinality(date_times)])`; set NOT NULL; add the two checks. Generate via `bun run db:generate` then apply `bun run db:migrate`. Do not rewrite historical bookings or ledger rows.
   - **Rationale:** Same sequence as `0019` for credits; `total_capacity` is already NOT NULL; existing `date_times` cardinality check guarantees a non-empty dimension.
   - **Alternatives:** `array_agg` from `generate_series` (equivalent, more verbose).

## Risks / Trade-offs

- **[Risk] Update `totalCapacity` alone on a PER_OCCURRENCE event would flatten rows if we reused the SHARED fill** → Mitigation: only SHARED (or omitted mode with omitted capacities) fills from total; PER_OCCURRENCE `totalCapacity`-only updates keep the stored array and derived sum.
- **[Risk] Remaining capacity stale when PER_OCCURRENCE sum changes without posting `totalCapacity`** → Mitigation: recalculate when **derived** `nextTotalCapacity !== existing.totalCapacity`, not only when `input.totalCapacity !== undefined`.
- **[Risk] Clone PER_OCCURRENCE with a different datetime count and no posted array** → Mitigation: reject length mismatch; step 03 clone form will post `occurrenceCapacities`. SHARED clones of any date count still fill from `source.totalCapacity`.
- **[Trade-off] Booking still uses event-level `remaining_capacity`** → Required for mergeability and parent non-goal; do not add per-slot remaining.
- **[Trade-off] Optional schema-overview draft** → Step 04 owns the canonical doc sweep; mention the new columns in the PR if drafted here.
- **[Trade-off] `EventOccurrence.capacity` is optional** → Keeps `futureOccurrences` compiling; write resolver always persists a filled `occurrence_capacities` array.

## Migration Plan

1. Add the Drizzle enum + columns + checks; generate and apply the migration; backfill via `array_fill(total_capacity, ARRAY[cardinality(date_times)])` with `capacity_mode = SHARED`.
2. Extend occurrence types/helpers in `datetime.ts`; extend catalog inputs + `applyEventDefaults`; wire create/update/clone; add error codes.
3. Leave seed call sites on `totalCapacity` only (SHARED fill).
4. Add unit tests in `datetime.test.ts` and create/update/clone integration coverage (two capacities, SHARED fill `{12,12}`, PER_OCCURRENCE sum 4+6=10, clone copies mode + array).
5. Run `bun run lint`, `bun run typecheck`, and the listed `@unveiled/db` tests.
6. Rollback: reverse the additive enum/columns before dependents write `PER_OCCURRENCE`; after deploy, forward-fix or restore from backup. Do not drop `total_capacity` / `remaining_capacity`.

## Open Questions

- None blocking. Canonical `docs/product/database/schema-overview.md` and Gherkin updates wait for step 04 unless a one-line schema note is cheaper to include in this PR.
