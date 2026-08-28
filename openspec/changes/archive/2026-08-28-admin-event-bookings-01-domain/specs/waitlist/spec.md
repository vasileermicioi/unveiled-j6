## ADDED Requirements

### Requirement: Event cancel-all closes the waitlist
When an admin cancels all confirmed bookings for an event, the system SHALL set every WAITING waitlist entry for that event to CANCELLED in the same transaction and SHALL NOT attempt automatic or manual promotion as a side effect of that operation. PROMOTED entries SHALL remain PROMOTED.

#### Scenario: Cancel-all does not promote the waitlist
- **WHEN** an event is sold out, members are WAITING, and an admin cancels all confirmed bookings
- **THEN** those WAITING entries become CANCELLED
- **AND** no waitlist entry becomes PROMOTED as a result of cancel-all
- **AND** restored capacity is not consumed by promotion
