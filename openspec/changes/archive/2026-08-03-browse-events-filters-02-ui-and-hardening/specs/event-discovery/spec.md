## MODIFIED Requirements

### Requirement: Authenticated events feed page

The system SHALL serve `/:locale/events` as a fully server-rendered page for signed-in `USER` members with a booking-eligible subscription (`ACTIVE` or `CANCELLED_PENDING`), driven by GET query parameters `title`, `category`, `partnerId`, `from`, `to`, and `page`, with no client-side filter store required to reproduce the view. Guests SHALL be redirected to sign in. Signed-in `USER` members without a booking-eligible subscription SHALL be redirected to `/:locale/discover` and SHALL NOT receive the full feed (subscription-banner-while-listing is not the primary gate). The page SHALL render a GET filter form (including event name, category, partner, and date range), pagination that preserves active query params with a "Showing X–Y of Z" summary, and an empty/no-results state when filters match nothing. The feed page SHALL be served with `noindex` robots metadata. Date inputs on the filter form SHALL set `min` to the Europe/Berlin calendar date of request time (YYYY-MM-DD); server-side clamp remains authoritative.

#### Scenario: Guest is redirected

- **WHEN** an unauthenticated user requests `/events`
- **THEN** they are redirected to sign in with a return URL that can restore the feed after login

#### Scenario: Non-active member is redirected to Discover

- **WHEN** a signed-in USER whose subscription is not booking-eligible requests `/events`
- **THEN** they are redirected to `/:locale/discover`

#### Scenario: Default feed shows all upcoming events

- **WHEN** a booking-eligible USER views `/events` with no date filters
- **THEN** only events with start time in the future (`date_time >= now`) are shown
- **AND** events are ordered soonest first

#### Scenario: Filters and reset

- **WHEN** the member applies event name, category, partner, or date-range filters via the GET form
- **THEN** the feed shows only matching events
- **AND WHEN** they reset filters
- **THEN** the feed returns to the default all-upcoming scope with title, category, partner, and date params cleared

#### Scenario: No results

- **WHEN** applied filters match no events
- **THEN** the page shows an empty/no-results state

#### Scenario: Pagination preserves filters

- **WHEN** the member navigates to another page of results while filters are active
- **THEN** pagination links preserve `title`, `category`, `partnerId`, `from`, and `to`
- **AND** the page shows a "Showing X–Y of Z" summary for the current page

#### Scenario: Feed is not indexed

- **WHEN** a crawler or browser loads `/events`
- **THEN** the response includes robots metadata instructing not to index the page

#### Scenario: Date inputs advertise Berlin today as minimum

- **WHEN** a booking-eligible member views the events feed filter form
- **THEN** the `from` and `to` date controls expose `min` equal to Europe/Berlin today (YYYY-MM-DD)

### Requirement: Filtered map view

The system SHALL provide an authenticated map view at `/:locale/events/map` using MapLibre GL JS and OpenStreetMap tiles (no map API key) that shows markers only for events matching the current feed filters (`title`, `category`, `partnerId`, `from`, `to` — same semantics as `listMemberFeedEvents`, including all-upcoming default when dates are omitted and future-only / Berlin today floor when a range is applied) and having non-null coordinates. The map SHALL load the full filtered set without feed page slicing, subject to a documented upper bound. Marker previews SHALL link to the public event detail page (`/:locale/events/:id`); booking POST from the popup is out of scope. Guests SHALL be redirected to sign in. The page SHALL be served with `noindex` robots metadata. Required OpenStreetMap attribution SHALL be visible when the map loads. Events missing `lat`/`lng` SHALL be omitted from markers (coordinates MUST NOT be invented). The map page SHALL render the same GET filter form contract as the list (including event name and date `min`).

#### Scenario: Map view mirrors the filtered feed

- **WHEN** a member has applied filters (including event name when set) to the events feed and opens the map view
- **THEN** the map shows markers only for the currently filtered events that have coordinates
- **AND** selecting a marker opens a preview with a link to the event detail page

#### Scenario: Guest is redirected from map

- **WHEN** an unauthenticated user requests `/events/map`
- **THEN** they are redirected to sign in with a return URL that can restore the map (including filter query) after login

#### Scenario: Map ignores feed pagination

- **WHEN** a member opens `/events/map` with the same filters as a multi-page feed
- **THEN** markers reflect the full filtered set (up to the documented cap), not only the current feed page

#### Scenario: Events without coordinates are omitted

- **WHEN** a filtered event has no `lat` or `lng`
- **THEN** that event does not appear as a map marker

#### Scenario: Map is not indexed

- **WHEN** a crawler or browser loads `/events/map`
- **THEN** the response includes robots metadata instructing not to index the page

#### Scenario: OSM attribution is visible

- **WHEN** the map has loaded with consent accepted
- **THEN** OpenStreetMap attribution is visible on the page

### Requirement: List and map navigation preserves filters

The system SHALL provide navigation between `/:locale/events` and `/:locale/events/map` that preserves the active filter query parameters (`title`, `category`, `partnerId`, `from`, `to`). Feed `page` MAY be omitted on the map link.

#### Scenario: Feed to map preserves filters

- **WHEN** a member on `/events` with active filters opens the map view link
- **THEN** `/events/map` is requested with the same filter query params

#### Scenario: Map to feed preserves filters

- **WHEN** a member on `/events/map` with active filters opens the list view link
- **THEN** `/events` is requested with the same filter query params

### Requirement: Event feed URL query includes title

`parseEventFeedQuery`, `buildEventFeedQueryString`, and `eventFeedPageRedirectPath` SHALL support an optional `title` query parameter (trimmed; empty omitted). Member feed and map routes SHALL pass parsed `title` into the discovery list helpers. The Browse events filter UI SHALL expose a control that submits `title` via GET so members can set the param without hand-editing the URL.

#### Scenario: Parse and build title

- **WHEN** the events URL includes a non-empty `title` search param
- **THEN** `parseEventFeedQuery` returns that trimmed value
- **AND** `buildEventFeedQueryString` / page redirect helpers preserve `title` alongside other filters

#### Scenario: Empty title is omitted

- **WHEN** `title` is missing or whitespace-only
- **THEN** the parsed query omits `title` and the built query string does not include a `title` param

#### Scenario: Filter form submits title

- **WHEN** a booking-eligible member enters an event name in the feed filters and applies
- **THEN** the resulting URL includes a `title` query param
- **AND** the feed shows only matching events

## ADDED Requirements

### Requirement: Event name control on Browse events

The Browse events filter form on `/:locale/events` and `/:locale/events/map` SHALL include an event name text field submitted as `title` via GET, alongside partner and date range controls (category remains).

#### Scenario: Event name filter control

- **GIVEN** a booking-eligible member is viewing the events feed filters
- **WHEN** they view the filter form
- **THEN** they see an event name field alongside partner and date range controls
