## Context

Parent feature: per-occurrence credits (`.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`), step 04 — checkout slot picker after range builder (step 03 done).

Current state:

- Catalog events store paired `date_times[]` + `occurrence_credit_prices[]`. Denormalized `date_time` / `credit_price` equal the primary/next slot. Admin create/edit/clone persist mixed prices (list UI + range builder).
- `bookEvent` charges `event.creditPrice * ticketsCount` and does not store an occurrence. `BookEventInput` has no `dateTime`. Idempotent retry returns the existing row before event lock.
- `EventDetailCheckoutCard` island owns qty +/− and credit total. Eligible members see `event.creditPrice`; guests omit credits and date. Book CTA is `/:locale/events/:id/book?qty=N` only.
- Book GET/POST (`book.tsx` + `BookEventPage`) use event-level `creditPrice` for `maxBookableTickets` and copy. Confirm ICS (`buildEventIcs`), confirmation email “when”, waitlist-promotion email, and `BookingTicketCard` all format `event.dateTime` (catalog primary). `BookConfirmPage` currently has no datetime line.
- Waitlist promotion and admin `createCompTicket` call `bookEvent` without a slot. Waitlist join stays event-level (no picker).
- Playwright / canonical Gherkin still describe event-scoped booking; step 05 owns that sweep.

Constraints: Booking domain is the only writer of purchase bookings/ledger (`AGENTS.md` domain rules). Native `<select>` + Label, not HeroUI `Select` (`AGENTS.md` §14). Island for qty + slot; mutation remains SSR POST on `/events/:id/book`. Europe/Berlin labels. Parent locks 3–4 and 8: capacity/inventory stay event-scoped; booking is slot-scoped for time and credits only; dropdown only for booking-eligible members with two or more **future** occurrences.

## Goals / Non-Goals

**Goals:**

- Persist `bookings.date_time` (backfill from `events.date_time`, then NOT NULL).
- `bookEvent` resolves a slot, charges that occurrence’s credits, stores the instant.
- Reject unknown and past posted slots with typed errors and no mutations.
- Idempotent retries ignore a mismatched posted datetime.
- Checkout dropdown for eligible members when `futureOccurrences.length >= 2`; credits and max qty follow the slot; CTA includes `qty` + `dateTime` ISO.
- Book / confirm / ICS / email / ticket card use the booked instant.
- Unit tests without cloud; integration tests when `DATABASE_URL` is set.

**Non-Goals:**

- Per-slot capacity, remaining seats, or voucher inventory.
- Waitlist slot picker; waitlist join stays event-level. Promotion still charges the next upcoming occurrence.
- Admin comp-ticket slot UI (comps omit `dateTime` and take the default).
- EventCard / map price ranges or compact-card slot pickers.
- Canonical Gherkin / Playwright unskip (step 05).
- Changing historical `credit_ledger` rows.

## Decisions

1. **Helpers live next to occurrence pairing, not inside `bookEvent`**
   - **Choice:** Add to `packages/db/src/catalog/datetime.ts` (already has `EventOccurrence` / `primaryCreditFromLists`) and re-export from `@unveiled/db`:
     - `creditPriceForOccurrence(dateTimes, occurrenceCreditPrices, dateTime): number | null` — exact `getTime()` match after `Date` normalize; `null` if missing or arrays misaligned.
     - `futureOccurrences(dateTimes, occurrenceCreditPrices, now = new Date()): EventOccurrence[]` — zip by index, keep `startsAt >= now`, sort ascending by instant.
   - **Rationale:** Catalog already owns pairing and epoch equality. Booking calls these after locking the event row. Unit-testable without a transaction.
   - **Alternatives:** Put helpers only in `packages/db/src/booking/` (duplicates zip logic); match with string ISO equality (timezone/`Z` vs offset mismatches).

2. **`bookEvent` slot resolution**
   - **Choice:** `BookEventInput.dateTime?: Date` (optional). Inside the transaction, **after** the idempotent existing-row return and event lock:
     | Caller | Behavior |
     |---|---|
     | `dateTime` provided | Must match one `event.dateTimes` element (`getTime()`). Else `UNKNOWN_SLOT`. If matched and `startsAt < now`, `PAST_SLOT`. |
     | omitted (waitlist / comp) | Prefer `futureOccurrences(...)[0]`. If none (all past), use `primaryDateTimeFromList` (earliest) so admin comps of past events still insert. That instant MUST still be on `date_times`. |
     | member POST missing/unparseable | Treat as `UNKNOWN_SLOT` — do not invent a slot. |
     - `totalCredits = slotPrice * ticketsCount` (`0` when `skipCreditCharge`). Insert `dateTime: resolved`.
     - Injectable `now?: Date` on `bookEvent` for unit-style control is **not** required; helpers take `now`; integration tests use real past/future ISO instants.
   - **Rationale:** Step plan requires `dateTime` for member purchase and a default for waitlist/comp. Falling back to primary when all past avoids breaking comps; member path never omits.
   - **Alternatives:** Required `dateTime` on the type (breaks waitlist/comp call sites); reject omitted when all past (breaks comps).

