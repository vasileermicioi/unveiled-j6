## ADDED Requirements

### Requirement: Admin booking cancel Playwright coverage
The system SHALL implement Playwright coverage for `booking.feature` scenarios `Admin cancels a confirmed booking` and `Cannot cancel a booking that is not confirmed` in `e2e/specs/booking.spec.ts` now that `/:locale/admin/bookings/:id/cancel` exists. Specs SHALL use verbatim Gherkin titles and proximity selectors, assert `CANCELLED` status and that credits are not refunded by cancel itself, and skip only for documented env prerequisites. Ladle SHALL include a cancel confirm story for `AdminCancelBookingPage`.

#### Scenario: Admin cancel booking is executable
- **WHEN** an ADMIN cancels a CONFIRMED booking with a reason via the cancel page in e2e
- **THEN** the booking becomes CANCELLED, capacity side effects are observable as the harness allows, member credits are unchanged by the cancel, and the test does not skip solely for missing UI

#### Scenario: Non-confirmed cancel rejection is executable
- **WHEN** an ADMIN attempts to cancel a non-CONFIRMED booking via the cancel page
- **THEN** cancellation is rejected (on-page error or unchanged status) without silent skip for missing UI

#### Scenario: Cancel booking Ladle story loads
- **WHEN** Ladle is started after this change
- **THEN** the admin cancel booking confirm story renders without runtime errors
