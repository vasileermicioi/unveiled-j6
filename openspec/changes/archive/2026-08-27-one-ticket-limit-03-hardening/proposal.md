## Why

Steps 01–02 already enforce one ticket per occurrence (`ALREADY_BOOKED` + unique index) and show the locked already-booked copy on event detail and `/events/:id/book`, but canonical Gherkin, Playwright titles, and product docs still describe multi-qty checkout (guest cap of 3, “increase tickets”, credits × qty). Until `docs/product/` and e2e match production, CI proves the old contract and the parent feature cannot close.

## What Changes

- Rewrite `docs/product/features/booking.feature`: drop “select greater than 3” / credits×qty backgrounds; successful booking is one ticket; add already-booked scenarios with step-02 titles; keep the multi-ticket **display** scenario for grandfathered `booking_tickets` (seed/DB fixture, not a UI qty control).
- Update `event-discovery.feature` checkout scenarios: no quantity stepper; credit total for one ticket; already-booked hour lives in `booking.feature` (detail is the same checkout card).
- Update `waitlist.feature` join/promotion wording to qty 1 (no “requested ticket count” picker). Join stays event-level.
- Playwright: rename/replace tests so titles match new Gherkin verbatim. Remove `increase tickets` / `Anzahl Tickets` assertions. Add already-booked coverage (single-slot reopen on detail + book; multi-hour booked vs other hour still books). Selectors: `getByRole` / `getByText` / `getByLabel` only.
- Canonical docs: `database/schema-overview.md` (`tickets_count = 1` on new writes, partial unique index); `extras/content-i18n-inventory.md` (already-booked strings); `sitemap/sitemap.md` (book route note); `ui/ui-component-map.md`; `extras/gaps-and-decisions.md`; coverage-matrix rows.
- Delete unused `apps/web/app/islands/TicketCountSelect.tsx` if nothing imports it; drop dead `?qty=` query plumbing from book/detail. Keep `maxQty` as the 0|1 bookability signal from `maxBookableTickets` if still used.
- This change’s deltas plus apply updates to `docs/product/` are the contract. Prefer `docs/product/` as SoT; `openspec/specs/` is a planning mirror (archive merges deltas).
- Mark step 03 done and the parent feature releasable.
- Out of scope: new booking product behavior; partner portal; changing credit-capacity math beyond the one-ticket rule already shipped; rewriting historical `tickets_count > 1` rows; per-hour waitlists.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `booking`: Product Gherkin, Playwright, schema overview, i18n inventory, sitemap, UI map, gaps log, and coverage matrix SHALL describe one ticket per occurrence, `ALREADY_BOOKED` rejection, and the already-booked checkout message + My Tickets link. They SHALL NOT require a ticket-quantity control or allow selecting more than one ticket on member checkout. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim.
- `event-discovery`: `event-discovery.feature` and `e2e/specs/event-discovery.spec.ts` SHALL assert the credit total for one ticket and MUST NOT require an “increase tickets” control. Already-booked hour coverage belongs in booking e2e (same checkout card).
- `waitlist`: `waitlist.feature` SHALL describe join with `requested_qty = 1` and no ticket-count picker. Promotion books one ticket. Existing waitlist e2e titles stay unless a `Scenario:` line changes.

## Impact

- **Product SoT:** `docs/product/features/{booking,event-discovery,waitlist}.feature`, `docs/product/database/schema-overview.md`, `docs/product/extras/{content-i18n-inventory,gaps-and-decisions}.md`, `docs/product/sitemap/sitemap.md`, `docs/product/ui/ui-component-map.md`, `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/booking.spec.ts` (retitle qty test; add already-booked; fix `confirmBooking` helper that still asserts `Anzahl Tickets` / `?qty=`), `e2e/specs/event-discovery.spec.ts` (drop increase-tickets assertions; retitle eligible-checkout if Gherkin title changes), `e2e/specs/waitlist.spec.ts` only if a Scenario title changes.
- **Dead UI:** `apps/web/app/islands/TicketCountSelect.tsx`; book/detail `?qty=` parse if unused. `maxQty` on checkout occurrences MAY remain as 0|1 bookability.
- **Runtime:** no intended booking-domain change. Steps 01–02 already unique-index, qty=1 writes, and already-booked chrome.
- **Planning mirror:** `openspec/specs/{booking,event-discovery,waitlist}` via this change’s deltas (not product SoT).
- **Parent close-out:** `.dev-plan/current-iteration/one-ticket-limit-parent-guide.md` mark `one-ticket-limit-03-hardening` done; walk Release Criteria.
- **Source brief:** `.dev-plan/current-iteration/one-ticket-limit-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`
- **Depends on:** `one-ticket-limit-02-already-booked-ui` (done / archived)
- **Consumed by:** closes the one-ticket-limit parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/db && bun test src/booking`; Playwright booking + event-discovery specs; grep product Gherkin and e2e for leftover “increase tickets” / guest cap of 3
