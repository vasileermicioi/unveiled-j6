## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-date-tickets-03-capacity-ui-and-totals.md`, parent guide (locked copy, field order after 03, voucher mismatch decision), and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm 01 columns/APIs (`CapacityMode`, `occurrenceCapacities` on create/update/clone) and 02 field order (Timing mode first, All day hides clocks, list last). Confirm create/edit share `EventAdminForm`; clone uses `CloneEventForm`

## 2. Copy and error code

- [x] 2.1 Add locked DE/EN keys in `apps/web/app/lib/admin-content.ts`: `capacityAllocationLabel` / `Shared` / `PerDate` + hints; `dateTimesTotalCapacityLabel`; `dateTimesTotalInventoryLabel`; `CAPACITY_INVENTORY_MISMATCH` copy. Reuse `capacityLabel` for event-level and per-row. Stop using `capacityFromInventoryHint`
- [x] 2.2 Add `CAPACITY_INVENTORY_MISMATCH` to `CatalogErrorCode` in `packages/db/src/catalog/errors.ts` and map it in `mapCatalogErrorCode`

## 3. Parser, defaults, and catalog input

- [x] 3.1 Extend `EventDateTimeRow` with `capacity: string`. Parse `capacity_mode` (default `SHARED`) and `event_capacity_${index}`. `EventFormValues.capacityMode`. SHARED omits `occurrenceCapacities` on catalog input; PER_OCCURRENCE sets `occurrenceCapacities` from row integers (`>= 0`) and lets catalog derive `total_capacity`
- [x] 3.2 `toCreateEventInput` / `toUpdateEventInput` pass `capacityMode` + arrays. `eventToFormDefaults` / `formValuesToDefaults` / `eventDateTimesToFormRows` load `capacityMode`, `totalCapacity`, and per-row capacities from stored columns (SHARED still loads the filled array so Per date pre-fills)
- [x] 3.3 Add `NEGATIVE_CAPACITY`, `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`, and `CAPACITY_INVENTORY_MISMATCH` to `SCHEDULE_CATALOG_CODES` so `eventFormErrorStep` returns 2. Add capacity field names to `SCHEDULE_REQUIRED_FIELDS` if catalog messages use them

## 4. Voucher mismatch (no overlay)

- [x] 4.1 Add `datetimeCapacityTotal` and `assertCapacityMatchesInventory` in `admin-voucher-inventory.ts` (SECRET_CODE no-op; empty voucher defers to `assertVoucherInventoryPresent`; derived count ≠ capacity total throws `CAPACITY_INVENTORY_MISMATCH`). Export `voucherInventoryDisplayCount` with the same append/replace-unused rules as `resolveVoucherDerivedCapacity`
- [x] 4.2 Remove `withVoucherCapacityFromInventory` from create/edit (and clone if present). Call `assertCapacityMatchesInventory` after inventory-present, before catalog write. Keep `assertVoucherInventoryPresent`

## 5. Date & tickets UI

- [x] 5.1 After Timing mode in `EventAdminBaseFields` step 2: native Capacity allocation select + controlled native capacity number (all ticket types, min 1, default 10). Hold `capacityMode` / `totalCapacity` state; pass into the list. Remove SECRET_CODE-only gating. Native `AdminFormSelect` / `input type="number"` only
- [x] 5.2 In `EventAdminDateTimeList`: PER_OCCURRENCE shows per-row native `event_capacity_*` (label Capacity / Kapazität); SHARED hides them. `addRow` and range rebuild stamp `defaultOccurrenceCapacity`; changing the default does not rewrite existing rows. No per-slot capacity. ALL_DAY still credits-only on the first slot
- [x] 5.3 Lift incoming count + `replaceUnused` from promo/PDF inventory fields via `onInventoryPreviewChange`. Render credits, datetime-capacity, and (voucher) inventory totals below the list. Danger class `.admin-form__total--mismatch` in `globals.css` `@layer components` on the capacity and inventory lines when they disagree — not credits, no Tailwind `text-red-*`

## 6. Clone

- [x] 6.1 Extend `CloneEventFormSource` with `capacityMode` + `totalCapacity`; `sourceFromEvent` copies them including row capacities. Visible allocation select + capacity number; pass mode/default/inventory total into the list. Voucher inventory above the list so preview feeds totals (create-shaped: preview count only)
- [x] 6.2 Clone POST: honor posted `timing_mode` and `capacity_mode` (do not overwrite from source); keep ticket type source-locked; pass `capacityMode` + `occurrenceCapacities` into `cloneEvent`. Error re-render round-trips allocation + row capacities

## 7. Tests and verification

- [x] 7.1 Unit tests: SHARED vs PER_OCCURRENCE parse; rebuild stamps default capacity; mismatch helper (10 vs 7 throws; equal ok; SECRET_CODE no-op); edit/clone defaults include mode + row capacities; `eventFormErrorStep` maps mismatch to step 2
- [x] 7.2 Run `bun run lint` — exits 0
- [x] 7.3 Run `bun run typecheck` — exits 0
- [x] 7.4 Run `cd apps/web && bun test app/lib/admin-event-form.test.ts app/lib/admin-voucher-inventory.test.ts app/lib/admin-event-route-helpers.test.ts` — exits 0
- [x] 7.5 Run `bun --filter @unveiled/db test src/catalog/datetime.test.ts` — exits 0 (mismatch lives in the web helper; this file should stay green)
- [x] 7.6 Manual: SHARED hides per-row capacity; Per date shows defaults and rebuild stamp; voucher mismatch is danger + reject; SECRET_CODE has no inventory total; All day still hides times; clone posts allocation
- [x] 7.7 Mark step 03 done in `.dev-plan/current-iteration/event-date-tickets-parent-guide.md`. Do not add Gherkin/Playwright/canonical docs (step 04)
