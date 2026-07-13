## ADDED Requirements

### Requirement: Admin booking cancellation domain
The system SHALL allow an admin to cancel a `CONFIRMED` booking with a reason, set status `CANCELLED`, increase event remaining capacity by the ticket count, trigger waitlist processing for that event, and MUST NOT refund credits as part of cancellation.

#### Scenario: Cancel confirmed booking
- **WHEN** an admin cancels a confirmed booking
- **THEN** the booking is `CANCELLED`, capacity increases by the booking's ticket count, waitlist processing runs for that event, and credits are unchanged by the cancel itself

#### Scenario: Reject non-confirmed cancel
- **WHEN** an admin attempts to cancel a booking that is not `CONFIRMED`
- **THEN** the operation is rejected and capacity, credits, and booking status are unchanged
