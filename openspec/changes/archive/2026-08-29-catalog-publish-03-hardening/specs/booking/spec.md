## ADDED Requirements

### Requirement: Canonical booking Gherkin rejects unpublished events
`docs/product/features/booking.feature` SHALL add the titles below. Playwright `e2e/specs/booking.spec.ts` SHALL map 1:1. Booking an unpublished event SHALL fail as not found / not bookable (no booking or ledger row). An existing CONFIRMED booking SHALL remain after unpublish (no cancel, no refund). Direct `/:locale/events/:id/book` for a draft SHALL not leak a successful checkout. Env skips (`DATABASE_URL`, billing) MAY remain as named `test.skip` reasons. The system SHALL NOT add `@skip-no-ui` for these MVP scenarios.

#### Scenario: Book unpublished fails
- **WHEN** a booking-eligible member posts a booking for an unpublished event
- **THEN** no booking or ledger row is written
- **AND** they do not reach a booking confirmation

#### Scenario: Existing booking remains after unpublish
- **WHEN** a member already has a CONFIRMED booking
- **AND** an admin later unpublishes that event
- **THEN** the booking stays CONFIRMED on My Tickets
- **AND** a new booking for that event is rejected
