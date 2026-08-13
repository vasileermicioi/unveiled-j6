## ADDED Requirements

### Requirement: Member selects a datetime slot when booking
When an event has two or more future datetimes, a booking-eligible member SHALL select one future occurrence before confirming. The booking SHALL store that instant on `bookings.date_time`. Credits charged SHALL be that occurrence’s `occurrence_credit_prices` value times ticket count. Capacity and voucher inventory checks SHALL remain at event level. The system SHALL reject a datetime that is not on the event or that is in the past (`UNKNOWN_SLOT` / `PAST_SLOT`) with no credits, capacity, inventory, or ledger changes. Confirm page time chrome, ICS `DTSTART`, booking ticket card datetime, and confirmation-email “when” fields SHALL use `bookings.date_time`. Waitlist promotion and admin complimentary tickets MAY omit `dateTime`; the booking domain SHALL then persist the next upcoming occurrence (or the denormalized primary when every occurrence is past). Idempotent retry of the same `(user_id, idempotency_key)` SHALL return the original booking and SHALL ignore a mismatched posted datetime.

#### Scenario: Successful booking of a priced slot
- **WHEN** a member selects a future datetime priced 3 credits and books 2 tickets
- **THEN** a confirmed booking is stored with that `date_time`
- **AND** 6 credits are deducted
- **AND** remaining capacity decreases by 2

#### Scenario: Unknown or past slot rejected
- **WHEN** the posted datetime is missing from `date_times` or is in the past
- **THEN** the booking is rejected
- **AND** no credits, capacity, inventory, or ledger changes occur

#### Scenario: Confirmation calendar uses booked datetime
- **WHEN** a member books a non-primary future slot and downloads ICS or views confirm/email time fields
- **THEN** those surfaces use the booked datetime, not the event’s next upcoming datetime

#### Scenario: Idempotent retry ignores mismatched datetime
- **WHEN** the same `(user_id, idempotency_key)` is submitted again with a different posted datetime
- **THEN** the original booking is returned without a second charge or capacity change
- **AND** `bookings.date_time` remains the originally stored instant

#### Scenario: Waitlist promotion defaults to next upcoming
- **WHEN** waitlist promotion calls `bookEvent` without a `dateTime`
- **THEN** the created booking stores the event’s next upcoming occurrence
- **AND** credits charged equal that occurrence’s price times the requested ticket count

## MODIFIED Requirements

### Requirement: Bookings persistence
The system SHALL persist event bookings in `public.bookings` with a generated primary key, foreign keys to `users`, `events`, and denormalized `partner_id`, ticket count, total credits charged, status (`CONFIRMED` | `WAITLIST` | `CANCELLED` | `USED`), redemption fields, `idempotency_key`, `date_time` (the booked occurrence instant, `timestamptz NOT NULL`), and timestamps. Foreign keys SHALL use `ON DELETE RESTRICT`. Existing rows SHALL backfill `date_time` from the event’s denormalized `events.date_time` before the column is set NOT NULL.

#### Scenario: Unique idempotency per user
- **WHEN** two booking rows would share the same `(user_id, idempotency_key)`
- **THEN** the database rejects the duplicate insert

#### Scenario: Booking row shape is queryable
- **WHEN** the booking domain inserts a confirmed booking for a member and event
- **THEN** the row stores `user_id`, `event_id`, `partner_id`, `tickets_count`, `total_credits`, `status`, `idempotency_key`, and `date_time`

#### Scenario: Historical bookings backfill event primary
- **WHEN** the `bookings.date_time` migration runs
- **THEN** every existing booking has `date_time` equal to that event’s denormalized `date_time`
- **AND** the column is NOT NULL

### Requirement: Atomic booking transaction
The system SHALL create purchase bookings only through a single Postgres transaction that locks the event row, verifies subscription eligibility and capacity and credits, allocates per-ticket redemption artifacts (`booking_tickets` plus voucher inventory when applicable), decrements capacity and credits, writes a `CONFIRMED` booking including `bookings.date_time`, and writes a negative `BOOKING` ledger entry (unless `skipCreditCharge`). Credits charged SHALL be the **selected occurrence** credit price × ticket count (not always denormalized `events.credit_price`, except that denormalized `credit_price` equals the primary occurrence and is used when that slot is selected or when the caller omits a slot and the next upcoming occurrence is primary). The Booking domain SHALL be the only writer of purchase bookings and `BOOKING` ledger rows. Ticket count shape validation SHALL require an integer ≥ 1 and SHALL NOT impose a hard upper bound of 3; remaining capacity, credit balance, and (for voucher types) available inventory remain authoritative rejection reasons. Idempotent retry of the same `(user_id, idempotency_key)` SHALL return the original booking without re-allocating inventory or mutating credits/capacity, and SHALL ignore a mismatched posted datetime.

#### Scenario: Successful booking
- **WHEN** I confirm the booking for a selected future datetime
- **THEN** a confirmed booking is created for me against the event and that datetime
- **AND** my credits are decremented by that slot’s creditPrice × ticket count
- **AND** the event’s remaining capacity is decremented by the ticket count

#### Scenario: Booking fails — insufficient credits
- **WHEN** credits are insufficient for the selected occurrence `creditPrice × ticket count`
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

#### Scenario: Idempotent retry
- **WHEN** the same `(user_id, idempotency_key)` is submitted again after success
- **THEN** no duplicate booking or credit/capacity change occurs and the original redemption info is returned
- **AND** voucher inventory is not allocated a second time

#### Scenario: Ticket quantity shape invalid
- **WHEN** a booking is requested with a non-integer ticket count or a count less than 1
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

