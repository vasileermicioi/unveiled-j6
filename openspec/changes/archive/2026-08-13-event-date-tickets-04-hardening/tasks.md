## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-date-tickets-04-hardening.md`, parent guide release criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm 01–03 are on create/edit/clone: Timing mode first, All day hides clocks, Capacity allocation + capacity for every ticket type, per-row capacity in Per date, totals + mismatch reject. Confirm Ladle `EventAdminForm / Date & tickets time slot` and `Date & tickets all day`. Confirm `createVoucherPromoViaUI` still pastes 2 codes against default capacity 10 (will reject after 03 — fix in 2.3)

## 2. E2E labels and existing fillers

- [x] 2.1 Add `adminLabels` keys per design.md decision 2 (`timingMode`, `timingModeTimeSlot`, `timingModeAllDay`, `capacityAllocation`, `capacityAllocationShared`, `capacityAllocationPerDate`, `rowCapacity`, `totalCredits`, `totalCapacityLine`, `totalInventory`, `capacityInventoryMismatch`, `pasteCodes`)
- [x] 2.2 Keep `adminLabels.capacity` as event-level `"Kapazität*"`. Per-row capacity uses `rowCapacity` (`Kapazität` / `Capacity` without `*`). Do not add `data-testid` or CSS-class selectors
- [x] 2.3 Fix `createVoucherPromoViaUI` so pasted code count equals datetime-capacity total (set capacity to `"2"` or paste 10 codes) so clone-voucher e2e stays green. Callers that fill Date & tickets already Next / `goToEventFormStep(2)`

## 3. Gherkin

- [x] 3.1 Add exact `Scenario:` titles to `docs/product/features/admin-events.feature`: `Timing mode is first on Date & tickets`, `All day hides time inputs`, `Time slot shows times`, `Shared capacity is one pool`, `Per-date capacities persist`, `Range rebuild stamps default capacity`, `Capacity and inventory totals mismatch`. Keep `Total credits shown on the form` and `Update an event's capacity`
- [x] 3.2 Rewrite voucher scenarios (`Admin uploads promo codes with preview`, PDF split, PDF multi-file): drop “there is no separate capacity field”; require datetime-capacity total to equal inventory count. Extend `Default values on creation` with `capacityMode` `"SHARED"`

## 4. Playwright

- [x] 4.1 Add `test("Scenario: …")` verbatim for the seven new titles in `e2e/specs/admin-events.spec.ts`. Proximity/layout selectors only (`getByRole` / `getByLabel` / `boundingBox` for field order). R2 skip when create/source needs an image
- [x] 4.2 Field order: after `expectEventFormStep(2)`, Timing mode above Capacity allocation, ticket type, and datetime list. All day: time inputs count 0, dates remain. Time slot: time inputs visible
- [x] 4.3 Shared: two datetimes, no `rowCapacity` inputs, persisted total 10. Per date: rows 4 and 6 persist in datetime order, capacity total 10. Range rebuild: Per date capacity 8 stamps generated rows
- [x] 4.4 Mismatch: VOUCHER_PROMO capacity 10 vs 7 pasted codes; assert totals text and reject copy (no CSS color / `.admin-form__total--mismatch`). Promo preview: paste N codes, capacity N, create succeeds. Extend `Default values on creation` to assert Shared + Time slot + capacity 10 on step 2 (keep list `10/10`)

## 5. Canonical docs, OpenSpec sync, and stories

- [x] 5.1 Update `docs/product/ui/ui-component-map.md` Events row: Date & tickets order, All day hides times, per-row capacity when Per date, totals + voucher mismatch
- [x] 5.2 Replace `schema-overview.md` voucher “admin does not set capacity separately” with authored allocation + mismatch reject; keep `capacity_mode` / `occurrence_capacities` and event-level booking remaining
- [x] 5.3 Update `gaps-and-decisions.md`: authored per-date capacities vs event-scoped remaining; voucher capacity visible and must match inventory
- [x] 5.4 Add `coverage-matrix.md` rows for the new titles (pass or explicit R2/env skip). PDF split/multi-file: skip/deferred note unless a cheap private-bucket helper already exists. That satisfies `Coverage lists Date & tickets scenarios` — no extra Playwright test
- [x] 5.5 Merge this change’s ADDED requirements into `openspec/specs/event-catalog/spec.md` (01–03 persist/UI already present; add BDD + voucher-visible-capacity + defaults). Confirm no duplicate persist scenarios
- [x] 5.6 Add Ladle `EventAdminForm / Date & tickets per date` if `defaults.capacityMode = "PER_OCCURRENCE"` is cheap. Do not duplicate Time slot / All day. Skip a mismatch story unless inventory totals can be fed without voucher islands. No raw HTML

## 6. Verification and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.2 Run targeted `bun run test:e2e` for `e2e/specs/admin-events.spec.ts`. New scenario titles pass; existing admin-events scenarios still pass (including clone voucher after 2.3); image specs still R2-skip when unconfigured. Playwright titles match Gherkin verbatim
- [x] 6.3 Mark step 04 done and the feature released in `.dev-plan/current-iteration/event-date-tickets-parent-guide.md`. Confirm canonical product specs match shipped behavior. No new AGENTS.md convention
