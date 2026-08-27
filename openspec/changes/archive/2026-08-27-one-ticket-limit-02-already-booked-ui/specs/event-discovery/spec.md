## MODIFIED Requirements

### Requirement: Event detail checkout datetime dropdown
On public event detail, when the viewer is booking-eligible and the event has two or more future datetimes, the checkout card SHALL show a native select of those datetimes (Europe/Berlin, active locale). Changing the selection SHALL update the one-ticket credit total from that slot’s price. The book CTA SHALL include the selected instant as `dateTime` (ISO) when that hour is not already held. When the selected hour is already held as `CONFIRMED` or `USED`, the checkout card SHALL show the already-booked message and My Tickets link instead of a book CTA (and instead of a waitlist CTA), while keeping the datetime select so another unbooked hour can restore the book CTA. Guests and other non–booking-eligible viewers SHALL NOT see the dropdown, quantity controls, or credit totals (existing chrome). When only one future datetime exists, the checkout card SHALL NOT show the dropdown and SHALL use that slot’s credits — or the already-booked message if that sole hour is already held. Compact EventCards and map popups SHALL continue to show the next upcoming datetime and denormalized `credit_price`. DETAILS MAY continue to list all datetimes. Ticket-quantity steppers SHALL NOT appear. `docs/product/features/event-discovery.feature` SHALL include scenarios titled `Dropdown changes credits` and `Guest checkout omits slot picker` (canonical Gherkin already-booked titles land in a later hardening step).

#### Scenario: Dropdown changes credits
- **GIVEN** an upcoming event with a morning slot priced 1 and an evening slot priced 4
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open `/events/:id` and choose the evening datetime
- **THEN** the checkout total uses 4 credits for one ticket

#### Scenario: Guest checkout omits slot picker
- **WHEN** a guest opens the same event
- **THEN** the checkout card does not show a datetime dropdown or credit totals

#### Scenario: Single future occurrence has no dropdown
- **WHEN** a booking-eligible member opens an event with exactly one future datetime they have not booked
- **THEN** the checkout card does not show a datetime dropdown
- **AND** the credit total uses that future slot’s price

#### Scenario: Booking-eligible member sees credits and date on event detail
- **WHEN** I am signed in as a booking-eligible member
- **AND** I open a valid upcoming event detail URL I have not booked
- **THEN** the summary card shows the credit total for one ticket (no quantity stepper)

#### Scenario: Already booked hour replaces book CTA
- **WHEN** I am signed in as a booking-eligible member
- **AND** I open an upcoming event whose selected occurrence I already booked
- **THEN** the summary card shows the already-booked message and My Tickets link instead of a book CTA