#### Scenario: Ticket quantity above three still bookable
- **WHEN** an eligible member confirms a booking for more than 3 tickets and capacity and credits are sufficient
- **THEN** a confirmed booking is created and credits and capacity decrease accordingly

### Requirement: Ticket count selection bounds
For guests viewing the public event detail checkout affordance, the system SHALL allow selecting a ticket count from 1 through 3 (preview only; booking remains auth-gated). For signed-in members on detail and book surfaces, the maximum selectable ticket count SHALL be the minimum of (a) floor(available credits ÷ **selected occurrence** creditPrice), (b) the event’s remaining capacity, and (c) when provided for voucher-type events, available voucher inventory count (with creditPrice ≤ 0 treated as capacity/inventory-only). Changing the selected future datetime SHALL recompute this maximum and clamp the quantity. The booking transaction SHALL accept any integer ticket count ≥ 1 that passes capacity, credit, and inventory checks and SHALL NOT reject solely because the count is greater than 3.

#### Scenario: Guest preview capped at three
- **WHEN** a guest views a bookable event detail page
- **THEN** the ticket quantity control does not exceed 3

#### Scenario: Member max follows credits and capacity
- **WHEN** a signed-in member with 17 credits views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the maximum selectable ticket count is 8

#### Scenario: Member max uses the selected slot price
- **WHEN** a signed-in member with 6 credits views an event with a 1-credit slot and a 3-credit slot, remaining capacity 10
- **THEN** the maximum selectable ticket count is 6 on the 1-credit slot
- **AND** the maximum selectable ticket count is 2 on the 3-credit slot

#### Scenario: Member max also respects voucher inventory
- **WHEN** a signed-in member views a `VOUCHER_PROMO` event with remaining capacity 10, enough credits for 8 tickets, and only 3 `AVAILABLE` promo codes
- **THEN** the maximum selectable ticket count is 3

#### Scenario: Booking succeeds above former hard cap
- **WHEN** an eligible member confirms a booking for 4 tickets and capacity and credits are sufficient
- **THEN** the booking is created and credits/capacity decrease accordingly

#### Scenario: Capacity still enforced
- **WHEN** the requested ticket count exceeds remaining capacity
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

### Requirement: Booking confirmation surfaces and email
The system SHALL expose SSR pages at `/:locale/events/:id/book` (GET form + POST mutation) and `/:locale/events/:id/book/confirm`, communicate the “SECURE RSVP // NO REFUNDS” policy at booking, and SHALL send a Resend confirmation email with redemption info and an `.ics` attachment after a successful booking commit. Email send failure SHALL NOT roll back the booking. After booking, the confirm page SHALL present per-ticket redemptions from `booking_tickets`: members can copy textual redemption codes when present, reveal/hide those codes (masked by default), download PDF vouchers when applicable, download an `.ics` calendar file, and see support contact. Confirm page time chrome, ICS `DTSTART`, booking ticket card datetime, and confirmation-email “when” fields SHALL use `bookings.date_time`, not the event’s next upcoming datetime. The book GET/POST SHALL parse `dateTime` / `date_time`, re-validate the slot, and show that slot’s unit price.

#### Scenario: Post-booking actions
- **WHEN** a booking is confirmed
- **THEN** the member can copy redemption codes (when textual), reveal/hide those codes, download PDF vouchers when applicable, download an ICS calendar file, and see support contact on the confirm page
- **AND** each `booking_tickets` row is listed (not only booking-level `redemption_*`)

#### Scenario: Booking confirmation email
- **WHEN** a booking is confirmed
- **THEN** the member receives a confirmation email with redemption info and an ICS attachment

#### Scenario: Confirmation calendar uses booked datetime
- **WHEN** a member books a non-primary future slot and downloads ICS or views confirm/email time fields
- **THEN** those surfaces use the booked datetime, not the event’s next upcoming datetime

#### Scenario: No member self-cancel
- **WHEN** a member views book or confirm surfaces
- **THEN** no member-facing action exists to cancel the booking or request a refund

### Requirement: Detail page does not charge credits
The public event detail page SHALL NOT create bookings or ledger entries. Ticket quantity controls on detail, if shown, SHALL only influence navigation into the existing SSR booking or auth `returnTo` flow. When a datetime slot is selected, the primary book or login CTA SHALL include that occurrence as a `dateTime` query param (ISO instant) alongside `qty`. Credit deduction for purchases SHALL continue to occur only through the Booking domain on the dedicated `/:locale/events/:id/book` SSR form POST (or equivalent booking-domain writers such as waitlist promotion / admin comp — not from detail).

#### Scenario: Guest quantity does not book
- **WHEN** a guest changes ticket quantity on event detail
- **THEN** no booking row is created
- **AND** continuing requires authentication before any credit charge

#### Scenario: Eligible member quantity only deep-links
- **WHEN** an eligible member adjusts ticket quantity on event detail and follows the primary book CTA
- **THEN** they navigate to `/:locale/events/:id/book` (optionally with a quantity query and a `dateTime` query)
- **AND** no booking or ledger write occurs until the book page SSR POST succeeds

## REMOVED Requirements

### Requirement: Bookings remain event-scoped
**Reason:** Replaced by slot-scoped time and credits. Capacity and voucher inventory remain event-level.
**Migration:** Member checkout and `bookEvent` require a future `dateTime` that matches one `events.date_times` element. Credits use that occurrence’s `occurrence_credit_prices`. Confirm / ICS / email / ticket card read `bookings.date_time`. Waitlist join stays event-level; promotion omits `dateTime` and stores the next upcoming occurrence.
