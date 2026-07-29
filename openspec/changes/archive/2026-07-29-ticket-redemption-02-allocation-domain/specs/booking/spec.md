## ADDED Requirements

### Requirement: Booking ticket redemption readers

The booking domain SHALL expose read helpers so list and by-id booking queries can include the related `booking_tickets` rows for a booking (ordered by ordinal). `listUserBookings` SHALL attach per-booking ticket redemptions for items on the current page. Call sites MAY ignore the tickets until member UI step 04 consumes them.

#### Scenario: List includes ticket redemptions

- **WHEN** `listUserBookings` returns a page that includes a multi-ticket booking
- **THEN** each list item includes that booking’s `booking_tickets` rows ordered by ordinal

#### Scenario: Load tickets by booking id

- **WHEN** a caller requests tickets for a known booking id via the exported helper
- **THEN** the helper returns the booking’s ticket rows ordered by ordinal (empty if none)

## MODIFIED Requirements

### Requirement: Atomic booking transaction

The system SHALL create purchase bookings only through a single Postgres transaction that locks the event row, verifies subscription eligibility and capacity and credits, allocates per-ticket redemption artifacts (`booking_tickets` plus voucher inventory when applicable), decrements capacity and credits, writes a `CONFIRMED` booking, and writes a negative `BOOKING` ledger entry (unless `skipCreditCharge`). The Booking domain SHALL be the only writer of purchase bookings and `BOOKING` ledger rows. Ticket count shape validation SHALL require an integer ≥ 1 and SHALL NOT impose a hard upper bound of 3; remaining capacity, credit balance, and (for voucher types) available inventory remain authoritative rejection reasons. Idempotent retry of the same `(user_id, idempotency_key)` SHALL return the original booking without re-allocating inventory or mutating credits/capacity.

#### Scenario: Successful booking

- **WHEN** an eligible member confirms a booking with sufficient capacity and credits
- **THEN** a confirmed booking is created, credits and capacity decrease, and a `BOOKING` ledger entry is recorded

#### Scenario: Booking fails — insufficient credits

- **WHEN** credits are insufficient for `creditPrice × ticket count`
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

For guests viewing the public event detail checkout affordance, the system SHALL allow selecting a ticket count from 1 through 3 (preview only; booking remains auth-gated). For signed-in members on detail and book surfaces, the maximum selectable ticket count SHALL be the minimum of (a) floor(available credits ÷ event creditPrice), (b) the event’s remaining capacity, and (c) when provided for voucher-type events, available voucher inventory count (with creditPrice ≤ 0 treated as capacity/inventory-only). The booking transaction SHALL accept any integer ticket count ≥ 1 that passes capacity, credit, and inventory checks and SHALL NOT reject solely because the count is greater than 3.

#### Scenario: Guest preview capped at three

- **WHEN** a guest views a bookable event detail page
- **THEN** the ticket quantity control does not exceed 3

#### Scenario: Member max follows credits and capacity

- **WHEN** a signed-in member with 17 credits views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the maximum selectable ticket count is 8

#### Scenario: Member max also respects voucher inventory

- **WHEN** a signed-in member views a `VOUCHER_PROMO` event with remaining capacity 10, enough credits for 8 tickets, and only 3 `AVAILABLE` promo codes
- **THEN** the maximum selectable ticket count is 3

#### Scenario: Booking succeeds above former hard cap

- **WHEN** an eligible member confirms a booking for 4 tickets and capacity and credits are sufficient
- **THEN** the booking is created and credits/capacity decrease accordingly

#### Scenario: Capacity still enforced

- **WHEN** the requested ticket count exceeds remaining capacity
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

### Requirement: Redemption info by ticket type

The system SHALL attach redemption info to each confirmed booking according to the event's ticket type. For `SECRET_CODE`, each `booking_tickets` row and the booking-level redemption summary SHALL use the event's admin-configured `secret_code` (no secret-code modes; codes are never auto-generated). For `VOUCHER_PROMO` and `VOUCHER_PDF`, the booking domain SHALL allocate one inventory asset per ticket inside the booking transaction, write `booking_tickets`, and denormalize ticket ordinal 1 onto booking-level `redemption_*` fields for backward-compatible readers. The domain MUST NOT invent redemption from a shared event-level `promo_code`. Insufficient inventory SHALL reject the booking without mutations.

#### Scenario: Manual secret code

- **WHEN** a booking is confirmed for `SECRET_CODE`
- **THEN** the booking stores the event's admin-configured secret code as redemption info
- **AND** each booking ticket stores that same secret code

#### Scenario: Voucher promo booking allocates inventory

- **WHEN** a booking is confirmed for `VOUCHER_PROMO` with sufficient `AVAILABLE` codes
- **THEN** booking tickets and allocated inventory rows are written in the same transaction
- **AND** booking-level redemption summary reflects ticket ordinal 1

#### Scenario: Voucher booking rejected when inventory is insufficient

- **WHEN** a booking is attempted for `VOUCHER_PROMO` or `VOUCHER_PDF` with fewer `AVAILABLE` inventory rows than the ticket count
- **THEN** the booking is rejected with a typed booking error and no credits, capacity, inventory, or ledger changes occur

### Requirement: Admin booking cancellation domain

The system SHALL allow an admin to cancel a `CONFIRMED` booking with a reason, set status `CANCELLED`, increase event remaining capacity by the ticket count, return any allocated voucher promo/PDF inventory for that booking to `AVAILABLE` (clearing allocation links), trigger waitlist processing for that event, and MUST NOT refund credits as part of cancellation.

#### Scenario: Cancel confirmed booking

- **WHEN** an admin cancels a confirmed booking
- **THEN** the booking is `CANCELLED`, capacity increases by the booking's ticket count, waitlist processing runs for that event, and credits are unchanged by the cancel itself

#### Scenario: Cancel restocks voucher inventory

- **WHEN** an admin cancels a confirmed booking that held allocated voucher inventory
- **THEN** those inventory rows become `AVAILABLE` again and are no longer linked to the booking’s tickets

#### Scenario: Reject non-confirmed cancel

- **WHEN** an admin attempts to cancel a booking that is not `CONFIRMED`
- **THEN** the operation is rejected and capacity, credits, inventory, and booking status are unchanged
