## Why

`bookEvent` accepts any `ticketsCount >= 1` and there is no uniqueness on `(user, event, occurrence)`, so a member can buy several tickets for the same hour. This first increment of **one ticket per occurrence** makes that impossible in the database and in every write path, and removes quantity pickers so the live UI cannot POST a count other than 1.

## What Changes

- Add a partial unique index on `bookings (user_id, event_id, date_time)` WHERE `status IN ('CONFIRMED', 'USED')`. Migration dedupes existing duplicate active rows first (keep earliest `created_at`; cancel later; restore `remaining_capacity` by cancelled `tickets_count`).
- **BREAKING (domain):** `assertValidTicketCount` requires exactly `1` (`INVALID_TICKET_COUNT` otherwise). New bookings persist `tickets_count = 1`. `maxBookableTickets` returns `0` or `1` (min of existing caps and 1); guests no longer get a preview cap of 3.
- Add `BookingErrorCode` `ALREADY_BOOKED`. After slot resolution, inside the `bookEvent` transaction, reject a second active booking for that user + event + `date_time`. Unique-violation `23505` on the new index maps to `ALREADY_BOOKED`. Idempotent retry on the same `(user_id, idempotency_key)` is unchanged and runs **before** the uniqueness check.
- Export `listActiveBookedOccurrenceInstants(db, userId, eventId)` (name flexible) returning `date_time` values for that member’s `CONFIRMED`/`USED` bookings on the event — used by step 02; call it from tests in this step.
- Waitlist join persists `requested_qty = 1`. Promotion calls `bookEvent` with `ticketsCount = 1` and treats `ALREADY_BOOKED` as a skip code (`WAITING` + `skipped_once`). Admin `createCompTicket` always books 1 ticket (no override).
- Remove quantity steppers/selects on event detail (`EventDetailCheckoutCard`), book (`BookSlotFields` / `TicketCountSelect`), waitlist join, and admin comp. POST `ticketsCount=1` (hidden or omitted with server default 1). Keep datetime `<select>` when ≥2 future occurrences. Credit total = selected slot price × 1.
- Out of scope: already-booked message + My Tickets link (step 02); Playwright / canonical `docs/product/` Gherkin rewrites (step 03); per-hour capacity; deleting unused `TicketCountSelect.tsx`; rewriting historical `tickets_count > 1` rows.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `booking`: At most one `CONFIRMED`/`USED` row per `(user_id, event_id, date_time)`; new writes persist `tickets_count = 1`; `ALREADY_BOOKED` on a second active occurrence; no quantity stepper on detail/book/comp; credits charged = selected slot price × 1.
- `waitlist`: Join persists `requested_qty = 1`; promotion books qty 1 and skips on `ALREADY_BOOKED`.

## Impact

- **DB:** `packages/db/src/schema/bookings.ts` (partial unique index); new Drizzle migration under `packages/db/drizzle/` (next after `0028`); pre-index SQL dedupe of duplicate active rows.
- **Domain (`@unveiled/db`):** `book-event.ts`, `eligibility.ts`, `errors.ts`, `max-bookable-tickets.ts`, new booked-instant helper + export from `booking/index.ts`; `waitlist/join-waitlist.ts`, `promote-waitlist-entry.ts`, `process-waitlist-for-event.ts`; `admin/create-comp-ticket.ts`.
- **SSR / UI (`apps/web`):** event detail + book + waitlist join routes; `EventDetailCheckoutCard`, `BookSlotFields`, `WaitlistJoinPage`, `AdminCompTicketForm`, `comp-ticket.tsx`. Credit totals and book/waitlist POSTs always qty 1. Do not delete `TicketCountSelect.tsx` if unused.
- **Tests:** `booking.unit.test.ts`, `book-event.integration.test.ts`, waitlist/comp tests — qty=4 success becomes reject / already-booked / second-hour success.
- **Source brief:** `.dev-plan/current-iteration/one-ticket-limit-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`
- **Consumed by:** `one-ticket-limit-02-already-booked-ui`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/db && bun test src/booking src/waitlist src/admin` (integration skips without `DATABASE_URL`); without a DB: `assertValidTicketCount(4)` throws and `maxBookableTickets` never returns > 1
