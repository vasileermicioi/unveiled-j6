## ADDED Requirements

### Requirement: Members are notified when event bookings are cancelled in bulk
After a successful event cancel-all commit, the system SHALL email each member whose CONFIRMED booking was cancelled. The email SHALL state that the ticket is void. When total_credits was greater than 0 it SHALL state that those credits were returned. Complimentary cancellations SHALL still be emailed without a credit-return sentence. Email failure SHALL NOT roll back the cancellation.

#### Scenario: Member receives cancel-all email
- **WHEN** an admin completes cancel-all for an event the member had a paid CONFIRMED booking on
- **THEN** the member receives an email that the ticket is void and credits were returned
