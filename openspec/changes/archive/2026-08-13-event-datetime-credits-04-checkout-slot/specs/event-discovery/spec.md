## ADDED Requirements

### Requirement: Event detail checkout datetime dropdown
On public event detail, when the viewer is booking-eligible and the event has two or more future datetimes, the checkout card SHALL show a native select of those datetimes (Europe/Berlin, active locale). Changing the selection SHALL update the credits shown (unit and qty × unit) and the bookable max qty for that slot price. The book/login CTA SHALL include the selected instant as `dateTime` (ISO). Guests and other non–booking-eligible viewers SHALL NOT see the dropdown or credit totals (existing chrome). When only one future datetime exists, the checkout card SHALL NOT show the dropdown and SHALL use that slot’s credits. Compact EventCards and map popups SHALL continue to show the next upcoming datetime and denormalized `credit_price`. DETAILS MAY continue to list all datetimes.

#### Scenario: Dropdown changes credits
- **GIVEN** an upcoming event with a morning slot priced 1 and an evening slot priced 4
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open `/events/:id` and choose the evening datetime
- **THEN** the checkout total uses 4 credits per ticket

#### Scenario: Guest checkout omits slot picker
- **WHEN** a guest opens the same event
- **THEN** the checkout card does not show a datetime dropdown or credit totals

#### Scenario: Single future occurrence has no dropdown
- **WHEN** a booking-eligible member opens an event with exactly one future datetime
- **THEN** the checkout card does not show a datetime dropdown
- **AND** the credit total uses that future slot’s price
