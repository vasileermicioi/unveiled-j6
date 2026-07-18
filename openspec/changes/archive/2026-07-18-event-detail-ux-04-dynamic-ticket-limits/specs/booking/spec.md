## ADDED Requirements

### Requirement: Ticket count selection bounds
For guests viewing the public event detail checkout affordance, the system SHALL allow selecting a ticket count from 1 through 3 (preview only; booking remains auth-gated). For signed-in members on detail and book surfaces, the maximum selectable ticket count SHALL be the minimum of (a) floor(available credits ÷ event creditPrice) and (b) the event’s remaining capacity (with creditPrice ≤ 0 treated as capacity-only). The booking transaction SHALL accept any integer ticket count ≥ 1 that passes capacity and credit checks and SHALL NOT reject solely because the count is greater than 3.

#### Scenario: Guest preview capped at three
- **WHEN** a guest views a bookable event detail page
- **THEN** the ticket quantity control does not exceed 3

#### Scenario: Member max follows credits and capacity
- **WHEN** a signed-in member with 17 credits views a bookable event priced at 2 credits with remaining capacity 10
- **THEN** the maximum selectable ticket count is 8

#### Scenario: Booking succeeds above former hard cap
- **WHEN** an eligible member confirms a booking for 4 tickets and capacity and credits are sufficient
- **THEN** the booking is created and credits/capacity decrease accordingly

#### Scenario: Capacity still enforced
- **WHEN** the requested ticket count exceeds remaining capacity
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

## MODIFIED Requirements

### Requirement: Atomic booking transaction
The system SHALL create purchase bookings only through a single Postgres transaction that locks the event row, verifies subscription eligibility and capacity and credits, decrements capacity and credits, writes a `CONFIRMED` booking, and writes a negative `BOOKING` ledger entry (unless `skipCreditCharge`). The Booking domain SHALL be the only writer of purchase bookings and `BOOKING` ledger rows. Ticket count shape validation SHALL require an integer ≥ 1 and SHALL NOT impose a hard upper bound of 3; remaining capacity and credit balance remain authoritative rejection reasons.

#### Scenario: Successful booking
- **WHEN** an eligible member confirms a booking with sufficient capacity and credits
- **THEN** a confirmed booking is created, credits and capacity decrease, and a `BOOKING` ledger entry is recorded

#### Scenario: Booking fails — insufficient credits
- **WHEN** credits are insufficient for `creditPrice × ticket count`
- **THEN** the booking is rejected and no credits, capacity, or ledger changes occur

#### Scenario: Idempotent retry
- **WHEN** the same `(user_id, idempotency_key)` is submitted again after success
- **THEN** no duplicate booking or credit/capacity change occurs and the original redemption info is returned

#### Scenario: Ticket quantity shape invalid
- **WHEN** a booking is requested with a non-integer ticket count or a count less than 1
- **THEN** the booking is rejected without mutating credits, capacity, or ledger

#### Scenario: Ticket quantity above three still bookable
- **WHEN** an eligible member confirms a booking for more than 3 tickets and capacity and credits are sufficient
- **THEN** a confirmed booking is created and credits and capacity decrease accordingly
