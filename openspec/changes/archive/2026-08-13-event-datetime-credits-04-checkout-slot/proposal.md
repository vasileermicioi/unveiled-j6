## Why

Admins can now store many priced datetimes, but public event detail still shows one `creditPrice` and booking stays event-scoped (no slot, ICS uses next upcoming). Booking-eligible members need to pick a future occurrence, pay that slot’s credits, and see that instant on confirm / ICS / email (parent feature `event-datetime-credits`, step 04 of 05).

## What Changes

- **BREAKING (schema):** Add `bookings.date_time timestamptz`. Backfill from the event’s denormalized `events.date_time`, then set NOT NULL.
- **BREAKING (booking API):** `bookEvent` accepts `dateTime?: Date`. Member purchase MUST pass a future instant that matches one `events.date_times` element. Credits charged are that occurrence’s `occurrence_credit_prices` × ticket count. The booking row stores `bookings.date_time`.
- Unknown or past posted slots are rejected with new typed booking errors; no credits, capacity, inventory, or ledger mutations.
- Idempotent retries of the same `(user_id, idempotency_key)` return the original booking and **ignore** a mismatched posted datetime.
- Waitlist promotion and admin comp omit a slot; `bookEvent` defaults to the next upcoming occurrence (primary when all are past, so comps of past events still work).
- Event-detail checkout card: native `<select>` when two or more **future** occurrences exist; changing selection updates unit credits, `maxQty` via `maxBookableTickets`, and qty × credits total. Book / login URLs include `qty` and `dateTime` (ISO instant).
- Single future occurrence: no dropdown; that slot’s credits. Guests: no dropdown, no credits (unchanged). Compact cards / map unchanged (next upcoming + denormalized `credit_price`). DETAILS may keep listing all datetimes.
- Book GET/POST parse `dateTime` / `date_time`, re-validate, show the slot price. Confirm page time chrome, ICS `DTSTART`, ticket-card datetime, and confirmation-email “when” use `booking.dateTime`.
- Unit/integration tests: cheaper morning vs expensive evening, reject unknown/past slot, idempotent replay, `maxBookableTickets` with slot price 3 vs 1.
- Out of scope: per-slot capacity, waitlist slot picker, admin comp-ticket slot UI, e2e/Gherkin canonical sweep (step 05), EventCard price ranges.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `booking`: Bookings store the chosen occurrence on `bookings.date_time` and charge that slot’s credits. Event-scoped “no slot selection” is removed. Capacity and voucher inventory stay event-level. Confirm / ICS / email use the booked instant. Idempotent retries ignore a mismatched datetime.
- `event-discovery`: On public event detail, booking-eligible members with two or more future datetimes get a native datetime select on the checkout card; credits and max qty follow the selected slot. Guests and other non–booking-eligible viewers do not see the dropdown or credit totals.

## Impact

- **Schema:** `packages/db/src/schema/bookings.ts` — `dateTime` column; Drizzle migration with backfill from `events.date_time`.
- **Domain:** `@unveiled/db` helpers `creditPriceForOccurrence` / `futureOccurrences`; `bookEvent({ dateTime })`; new `BookingErrorCode` values `UNKNOWN_SLOT` and `PAST_SLOT`. Waitlist promotion and `createCompTicket` keep omitting `dateTime`.
- **Checkout UI:** `EventDetailCheckoutCard` island, `EventDetailPage`, `apps/web/app/routes/[locale]/events/[id].tsx`. Native `<select>` + Label (`AGENTS.md` §14), not HeroUI `Select`. Mutation stays SSR POST on `/events/:id/book`.
- **Book / confirm:** `book.tsx`, `BookEventPage`, `confirm.tsx`, `BookConfirmPage`, `BookingTicketCard` (My Tickets + confirm). Hidden or posted `date_time`.
- **Email / ICS:** `@unveiled/email` `buildEventIcs` and booking-confirmation “when” take the booked instant (callers pass `booking.dateTime`).
- **Copy:** DE/EN datetime-select label and slot-error strings in event-detail / booking content modules.
- **Tests:** `packages/db/src/booking/booking.unit.test.ts`, `packages/db/src/booking/book-event.integration.test.ts` (integration when `DATABASE_URL` is set).
- **Source brief:** `.dev-plan/current-iteration/event-datetime-credits-04-checkout-slot.md`
- **Parent:** `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`
- **Depends on:** `event-datetime-credits-03-range-builder` (done)
- **Consumed by:** `event-datetime-credits-05-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun --filter @unveiled/db test src/booking/booking.unit.test.ts src/booking/book-event.integration.test.ts`
