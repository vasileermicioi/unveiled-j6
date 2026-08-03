## MODIFIED Requirements

### Requirement: Public event detail for guests

The system SHALL allow unauthenticated users to view public event detail pages. The system SHALL NOT display membership credit price or event date/time on that page to guests (or other non–booking-eligible viewers). Booking-eligible members SHALL continue to see credit price and date/time needed to book. When date chrome is shown, DETAILS / summary date presentation SHALL list **all** event datetimes formatted in Europe/Berlin and SHALL emphasize the **next upcoming** datetime (denormalized primary `date_time`). Visibility SHALL be decided from the SSR session + membership eligibility used for booking CTAs (not a client-only hide). Structured data / Open Graph MAY still include a single `startDate` equal to the next upcoming datetime for crawlers.

#### Scenario: Guest public detail omits credits and date

- **WHEN** an unauthenticated user opens `/:locale/events/:id`
- **THEN** the page renders without credit cost and without date/time chrome
- **AND** the user can still see event identity content and an auth/unlock path toward booking

#### Scenario: Booking-eligible member sees credits and date

- **WHEN** a booking-eligible signed-in member opens the same event detail
- **THEN** credit cost and date/time remain visible

#### Scenario: Detail lists multiple datetimes

- **GIVEN** an upcoming event with two future datetimes
- **WHEN** a booking-eligible member opens `/events/:id`
- **THEN** both datetimes are visible in the detail date presentation
- **AND** the next upcoming datetime is emphasized

#### Scenario: Non-eligible signed-in viewer is gated like a guest

- **WHEN** a signed-in user who is not booking-eligible (for example `INACTIVE` / membership required, or `PAST_DUE`) opens public event detail
- **THEN** credit cost and date/time chrome are omitted
- **AND** membership or payment CTAs remain available as today

## ADDED Requirements

### Requirement: Compact discovery surfaces show next upcoming datetime

Event cards on Discover / member feed / saved surfaces and map marker popups SHALL display the event’s **next upcoming** datetime (denormalized `date_time`), formatted in Europe/Berlin for the active locale. They SHALL NOT show an arbitrary past slot when a later upcoming datetime exists. Map popups MAY continue to omit booking actions and SHALL link to public event detail.

#### Scenario: Event card shows next upcoming

- **WHEN** a multi-datetime event with one past and one future occurrence appears on a card surface
- **THEN** the card date line shows the future (next upcoming) datetime

#### Scenario: Map popup shows next upcoming

- **WHEN** a member opens a map marker popup for an upcoming multi-datetime event
- **THEN** the popup includes the next upcoming datetime
- **AND** a link to the public event detail remains available
