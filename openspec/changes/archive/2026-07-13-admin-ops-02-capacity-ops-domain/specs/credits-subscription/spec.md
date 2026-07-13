## ADDED Requirements

### Requirement: Comp ticket domain helper
The system SHALL create complimentary confirmed bookings for a member through the shared booking transaction with capacity checks and without charging credits or writing a charge ledger entry.

#### Scenario: Comp ticket
- **WHEN** an admin issues a comp ticket for a member and event
- **THEN** a confirmed booking is created with `skipCreditCharge` semantics (credits unchanged; no charge ledger row)
