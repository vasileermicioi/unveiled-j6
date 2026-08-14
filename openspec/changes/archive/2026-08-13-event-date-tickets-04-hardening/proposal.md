## Why

Steps 01–03 shipped Date & tickets behavior (Timing mode first, All day hides clocks, Shared vs Per date, per-row capacity, live totals, voucher mismatch reject), but Gherkin, Playwright, Ladle, and canonical `docs/product/` still describe a SECRET_CODE-only capacity field and “no separate capacity field” for vouchers. This is step 04 of 04 for parent feature `event-date-tickets` — it closes the feature so shipped UI is the documented SoT.

## What Changes

- Add/update Gherkin in `docs/product/features/admin-events.feature` with locked Playwright titles: field order; All day hides times; Time slot shows times; Shared vs Per date; per-row persist 4 and 6; range rebuild stamps default capacity; totals; voucher mismatch reject. Keep `Total credits shown on the form`. Keep `Update an event's capacity` (`remaining = max(0, newTotal − sold)` where `newTotal` is the shared value or the sum of per-date capacities).
- Rewrite voucher scenarios so they no longer say “there is no separate capacity field”. Capacity allocation stays visible; submit succeeds only when datetime-capacity total equals inventory count.
- Extend `Default values on creation` to include `capacityMode` `SHARED` (still `totalCapacity` 10, `ticketType` `SECRET_CODE`, `timingMode` `TIME_SLOT`).
- Playwright in `e2e/specs/admin-events.spec.ts` plus fixtures: `goToEventFormStep(2)` / Next before filling Date & tickets; R2 skip when create needs an image; proximity/layout selectors only; titles match Gherkin verbatim.
- Coverage-matrix rows for the new/updated titles.
- Canonical docs: `schema-overview.md` (`capacity_mode`, `occurrence_capacities`; booking remaining still event-level; drop inventory-derived capacity); `ui-component-map.md` Events row (order, All day, per-row capacity, totals); `gaps-and-decisions.md` (event-scoped remaining vs authored per-date capacities; capacity visible for voucher types).
- Confirm `openspec/specs/event-catalog/spec.md` already carries 01–03 deltas; add this step’s Gherkin-facing requirement titles so main specs match product SoT.
- Ladle: one story (or args) covering Time slot vs All day and Shared vs Per date + totals danger if cheap to extend.
- Out of scope: partner portal; new wizard steps; turning clone into a 3-step wizard; Phase 6+ billing/email; booking per-slot remaining.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Canonical admin-events Gherkin SHALL include Date & tickets field-order, All day / Time slot, Shared vs Per date, per-row persist, range-rebuild stamp, totals, and voucher mismatch titles. Playwright SHALL use those titles verbatim. Voucher create SHALL keep capacity allocation visible and reject submit until inventory count equals datetime-capacity total. Default create SHALL include `capacityMode` `SHARED`. Product docs SHALL describe `capacity_mode` / `occurrence_capacities` and event-scoped booking remaining.

## Impact

- **E2E:** `e2e/fixtures/admin.ts` (`createEventViaUI`, labels for Timing mode / Capacity allocation / All day / Per date / totals); `e2e/specs/admin-events.spec.ts` (new scenarios + voucher/default/capacity fillers already on step 2).
- **Docs (canonical SoT):** `docs/product/features/admin-events.feature`, `docs/product/testing/coverage-matrix.md`, `docs/product/database/schema-overview.md`, `docs/product/ui/ui-component-map.md`, `docs/product/extras/gaps-and-decisions.md`.
- **OpenSpec main spec:** `openspec/specs/event-catalog/spec.md` — Gherkin-facing titles aligned with this delta (01–03 persist/UI requirements already present).
- **Stories:** `apps/web/app/components/admin/EventAdminForm.stories.tsx` (and `EventAdminBaseFields.stories.tsx` only if cheaper).
- **Runtime UI:** no intended product-behavior change; 01–03 already shipped. Fix a11y names only if a scenario cannot be asserted with proximity selectors.
- **Source brief:** `.dev-plan/current-iteration/event-date-tickets-04-hardening.md`
- **Parent:** `.dev-plan/current-iteration/event-date-tickets-parent-guide.md`
- **Depends on:** `event-date-tickets-01-schema-and-domain`, `event-date-tickets-02-time-mode-and-field-order`, `event-date-tickets-03-capacity-ui-and-totals`
- **Consumed by:** closes the Event Date & tickets feature
- **Verification:** `bun run lint`; `bun run typecheck`; targeted `bun run test:e2e` for `e2e/specs/admin-events.spec.ts` (R2 skip documented)
