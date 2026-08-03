## 1. Setup / confirm inputs

- [x] 1.1 Confirm admin create/edit/clone persist `dateTimes` correctly (step 02 done) and skim parent guide release criteria / non-goals
- [x] 1.2 Inventory current single-`dateTime` display call sites: `EventDetailPage`, `EventCard`, map popup, admin events/featured tables, book/confirm ICS, booking ticket card, booking-confirmation email

## 2. Consumer and admin read surfaces

- [x] 2.1 Update event detail DETAILS / summary date chrome to list all `dateTimes` (Europe/Berlin) for booking-eligible viewers and emphasize next upcoming; keep guest/non-eligible omit-date gating
- [x] 2.2 Ensure EventCard and feed mappers show denormalized next upcoming `dateTime` (fix any mapper that picks a past/arbitrary slot)
- [x] 2.3 Add next-upcoming datetime line to map marker popups (extend marker payload + popup DOM)
- [x] 2.4 Update admin Events / Featured date columns to show next upcoming + optional `+N` when `dateTimes.length > 1`

## 3. Booking confirm / ICS / email

- [x] 3.1 Align book confirm, `buildEventIcs`, `BookingTicketCard`, and booking-confirmation (and waitlist promotion if it shows event time) with next-upcoming `dateTime`
- [x] 3.2 Confirm booking POST path stays event-scoped (no datetime slot field) and document the rule in `docs/product/extras/gaps-and-decisions.md`

## 4. Product docs, fixtures, and e2e

- [x] 4.1 Update `docs/product/features` (`event-discovery`, `admin-events`, booking as needed), `schema-overview.md` if any display notes remain stale, and `ui/ui-component-map.md` for detail/card/admin datetime behavior
- [x] 4.2 Sweep Ladle stories / fixtures for multi-datetime shape on detail (and card fixtures that need past+future next-upcoming cases)
- [x] 4.3 Add/adjust Playwright: admin multi-datetime add/remove smoke; discovery still excludes fully past multi-datetime events (proximity selectors only)

## 5. Verification and close-out

- [x] 5.1 Run `bun run lint` and `bun run typecheck` — both exit 0
- [x] 5.2 Run targeted admin + discovery e2e when e2e env is available
- [x] 5.3 Mark step 03 done in `.dev-plan/current-iteration/03-event-multi-datetime-parent-guide.md`; note slot-level booking as follow-up if product later wants it
