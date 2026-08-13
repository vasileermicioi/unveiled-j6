## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`EventDetailCheckoutCard` island, `EventDetailPage` checkout wiring, `apps/web/app/routes/[locale]/events/[id].tsx` and `.../book.tsx`, `BookEventPage`, `packages/db/src/booking/book-event.ts`, `maxBookableTickets`, `packages/db/src/schema/bookings.ts`, ICS/email builders using event primary `dateTime`)
- [x] 1.2 Confirm step 03 is merged: admin list + range builder persist `dateTimes` + `occurrenceCreditPrices`; `ALLOW_MULTI_DATETIME_UI` is true

## 2. Schema and occurrence helpers

- [x] 2.1 Add `dateTime` (`date_time timestamptz`) on `packages/db/src/schema/bookings.ts`. Migration: nullable column, `UPDATE bookings SET date_time = events.date_time FROM events WHERE bookings.event_id = events.id`, then NOT NULL. Generate (`bun run db:generate`) and apply (`bun run db:migrate`)
- [x] 2.2 Add `creditPriceForOccurrence(dateTimes, occurrenceCreditPrices, dateTime): number | null` (exact `getTime()` match) and `futureOccurrences(dateTimes, occurrenceCreditPrices, now?): EventOccurrence[]` (`startsAt >= now`, sorted) in `packages/db/src/catalog/datetime.ts`; re-export from `@unveiled/db`
- [x] 2.3 Unit-test helpers in `packages/db/src/catalog/datetime.test.ts` (or booking unit tests): match cheaper morning vs expensive evening; unknown instant returns null; past instants excluded from `futureOccurrences`; `maxBookableTickets` with slot price 3 vs 1 in `booking.unit.test.ts`

## 3. Booking domain

- [x] 3.1 Add `UNKNOWN_SLOT` and `PAST_SLOT` to `BookingErrorCode`. Add optional `dateTime?: Date` on `BookEventInput`
- [x] 3.2 `bookEvent`: after idempotent existing-row return and event lock, resolve slot (provided → exact match else `UNKNOWN_SLOT`, matched but `< now` → `PAST_SLOT`; omitted → next upcoming, else primary when all past). `totalCredits = slotPrice * ticketsCount`. Persist `bookings.dateTime`. Do not compare datetime on idempotent retry
- [x] 3.3 Leave `promoteWaitlistEntry` and `createCompTicket` omitting `dateTime`. Add `UNKNOWN_SLOT` / `PAST_SLOT` to waitlist `SKIP_BOOKING_CODES`
- [x] 3.4 Integration tests in `book-event.integration.test.ts`: book 2 tickets at 3-credit evening vs 1-credit morning; reject datetime not on the event; reject past slot; idempotent replay with a different posted datetime returns the original row; existing tests still pass when they omit `dateTime` (single-slot events)

## 4. Checkout card and event detail

- [x] 4.1 Extend `EventDetailCheckoutCard` with optional `occurrences?: { startsAtIso: string; creditPrice: number; maxQty: number }[]` and optional `defaultDateTimeIso`. Native `<select>` + Label when `occurrences.length >= 2` (Europe/Berlin labels). Default soonest future. On change: update unit credits, clamp qty to that slot’s `maxQty`, include `qty` + `dateTime` (ISO) on book/login hrefs. Single future item: no dropdown, that slot’s credits. Omit `occurrences` for guests
- [x] 4.2 Wire `events/[id].tsx` / `EventDetailPage`: for eligible members only, pass `futureOccurrences` mapped through `maxBookableTickets` per slot. Keep guest checkout unchanged (no dropdown, no credits). DETAILS may still list all datetimes. Compact cards/map unchanged
- [x] 4.3 DE/EN copy for the datetime label (`Datum und Uhrzeit` / `Date and time`) in the event-detail content module. Accessible name must work with `getByLabel` for step 05

## 5. Book, confirm, ICS, email

- [x] 5.1 Book GET/POST: parse query `dateTime` and form `date_time`; default GET to soonest future when missing; compute `maxQty` from slot price; POST `bookEvent` with parsed `Date`. Map `UNKNOWN_SLOT` / `PAST_SLOT` to copy and re-render without charging
- [x] 5.2 `BookEventPage`: show selected datetime and slot unit price; hidden `date_time` when one future slot; native select when two or more remain. Wrap select + `TicketCountSelect` in a small island so changing slot updates unit price and clamps qty. Mutation remains SSR POST
- [x] 5.3 Confirm page “when” line, ICS `DTSTART` (`confirm.tsx` + `buildEventIcs` callers), confirmation email “when”, waitlist-promotion email “when”, and `BookingTicketCard` datetime: use `booking.dateTime`, not event primary
- [x] 5.4 DE/EN `errorUnknownSlot` / `errorPastSlot` in `booking-content.ts`

## 6. Tests and verification

- [x] 6.1 Cover checkout occurrence switching as island/unit logic if extracted (href includes `dateTime`, qty clamped when switching from price 1 to 3). Update BookEventPage / email / ICS tests that assumed event primary
- [x] 6.2 Run `bun run lint`, `bun run typecheck`, and `bun --filter @unveiled/db test src/booking/booking.unit.test.ts src/booking/book-event.integration.test.ts` — unit tests exit 0 without cloud; integration when `DATABASE_URL` is set
- [x] 6.3 Mark this step done in `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`. Do not unskip Playwright (step 05). Do not rewrite canonical Gherkin; mention the booking behavior change in the PR
