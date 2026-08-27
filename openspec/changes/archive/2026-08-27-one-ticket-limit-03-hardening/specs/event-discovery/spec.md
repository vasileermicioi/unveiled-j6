## ADDED Requirements

### Requirement: Discovery e2e tracks checkout without quantity
`docs/product/features/event-discovery.feature` and `e2e/specs/event-discovery.spec.ts` SHALL assert credit total for one ticket and MUST NOT require an “increase tickets” control. The already-booked hour scenario SHALL be covered in booking e2e (detail is the same checkout card), with verbatim Gherkin titles in `booking.feature`. `event-discovery.feature` SHALL own “no quantity stepper on eligible checkout” via the scenario titled `Booking-eligible member sees credits and date on event detail`. Playwright SHALL use that title verbatim. Coverage-matrix SHALL map it (`pass` when `DATABASE_URL` is set).

#### Scenario: Booking-eligible member sees credits and date on event detail
- **WHEN** I am signed in as a booking-eligible member
- **AND** I open a valid upcoming event detail URL I have not booked
- **THEN** the summary card shows the credit total for one ticket (no quantity stepper)

#### Scenario: Discovery specs have no increase-tickets control
- **WHEN** an implementer greps `e2e/specs/event-discovery.spec.ts` and `event-discovery.feature`
- **THEN** there is no remaining “increase tickets” / guest cap of 3 requirement
- **AND** guest checkout still omits quantity and credit totals

## MODIFIED Requirements

### Requirement: Event detail checkout datetime dropdown
On public event detail, when the viewer is booking-eligible and the event has two or more future datetimes, the checkout card SHALL show a native select of those datetimes (Europe/Berlin, active locale). Changing the selection SHALL update the one-ticket credit total from that slot’s price. The book CTA SHALL include the selected instant as `dateTime` (ISO) when that hour is not already held. When the selected hour is already held as `CONFIRMED` or `USED`, the checkout card SHALL show the already-booked message and My Tickets link instead of a book CTA (and instead of a waitlist CTA), while keeping the datetime select so another unbooked hour can restore the book CTA. Guests and other non–booking-eligible viewers SHALL NOT see the dropdown, quantity controls, or credit totals (existing chrome). When only one future datetime exists, the checkout card SHALL NOT show the dropdown and SHALL use that slot’s credits — or the already-booked message if that sole hour is already held. Compact EventCards and map popups SHALL continue to show the next upcoming datetime and denormalized `credit_price`. DETAILS MAY continue to list all datetimes. Ticket-quantity steppers SHALL NOT appear. `docs/product/features/event-discovery.feature` SHALL include scenarios titled `Dropdown changes credits`, `Guest checkout omits slot picker`, and `Booking-eligible member sees credits and date on event detail`. Canonical already-booked Gherkin titles SHALL live in `docs/product/features/booking.feature` (not a second copy here).

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
- **AND** Playwright coverage for that behavior lives under `booking.feature` titles

### Requirement: Discovery feature documents checkout dropdown
`docs/product/features/event-discovery.feature` SHALL include a booking-eligible checkout dropdown scenario and SHALL keep guest omit-credits behavior. Compact cards SHALL continue to show next upcoming datetime and denormalized `credit_price` (no price range). Playwright in `e2e/specs/event-discovery.spec.ts` SHALL include tests titled exactly `Scenario: Dropdown changes credits`, `Scenario: Guest checkout omits slot picker`, and `Scenario: Booking-eligible member sees credits and date on event detail`. The checkout datetime control SHALL be a native `<select>` asserted with `getByLabel` (`Datum und Uhrzeit` / `Date and time`). Guests SHALL NOT see the dropdown or credit totals. Eligible checkout SHALL NOT assert an “increase tickets” control. `docs/product/ui/ui-component-map.md` Event detail entry SHALL mention the eligible-member datetime select, one-ticket credit total, and already-booked overlay (no qty stepper). DETAILS MAY continue to list all datetimes in a separate scenario.

#### Scenario: Coverage traces checkout dropdown
- **WHEN** the coverage matrix is updated for this feature
- **THEN** it includes a row for the dropdown changing displayed credits (pass or explicit environment skip)
- **AND** it includes a row for guest checkout omitting the slot picker
- **AND** it includes a row for eligible checkout credits without a quantity stepper
- **AND** none of those rows uses `@skip-no-ui`

#### Scenario: Dropdown changes credits
- **GIVEN** an upcoming event with a morning slot priced 1 and an evening slot priced 4
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open `/events/:id` and choose the evening datetime
- **THEN** the checkout total uses 4 credits for one ticket

#### Scenario: Guest checkout omits slot picker
- **WHEN** a guest opens the same event
- **THEN** the checkout card does not show a datetime dropdown or credit totals
