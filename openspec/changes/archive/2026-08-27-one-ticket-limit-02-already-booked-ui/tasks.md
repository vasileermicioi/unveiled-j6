## 1. Setup

- [x] 1.1 Read the step plan, parent guide, `proposal.md`, `design.md`, and both spec deltas; confirm `listActiveBookedOccurrenceInstants` is exported from `@unveiled/db` and step 01 is marked done
- [x] 1.2 Lock approach: eligible-only booked-instant query; ISO string match; checkout-card overlay (already-booked beats waitlist for the selected hour; past still wins); book `view: "already_booked"` with no POST form; POST `ALREADY_BOOKED` uses that view; do not edit `docs/product/` Gherkin

## 2. Shared copy and slot matching

- [x] 2.1 Add verbatim DE/EN already-booked message + `Meine Tickets` / `My Tickets` label in `apps/web/app/lib/booking-content.ts` (`getAlreadyBookedCopy` or equivalent); My Tickets href is `localizedPath(locale, "bookings")`; EventDetail and BookEvent import this helper (no duplicated strings)
- [x] 2.2 Add `occurrenceIsBooked(startsAtIso, bookedOccurrenceIsos)` exact ISO match in `checkout-slot.ts`
- [x] 2.3 Unit-test copy (verbatim DE/EN + link labels) and ISO match in `apps/web` bun tests (`booking-content` test file + `checkout-slot.test.ts`)

## 3. Event detail checkout

- [x] 3.1 Event detail GET: for `viewer.kind === "eligible"` and a non-past event, call `listActiveBookedOccurrenceInstants` and pass `bookedOccurrenceIsos` (`.toISOString()`) into `EventDetailPage`; skip the query for guests / past-due / membership-required
- [x] 3.2 `EventDetailCheckoutCard`: overlay when the selected ISO is booked — hide book and waitlist CTAs, hide purchase notice + credit total, show locked message + primary My Tickets `Link` (accessible name = visible text); keep datetime `<select>` when ≥2 future occurrences so switching to an unbooked hour restores the SSR baseline CTA client-side
- [x] 3.3 Do not overlay on past chrome (`showTicketControls` false / past status). Sold-out + booked selected hour → already-booked, not waitlist

## 4. Book page

- [x] 4.1 Book GET: if the resolved slot ISO is booked, render `BookEventPage` `view="already_booked"` (message + My Tickets + back to event; no confirm `Form` / submit)
- [x] 4.2 Already-booked view with ≥2 future occurrences: datetime `<select>` GETs `?dateTime=` (no hidden POST `date_time`); unbooked hour restores `view="form"`
- [x] 4.3 Book POST: map `BookingError` `ALREADY_BOOKED` to `view="already_booked"` (same copy + link), not `errorGeneric` on the form

## 5. Stories

- [x] 5.1 `EventDetailPage.stories.tsx`: already-booked selected hour on a multi-slot event (morning booked, evening bookable); keep existing unbooked Eligible story
- [x] 5.2 `BookEventPage.stories.tsx`: `view="already_booked"` vs existing Form / Past due

## 6. Verification & handoff

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `cd apps/web && bun test app/lib/checkout-slot.test.ts` plus the new booking-content copy test — exits 0
- [x] 6.4 Story/manual check: selected booked hour shows the DE or EN sentence and a link whose accessible name is `Meine Tickets` / `My Tickets`
- [x] 6.5 Mark step 02 done in `.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`; canonical Gherkin / Playwright wait for step 03; no new theme tokens
