## ADDED Requirements

### Requirement: Unpublished events are not bookable
`bookEvent` SHALL reject an unpublished event with the same not-found / not-bookable failure as a missing event (`EVENT_NOT_FOUND`). The transaction SHALL NOT write a booking or ledger row, decrement credits or capacity, or allocate redemption inventory. Existing `CONFIRMED` bookings SHALL remain. Idempotent retry of an already-created `(user_id, idempotency_key)` SHALL still return the original booking even if the event is later unpublished.

#### Scenario: Book unpublished fails
- **WHEN** a booking-eligible member posts a booking for an unpublished event
- **THEN** no booking or ledger row is written

#### Scenario: Existing confirmed booking survives unpublish
- **WHEN** a member already has a `CONFIRMED` booking
- **AND** the event is later unpublished
- **THEN** that booking row remains `CONFIRMED`
- **AND** a new booking for that event is rejected