3. **New `BookingErrorCode`s: `UNKNOWN_SLOT` and `PAST_SLOT`**
   - **Choice:** Add both to `BookingErrorCode`. Book route maps them to DE/EN copy (`errorUnknownSlot` / `errorPastSlot`) and re-renders without charging. Add both to waitlist `SKIP_BOOKING_CODES` as defense (promotion omits `dateTime`, so they should not fire in the happy path).
   - **Rationale:** Distinct from `EVENT_NOT_FOUND`. Tests assert typed codes. Step plan: reject unknown or past with no mutations.
   - **Alternatives:** Reuse `EVENT_NOT_FOUND` (opaque); one `INVALID_SLOT` code (harder to copy).

4. **Idempotency stays first; mismatched datetime is ignored**
   - **Choice:** Keep the existing `(userId, idempotencyKey)` lookup **before** slot validation. If a row exists, return `{ booking, created: false }` even when the retry posts a different `dateTime`. Do not compare or update `bookings.date_time` on retry.
   - **Rationale:** Step plan: “Idempotent retries ignore a mismatched posted datetime and return the original booking.” Matches current “no second allocation” guarantee.
   - **Alternatives:** Reject retry on datetime mismatch (surprising double-submit if the user changed the select); overwrite the stored slot (mutates a confirmed booking).

5. **Checkout island: precomputed per-slot `maxQty`, ISO strings**
   - **Choice:** Pass optional `occurrences?: { startsAtIso: string; creditPrice: number; maxQty: number }[]` into `EventDetailCheckoutCard` **only** for `viewer.kind === "eligible"`. Route/`EventDetailPage` builds this from `futureOccurrences` + `maxBookableTickets` per slot (credits, remaining capacity, voucher inventory unchanged / event-level). Island:
     - `occurrences.length >= 2`: native `<select>` + Label (DE `Datum und Uhrzeit` / EN `Date and time`). Options: Europe/Berlin `dateStyle: "medium"` + `timeStyle: "short"` (omit time for `ALL_DAY` if the page already does that for DETAILS; otherwise same formatter as DETAILS). Default = soonest future (`occurrences[0]`), or a `defaultDateTimeIso` query match.
     - On change: switch `creditPrice` / `maxQty`, clamp qty, set book/login hrefs via `qty` + `dateTime` (`startsAtIso`).
     - `occurrences.length === 1`: no dropdown; use that slot’s credits/maxQty (may differ from denormalized `credit_price` if the primary is past).
     - Guests / non-eligible: omit `occurrences`; existing chrome (no credits, guest max 3, login CTA without `dateTime`).
   - Do **not** import `@unveiled/db` into the island. Dates as ISO strings because HonoX island props JSON-serialize.
   - **Rationale:** Parent lock 8; native select; max qty must follow slot price (1 vs 3 credits). Precomputing maxQty keeps the island layout-only.
   - **Alternatives:** One `creditPrice` + client-side `maxBookableTickets` (db in island); HeroUI `Select` (forbidden).

6. **URL and form field names**
   - **Choice:** GET query `dateTime` (ISO-8601 UTC, `toISOString()`). POST field `date_time` (same ISO). Book GET reads `dateTime`; POST reads `date_time`, falling back to query `dateTime`. Invalid Date parse → `UNKNOWN_SLOT`.
   - **Rationale:** Step plan names both; query camelCase matches existing `qty`; form snake_case matches the column.
   - **Alternatives:** Only `dateTime` everywhere (inconsistent with `ticketsCount` vs DB); epoch millis (opaque in URLs).

7. **Book page: show slot; native select when multiple future remain**
   - **Choice:** `BookEventPage` receives `slotDateTime: Date`, `slotCreditPrice: number`, and `futureOccurrences` (ISO + price + maxQty). Display formatted slot datetime + unit price (replace `event.creditPrice` in the summary line). `maxQty` from the selected slot. Hidden `date_time` when one future slot; native `<select name="date_time">` when two or more. Changing the select must update unit price and clamp qty — wrap datetime select + existing `TicketCountSelect` in a small island (`BookSlotFields` or extend the checkout pattern) so hydration is not required for the control to be visible, but live totals work. SSR POST still hits `/events/:id/book`.
   - GET with missing `dateTime` and ≥2 future slots defaults to soonest future (same as checkout).
   - **Rationale:** Step plan: book page shows selected datetime and slot price; optional select if multiple remain.
   - **Alternatives:** Force a round-trip GET on select change (no island, worse UX); keep only a hidden field (cannot correct a wrong deep-link without going back).

