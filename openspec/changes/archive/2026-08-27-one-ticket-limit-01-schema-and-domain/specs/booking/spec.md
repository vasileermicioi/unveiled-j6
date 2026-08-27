## ADDED Requirements

### Requirement: One active booking per occurrence
The system SHALL allow at most one `CONFIRMED` or `USED` booking row per `(user_id, event_id, date_time)`. `date_time` is the booked occurrence instant. `CANCELLED` rows SHALL NOT participate in this uniqueness. A second purchase, waitlist promotion, or admin comp for an already-held active occurrence SHALL fail with `ALREADY_BOOKED` and SHALL NOT mutate credits, capacity, inventory, or ledger. A member MAY hold one ticket on each distinct occurrence of a multi-datetime event. New bookings SHALL persist `tickets_count = 1`. The system SHALL expose a read of the occurrence instants a member already holds as `CONFIRMED` or `USED` for a given event (for later checkout UI).

#### Scenario: Second ticket for the same hour is rejected
- **WHEN** a member already has a `CONFIRMED` booking for an event occurrence
- **AND** they submit another booking for that same occurrence
- **THEN** the system rejects with `ALREADY_BOOKED` and no credits, capacity, or ledger change

#### Scenario: Different hour on the same event is allowed
- **WHEN** a member has a `CONFIRMED` booking for a morning occurrence
- **AND** they book the evening occurrence of the same event
- **THEN** a second confirmed booking is created with `tickets_count = 1` and that evening `date_time`

#### Scenario: Cancelled hour can be booked again
- **WHEN** the member’s only booking for that occurrence is `CANCELLED`
- **THEN** a new confirmed booking for that occurrence is allowed

#### Scenario: Active booked instants are queryable
- **WHEN** a member has `CONFIRMED` or `USED` bookings for two hours of an event and a `CANCELLED` hour of the same event
- **THEN** listing that member’s active booked instants for the event returns only the `CONFIRMED` and `USED` `date_time` values

## MODIFIED Requirements

### Requirement: Atomic booking transaction
The system SHALL create purchase bookings only through a single Postgres transaction that locks the event row, verifies subscription eligibility and capacity and credits, allocates per-ticket redemption artifacts (`booking_tickets` plus voucher inventory when applicable), decrements capacity and credits, writes a `CONFIRMED` booking including `bookings.date_time`, and writes a negative `BOOKING` ledger entry (unless `skipCreditCharge`). Credits charged SHALL be the **selected occurrence** credit price × **1**. Ticket count validation SHALL require the integer `1` (not merely ≥ 1). The transaction SHALL reject a second active booking for the same user + event + resolved `date_time` (`ALREADY_BOOKED`). The Booking domain SHALL be the only writer of purchase bookings and `BOOKING` ledger rows. Remaining capacity, credit balance, and (for voucher types) available inventory remain authoritative rejection reasons alongside uniqueness and ticket-count validation. Idempotent retry of the same `(user_id, idempotency_key)` SHALL return the original booking without re-allocating inventory or mutating credits/capacity, and SHALL ignore a mismatched posted datetime. Idempotent retry SHALL run **before** the uniqueness check.

#### Scenario: Successful booking
- **WHEN** I confirm the booking for a selected future datetime I do not already hold
- **THEN** a confirmed booking is created with `tickets_count = 1` against the event and that datetime
- **AND** my credits are decremented by that slot’s creditPrice
- **AND** the event’s remaining capacity is decremented by 1

#### Scenario: Booking fails — insufficient credits
- **WHEN** credits are insufficient for the selected occurrence `creditPrice × 1`
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

#### Scenario: Idempotent retry
- **WHEN** the same `(user_id, idempotency_key)` is submitted again after success
- **THEN** no duplicate booking or credit/capacity change occurs and the original redemption info is returned
- **AND** voucher inventory is not allocated a second time

#### Scenario: Ticket quantity other than one is rejected
- **WHEN** a booking is requested with a ticket count other than 1
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

#### Scenario: Ticket quantity shape invalid
- **WHEN** a booking is requested with a non-integer ticket count or a count less than 1
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

#### Scenario: Ticket quantity above three still bookable
- **WHEN** an eligible member confirms a booking for more than 3 tickets
- **THEN** the booking is rejected with `INVALID_TICKET_COUNT` and no credits, capacity, or ledger changes occur

### Requirement: Ticket count selection bounds
The system SHALL NOT offer a ticket-quantity stepper or select on public event detail, `/events/:id/book`, waitlist join, or admin comp. Bookable quantity for a new write is exactly one ticket when the member can afford the selected occurrence price, remaining capacity is at least 1, and (for voucher types) at least one inventory item is available; otherwise the member cannot book. Guests continue to omit quantity and credit totals. Changing the selected future datetime SHALL recompute the one-ticket credit total from that slot’s price. The booking transaction SHALL reject any ticket count other than the integer `1`.

