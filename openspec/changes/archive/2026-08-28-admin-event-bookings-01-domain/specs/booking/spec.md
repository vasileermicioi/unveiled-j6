## ADDED Requirements

### Requirement: Admin cancel-all bookings for an event
The system SHALL provide an ADMIN-only use case that cancels every CONFIRMED booking for a given event in a single transaction. For each such booking the system SHALL set status to CANCELLED with a required reason and cancelled_at, return allocated VOUCHER_PROMO and VOUCHER_PDF inventory to AVAILABLE, and clear live redemption payloads on booking_tickets. For each cancelled booking with total_credits greater than 0 the system SHALL increment that member's credit balance by total_credits and write a REFUND ledger row with idempotency key event-cancel-all:{bookingId}. Comp bookings (total_credits = 0) SHALL be cancelled and restocked without a ledger row. USED bookings SHALL be left unchanged. Remaining capacity SHALL increase by the sum of cancelled tickets_count only. The use case SHALL NOT run waitlist promotion. A second invocation with no remaining CONFIRMED bookings SHALL succeed as a no-op.

#### Scenario: Admin cancels all confirmed bookings for an event
- **WHEN** an admin cancels all confirmed bookings for an event with a non-empty reason
- **THEN** every previously CONFIRMED booking for that event is CANCELLED with that reason
- **AND** charged credits (each booking's total_credits) are returned to the corresponding members
- **AND** a REFUND ledger entry exists per refunded booking
- **AND** allocated voucher codes and PDF inventory for those bookings are AVAILABLE again
- **AND** remaining capacity increases by the cancelled ticket count
- **AND** waitlist promotion does not run

#### Scenario: Cancel-all refunds paid tickets but not comps
- **WHEN** the event has a paid CONFIRMED booking and a complimentary CONFIRMED booking
- **THEN** the paid member's credits increase by that booking's total_credits
- **AND** the comp member's credits are unchanged
- **AND** both bookings become CANCELLED

#### Scenario: Cancel-all leaves USED bookings in place
- **WHEN** the event has a USED booking and a CONFIRMED booking
- **THEN** only the CONFIRMED booking is cancelled and refunded
- **AND** the USED booking is unchanged

#### Scenario: Cancel-all is idempotent when nothing is confirmed
- **WHEN** an admin runs cancel-all on an event with no CONFIRMED bookings
- **THEN** the operation succeeds without credit, inventory, or capacity changes

#### Scenario: Cancel-all requires a reason
- **WHEN** an admin submits cancel-all with a blank reason
- **THEN** the operation is rejected and no bookings change

## MODIFIED Requirements

### Requirement: Admin booking cancellation domain
The system SHALL allow an admin to cancel a `CONFIRMED` booking with a reason, set status `CANCELLED`, increase event remaining capacity by the ticket count, return any allocated voucher promo/PDF inventory for that booking to `AVAILABLE` (clearing allocation links), trigger waitlist processing for that event, and MUST NOT refund credits as part of cancellation. That single-booking path SHALL remain distinct from event-level cancel-all (which refunds credits and MUST NOT promote the waitlist).

#### Scenario: Cancel confirmed booking
- **WHEN** an admin cancels a confirmed booking
- **THEN** the booking is `CANCELLED`, capacity increases by the booking's ticket count, waitlist processing runs for that event, and credits are unchanged by the cancel itself

#### Scenario: Cancel restocks voucher inventory
- **WHEN** an admin cancels a confirmed booking that held allocated voucher inventory
- **THEN** those inventory rows become `AVAILABLE` again and are no longer linked to the booking’s tickets

#### Scenario: Reject non-confirmed cancel
- **WHEN** an admin attempts to cancel a booking that is not `CONFIRMED`
- **THEN** the operation is rejected and capacity, credits, inventory, and booking status are unchanged

#### Scenario: Admin cancels a confirmed booking
- **WHEN** an admin cancels one CONFIRMED booking with a reason
- **THEN** the booking becomes CANCELLED
- **AND** remaining capacity increases by that booking's ticket count
- **AND** no credits are refunded as part of that single cancellation
- **AND** allocated voucher inventory returns to AVAILABLE
- **AND** waitlist processing is triggered for that event
