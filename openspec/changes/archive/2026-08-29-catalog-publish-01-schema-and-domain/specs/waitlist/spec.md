## ADDED Requirements

### Requirement: Unpublished events are not waitlistable
`joinWaitlist` SHALL reject an unpublished event with the same not-found failure as a missing event (`EVENT_NOT_FOUND`) and SHALL NOT create a waitlist row. Existing `WAITING` entries SHALL remain if the event is later unpublished. Promotion SHALL call `bookEvent` and therefore SHALL NOT create a booking for an unpublished event.

#### Scenario: Join unpublished fails
- **WHEN** a member joins the waitlist for an unpublished event
- **THEN** no waitlist row is written

#### Scenario: Existing waiting entry survives unpublish
- **WHEN** a member already has a `WAITING` entry
- **AND** the event is later unpublished
- **THEN** that waitlist row remains
- **AND** a new join for that event is rejected