#### Scenario: Eligible checkout has no quantity stepper
- **WHEN** a booking-eligible member views a bookable event detail page
- **THEN** there is no control to increase ticket count above 1
- **AND** the credit total equals the selected occurrence price

#### Scenario: Guest preview capped at three
- **WHEN** a guest views a bookable event detail page
- **THEN** there is no ticket-quantity control (guests omit quantity; there is no preview cap of 3)

#### Scenario: Member max follows credits and capacity
- **WHEN** a signed-in member with 17 credits views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the bookable quantity is 1 (not 8)

#### Scenario: Member cannot book when they cannot afford one ticket
- **WHEN** a signed-in member with 1 credit views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the bookable quantity for that occurrence is 0

#### Scenario: Member max uses the selected slot price
- **WHEN** a signed-in member with 2 credits views an event with a 1-credit slot and a 3-credit slot, remaining capacity 10
- **THEN** the 1-credit slot is bookable (quantity 1)
- **AND** the 3-credit slot is not bookable (quantity 0)

#### Scenario: Member max also respects voucher inventory
- **WHEN** a signed-in member views a `VOUCHER_PROMO` event with remaining capacity 10, enough credits for the slot, and 0 `AVAILABLE` promo codes
- **THEN** the bookable quantity is 0

#### Scenario: Booking succeeds above former hard cap
- **WHEN** an eligible member confirms a booking for 4 tickets and capacity and credits are sufficient
- **THEN** the booking is rejected (`INVALID_TICKET_COUNT`) and credits/capacity are unchanged

#### Scenario: Capacity still enforced
- **WHEN** remaining capacity is 0
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

### Requirement: Member selects a datetime slot when booking
When an event has two or more future datetimes, a booking-eligible member SHALL select one future occurrence before confirming. The booking SHALL store that instant on `bookings.date_time`. Credits charged SHALL be that occurrence’s `occurrence_credit_prices` value × **1**. Capacity and voucher inventory checks SHALL remain at event level. The system SHALL reject a datetime that is not on the event or that is in the past (`UNKNOWN_SLOT` / `PAST_SLOT`) with no credits, capacity, inventory, or ledger changes. Confirm page time chrome, ICS `DTSTART`, booking ticket card datetime, and confirmation-email “when” fields SHALL use `bookings.date_time`. Waitlist promotion and admin complimentary tickets MAY omit `dateTime`; the booking domain SHALL then persist the next upcoming occurrence (or the denormalized primary when every occurrence is past). Idempotent retry of the same `(user_id, idempotency_key)` SHALL return the original booking and SHALL ignore a mismatched posted datetime. `docs/product/features/booking.feature` SHALL describe this slot selection (not event-scoped booking) and SHALL include a scenario titled `Book a priced datetime slot` (canonical Gherkin qty wording is updated in a later hardening step).

#### Scenario: Successful booking of a priced slot
- **WHEN** a member selects a future datetime priced 3 credits and books
- **THEN** a confirmed booking is stored with that `date_time` and `tickets_count = 1`
- **AND** 3 credits are deducted
- **AND** remaining capacity decreases by 1

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
- **AND** credits charged equal that occurrence’s price × 1

### Requirement: Detail page does not charge credits
The public event detail page SHALL NOT create bookings or ledger entries. Ticket-quantity steppers or selects SHALL NOT appear on detail. When a datetime slot is selected, the primary book or login CTA SHALL include that occurrence as a `dateTime` query param (ISO instant). A `qty` query, if present, SHALL be `1` or omitted. Credit deduction for purchases SHALL continue to occur only through the Booking domain on the dedicated `/:locale/events/:id/book` SSR form POST (or equivalent booking-domain writers such as waitlist promotion / admin comp — not from detail).

#### Scenario: Guest quantity does not book
- **WHEN** a guest views event detail
- **THEN** no ticket-quantity stepper or select is shown
- **AND** no booking row is created
- **AND** continuing requires authentication before any credit charge

#### Scenario: Eligible member quantity only deep-links
- **WHEN** an eligible member follows the primary book CTA from event detail
- **THEN** they navigate to `/:locale/events/:id/book` (optionally with a `dateTime` query and `qty=1` or no `qty`)
- **AND** no booking or ledger write occurs until the book page SSR POST succeeds

### Requirement: Booking quantity uses native select
Book, waitlist join, and admin comp SHALL NOT present a ticket-quantity stepper or select. Those forms SHALL persist quantity 1 (hidden field or omitted field with server default 1). Datetime choice, when two or more future occurrences exist, SHALL remain a native HTML `<select>`.

#### Scenario: Book page ticket count is a native select
- **WHEN** a booking-eligible member opens `/:locale/events/:id/book`
- **THEN** there is no ticket-quantity control (no native select and no stepper)
- **AND** submitting the form books exactly one ticket

#### Scenario: Waitlist join quantity matches book pattern
- **WHEN** a member opens the waitlist join form
- **THEN** there is no ticket-quantity control
- **AND** the created entry has `requested_qty = 1`
