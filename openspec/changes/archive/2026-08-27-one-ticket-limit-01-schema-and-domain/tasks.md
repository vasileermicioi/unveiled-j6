## 1. Setup

- [x] 1.1 Read the step plan, parent guide, `proposal.md`, `design.md`, and both spec deltas; confirm artifacts exist (`packages/db/src/schema/bookings.ts`, `book-event.ts`, `eligibility.ts`, `errors.ts`, `max-bookable-tickets.ts`, waitlist join/promote/process, `create-comp-ticket.ts`, `EventDetailCheckoutCard`, `BookSlotFields`, `TicketCountSelect`, `WaitlistJoinPage`, `AdminCompTicketForm`)
- [x] 1.2 Lock approach: partial unique index on active `(user_id, event_id, date_time)`; dedupe-then-index in one migration; `ALREADY_BOOKED` after slot resolve; map only `bookings_user_event_datetime_active_uidx` `23505`; no admin uniqueness override; do not rewrite historical `tickets_count > 1`; do not edit `docs/product/` Gherkin

## 2. Schema & migration

- [x] 2.1 Add `uniqueIndex("bookings_user_event_datetime_active_uidx").on(userId, eventId, dateTime).where(sql\`status IN ('CONFIRMED', 'USED')\`)` on Drizzle `bookings`
- [x] 2.2 Generate SQL (`bun run db:generate`); ensure the migration **dedupes first** (keep earliest `created_at` / `id`; cancel later `CONFIRMED`/`USED` dupes with a stable `cancellation_reason`; restore `events.remaining_capacity` by cancelled `tickets_count`, clamped with `LEAST(total_capacity, …)`); then `CREATE UNIQUE INDEX`; do not run waitlist processing or voucher restock
- [x] 2.3 Apply locally (`bun run db:migrate`)

## 3. Booking domain

- [x] 3.1 Add `ALREADY_BOOKED` to `BookingErrorCode` and throw it from `bookEvent` after slot resolution when a `CONFIRMED`/`USED` row already exists for `(userId, eventId, slotDateTime)`
- [x] 3.2 Change `assertValidTicketCount` to require exactly `1` (`INVALID_TICKET_COUNT` otherwise)
- [x] 3.3 Keep idempotency lookup **before** the uniqueness check; wrap booking insert so `23505` on `bookings_user_event_datetime_active_uidx` maps to `ALREADY_BOOKED` (do not map the idempotency unique index)
- [x] 3.4 Clamp `maxBookableTickets` to `0` or `1` (min of existing caps and 1); guests no longer return `3`
- [x] 3.5 Add `listActiveBookedOccurrenceInstants(db, userId, eventId)` returning `date_time` for that member’s `CONFIRMED`/`USED` rows on the event; export from `@unveiled/db`

## 4. Waitlist & admin comp

- [x] 4.1 Join waitlist: `requested_qty` must be 1 (existing `assertValidTicketCount` → `INVALID_QTY`); SSR join POST defaults to 1 with no qty picker
- [x] 4.2 Promote with `ticketsCount: 1` (ignore stored `requested_qty`); add `ALREADY_BOOKED` to `SKIP_BOOKING_CODES`; `processWaitlistForEvent` treats fit as `remaining >= 1`
- [x] 4.3 `createCompTicket` always books 1 ticket; drop/ignore input `ticketsCount`; remove qty field from `AdminCompTicketForm` and stop parsing it on the comp route

## 5. UI surfaces

- [x] 5.1 Remove the qty stepper from `EventDetailCheckoutCard`; keep datetime `<select>` when ≥2 future occurrences **independent** of qty chrome; credit total = selected slot price × 1; guests still omit quantity, datetime dropdown, and credit totals
- [x] 5.2 Remove `TicketCountSelect` from `BookSlotFields` and waitlist join; book/waitlist POST `ticketsCount`/`requestedQty` = 1 (hidden or omitted with server default 1); do **not** delete `TicketCountSelect.tsx` if unused
- [x] 5.3 Update Ladle/stories that assume a qty stepper or `maxQty > 1` on checkout/book/waitlist/comp so they still render (no already-booked copy — that is step 02)

## 6. Tests

- [x] 6.1 `booking.unit.test.ts`: `assertValidTicketCount(4)` throws; `maxBookableTickets` never returns > 1 (replace guest-cap-3 and member-max-8 cases)
- [x] 6.2 `book-event.integration.test.ts`: replace qty=4 success with reject; add same-hour second booking → `ALREADY_BOOKED` and no credit/capacity change; different hour succeeds with `tickets_count = 1`; cancelled hour can be rebooked; `listActiveBookedOccurrenceInstants` returns only active instants
- [x] 6.3 Waitlist tests: join qty ≠ 1 rejected; join persists 1; promotion skip on `ALREADY_BOOKED`. Comp tests: always 1. Fix other `@unveiled/db` booking/waitlist/admin tests that POST qty > 1 on the write path (leave sales-export historical multi-qty rows)

## 7. Verification & handoff

- [x] 7.1 Run `bun run lint` — exits 0
- [x] 7.2 Run `bun run typecheck` — exits 0
- [x] 7.3 Run `cd packages/db && bun test src/booking src/waitlist src/admin` — exits 0 (integration files skip cleanly without `DATABASE_URL`)
- [x] 7.4 Without a DB: `assertValidTicketCount(4)` throws; `maxBookableTickets` never returns > 1
- [x] 7.5 Mark step 01 done in `.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`; do not rewrite canonical Gherkin (step 03); note unused `TicketCountSelect` for step 03 deletion if nothing imports it