8. **Confirm / ICS / email / ticket card read `booking.dateTime`**
   - **Choice:** `BookConfirmPage` adds a “when” line from `booking.dateTime` (Europe/Berlin, locale). Confirm ICS download passes `booking.dateTime` as `event.dateTime` into `buildEventIcs` (that payload already means “calendar start”, not catalog primary — update the ICS comment). `sendBookingConfirmation` / waitlist-promotion “when” use the same instant. `BookingTicketCard` formats `booking.dateTime` instead of `event.dateTime`. Fallback to `event.dateTime` only if a row were missing the column (should not after NOT NULL).
   - **Rationale:** Step plan names confirm chrome, ICS `DTSTART`, ticket card, confirmation email. My Tickets uses the same card.
   - **Alternatives:** Add a separate `startsAt` field on email/ICS types (more churn, same data).

9. **Capacity and inventory stay event-level**
   - **Choice:** No schema or check changes to `remaining_capacity` or voucher pools. Two slots still share one pool (parent lock 3; accepted risk).
   - **Rationale:** Out of scope; do not invent per-slot seats.
   - **Alternatives:** Slot capacity table (new parent feature).

10. **Migration shape**
    - **Choice:** Add nullable `bookings.date_time timestamptz`; `UPDATE bookings SET date_time = events.date_time FROM events WHERE bookings.event_id = events.id`; set NOT NULL. Generate via `bun run db:generate`, apply `bun run db:migrate`. No extra index required (My Tickets orders by `created_at`). Do not rewrite `credit_ledger`.
    - **Rationale:** Same backfill-then-NOT-NULL pattern as `occurrence_credit_prices`. Historical bookings inherit the event primary (best available; they were event-scoped).
    - **Alternatives:** Leave nullable (violates step plan); backfill from `date_times[1]` (wrong).

11. **Copy**
    - **Choice:** Event-detail + book content modules (DE/EN). Defaults:
      - Label: `Datum und Uhrzeit` / `Date and time`
      - `errorUnknownSlot`: `Dieser Termin ist nicht verfügbar.` / `That date and time is not available.`
      - `errorPastSlot`: `Dieser Termin liegt in der Vergangenheit.` / `That date and time has already passed.`
    - Accessible name must work with `getByLabel` for step 05.
    - **Rationale:** Step plan requires Europe/Berlin labels and native select.

## Risks / Trade-offs

- **[Risk] Event-level capacity vs popular slots** (morning consumes seats evening needed) → Mitigation: accepted parent risk; no per-slot capacity in this feature.
- **[Risk] Waitlist promotion charges next upcoming, not the slot the member wanted** → Mitigation: accepted parent trade-off; no waitlist slot picker.
- **[Risk] ISO round-trip mismatch** (client `toISOString()` vs PG timestamptz) → Mitigation: compare epoch ms after `new Date(...)`; store timestamptz; tests use the same ISO the catalog persisted.
- **[Risk] Deep-link to a slot that just passed** → Mitigation: `PAST_SLOT` on POST; GET should fall back to soonest remaining future or show the error without charging.
- **[Risk] Island Date serialization** → Mitigation: ISO strings only on island props.
- **[Risk] Comp of fully-past event** → Mitigation: omitted `dateTime` falls back to primary when no future slot.
- **[Trade-off] Historical bookings backfill event primary**, which may not be the night the member attended → Acceptable; those rows had no slot.
- **[Trade-off] Playwright stays skipped** → Required; step 05 unskips. Accessible labels are added now.

## Migration Plan

1. Add `bookings.date_time` + backfill + NOT NULL; generate and apply migration.
2. Add datetime helpers + unit tests (`creditPriceForOccurrence`, `futureOccurrences`, `maxBookableTickets` with price 3 vs 1).
3. Extend `bookEvent` + error codes; waitlist/comp keep omitting `dateTime`. Integration tests: morning vs evening charge, unknown/past reject, idempotent replay with mismatched datetime.
4. Checkout island + event detail route; book GET/POST + `BookEventPage`; confirm / ICS / email / ticket card.
5. Run `bun run lint`, `bun run typecheck`, and the listed booking tests.
6. Mark step 04 done in the parent guide. Do not unskip Playwright. Do not rewrite canonical Gherkin.
7. Rollback: revert the PR and migration (down: drop `bookings.date_time`). Catalog arrays unchanged. In-flight bookings after deploy have `date_time`; rolling back requires the down migration.

## Open Questions

- None blocking. Canonical `booking.feature` / `event-discovery.feature` narrative updates wait for step 05. Copy strings above are the implementer default unless a later pass prefers different DE wording.
