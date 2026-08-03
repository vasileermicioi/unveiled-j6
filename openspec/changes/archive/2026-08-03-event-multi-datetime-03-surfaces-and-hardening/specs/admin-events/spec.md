## ADDED Requirements

### Requirement: Admin event lists show next upcoming datetime

Admin Events catalog and Featured tables (and related add-result rows that show an event datetime) SHALL display the event’s **next upcoming** datetime (denormalized primary `date_time`) formatted in Europe/Berlin for the admin locale. When an event has more than one datetime, the cell MAY append a simple `+N` count of additional datetimes. The list SHALL NOT invent a past slot as the primary display when a later upcoming datetime exists.

#### Scenario: Catalog list shows primary next datetime

- **WHEN** an admin views `/admin/events` for an event with multiple datetimes including a future occurrence
- **THEN** the date column shows the next upcoming datetime

#### Scenario: Multiple datetimes indicated simply

- **WHEN** an admin views a list row for an event with three datetimes
- **THEN** the date presentation shows the primary/next datetime
- **AND** optionally indicates two additional datetimes (e.g. `+2`)

### Requirement: Multi-datetime admin and discovery e2e coverage

BDD/Playwright SHALL cover admin add/remove datetime smoke on create or edit and SHALL keep discovery assertions that fully past multi-datetime events stay out of the default upcoming feed. Selectors SHALL remain proximity/layout only. Product feature files (`admin-events`, `event-discovery`, booking as needed), schema overview, ui-component-map, and gaps-and-decisions SHALL document event-level booking plus multi-datetime display rules.

#### Scenario: Admin multi-datetime smoke

- **WHEN** an admin creates or edits an event with two datetime rows via the SSR form
- **THEN** Playwright can assert both values persist (edit re-open or equivalent proximity assertion)

#### Scenario: Discovery excludes fully past multi-datetime events

- **WHEN** every datetime on an event is in the past
- **THEN** the member feed does not list that event
