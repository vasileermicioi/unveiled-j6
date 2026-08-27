## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/one-ticket-limit-03-hardening.md`, parent guide Release Criteria / non-goals / locked copy, and this change’s proposal/design/specs
- [x] 1.2 Confirm steps 01–02 are done: unique index + `ALREADY_BOOKED`, already-booked copy in `booking-content.ts`, detail overlay + book `view="already_booked"`, unused `TicketCountSelect.tsx`
- [x] 1.3 Skim `docs/product/testing/bdd-and-e2e.md` (verbatim `Scenario:` titles; `getByRole` / `getByText` / `getByLabel` only; no `data-testid`)

## 2. Gherkin

- [x] 2.1 Rewrite `docs/product/features/booking.feature`: Background = one ticket (no min(floor…) selectable count, no “not limited by hard max of 3”); replace `Member ticket quantity follows credits and capacity` with `Member cannot select more than one ticket`; add `Reopening a booked single-slot event` and `Booked hour on a multi-hour event`; Successful booking / priced slot / sold-out / insufficient credits / voucher = qty 1; keep `Multi-ticket promo codes are listed separately` for grandfathered `booking_tickets`
- [x] 2.2 Update `docs/product/features/event-discovery.feature`: rename eligible-checkout to `Booking-eligible member sees credits and date on event detail` (credit total for one ticket, no quantity stepper); `Dropdown changes credits` Then = 4 credits for one ticket; do not duplicate already-booked scenarios here
- [x] 2.3 Update `docs/product/features/waitlist.feature`: Background remaining capacity 0; Join has no requested-qty picker (`requested_qty = 1`); promotion books one ticket; keep existing `Scenario:` titles

## 3. Playwright

- [x] 3.1 Fix `confirmBooking` in `e2e/specs/booking.spec.ts`: drop `?qty=` and `getByLabel(/anzahl tickets|ticket count/i)`; confirm via confirm-booking button → `/book/confirm`
- [x] 3.2 Retitle qty test to `Scenario: Member cannot select more than one ticket`; assert no increase-tickets button and no ticket-count label; credit total = one slot price
- [x] 3.3 Add `Scenario: Reopening a booked single-slot event` (book once, reopen detail **and** book; locked copy via `locale`; My Tickets link to `/:locale/bookings`; no confirm/book CTA)
- [x] 3.4 Add `Scenario: Booked hour on a multi-hour event` (`createPricedSlotEvent`; morning booked → already-booked; evening select → book one ticket)
- [x] 3.5 Update `e2e/specs/event-discovery.spec.ts`: retitle eligible-checkout; drop all `increase tickets` / `ticket mehr` locators (guest absence → `getByLabel(/anzahl tickets|ticket count/i)` count 0); dropdown total is 4 credits for one ticket
- [x] 3.6 Leave `e2e/specs/waitlist.spec.ts` titles unchanged unless a Gherkin `Scenario:` line changed

## 4. Canonical docs and coverage matrix

- [x] 4.1 `docs/product/database/schema-overview.md`: `tickets_count` = 1 on new writes (grandfathered `> 1` allowed); add partial unique index `bookings (user_id, event_id, date_time)` WHERE `status IN ('CONFIRMED', 'USED')`
- [x] 4.2 `docs/product/extras/content-i18n-inventory.md`: Booking checkout — already booked section with verbatim DE/EN message + `Meine Tickets` / `My Tickets`; cite `apps/web/app/lib/booking-content.ts`
- [x] 4.3 `docs/product/sitemap/sitemap.md`: `/events/:id/book` = one ticket; already-booked message + My Tickets when the selected hour is held
- [x] 4.4 `docs/product/ui/ui-component-map.md` Event detail: datetime select when ≥2 future slots, one-ticket credit total, book CTA **or** already-booked overlay; no qty stepper
- [x] 4.5 `docs/product/extras/gaps-and-decisions.md`: replace the member qty / no-hard-max-of-3 row with one ticket per occurrence + already-booked copy
- [x] 4.6 `docs/product/testing/coverage-matrix.md`: add/replace rows for `Member cannot select more than one ticket`, `Reopening a booked single-slot event`, `Booked hour on a multi-hour event`, and retitled discovery eligible-checkout (`pass` + `DATABASE_URL`; never `@skip-no-ui`)

## 5. Dead qty UI

- [x] 5.1 Delete `apps/web/app/islands/TicketCountSelect.tsx` if still unimported; drop `parseQtyParam` / `?qty=` from book (and detail if unused); update auth-redirect tests that keep `?qty=1`
- [x] 5.2 Drop `clampQty` if only used for the stepper; keep `maxQty` as 0|1 bookability from `maxBookableTickets`

## 6. Cleanup and parent close-out

- [x] 6.1 Grep `docs/product/features/{booking,event-discovery,waitlist}.feature` and `e2e/specs/{booking,event-discovery}.spec.ts` for leftover “increase tickets”, “Anzahl Tickets” qty select, and guest cap of 3
- [x] 6.2 Mark `one-ticket-limit-03-hardening` done in `.dev-plan/current-iteration/one-ticket-limit-parent-guide.md` and walk parent **Release Criteria** (feature released). Canonical SoT is `docs/product/`; do not treat `openspec/specs/` as product behavior; no new AGENTS.md rule

## 7. Verification

- [x] 7.1 Run `bun run lint` — exits 0
- [x] 7.2 Run `bun run typecheck` — exits 0
- [x] 7.3 Run `cd packages/db && bun test src/booking` — exits 0 (integration skips without `DATABASE_URL`)
- [x] 7.4 Playwright (needs `DATABASE_URL` + usual e2e env): `bun run test:e2e -- e2e/specs/booking.spec.ts e2e/specs/event-discovery.spec.ts` — already-booked scenarios pass; old qty>3 scenario is gone or retitled
- [x] 7.5 Prepare PR/handoff linking this change ID and the parent guide
