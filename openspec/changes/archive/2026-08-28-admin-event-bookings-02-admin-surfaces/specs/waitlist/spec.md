## ADDED Requirements

### Requirement: Members are notified when event cancel-all closes the waitlist
After a successful event cancel-all commit, the system SHALL email each member whose WAITING waitlist entry was closed. The email SHALL state that the waitlist for that event is closed and SHALL NOT include a credit-return sentence. Complimentary vs paid booking language SHALL NOT appear. Email failure SHALL NOT roll back waitlist close or booking cancellation.

#### Scenario: Waitlist member receives waitlist-closed email
- **WHEN** an admin completes cancel-all for an event the member was WAITING on
- **THEN** the member receives an email that the waitlist is closed
- **AND** that email does not state that credits were returned
