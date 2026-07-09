## ADDED Requirements

### Requirement: Filtered map view

The system SHALL provide an authenticated map view at `/:locale/events/map` using MapLibre GL JS and OpenStreetMap tiles (no map API key) that shows markers only for events matching the current feed filters (`category`, `partnerId`, `from`, `to` — same semantics as `listMemberFeedEvents`, including the today default when dates are omitted) and having non-null coordinates. The map SHALL load the full filtered set without feed page slicing, subject to a documented upper bound. Marker previews SHALL link to the public event detail page (`/:locale/events/:id`); booking POST from the popup is out of scope. Guests SHALL be redirected to sign in. The page SHALL be served with `noindex` robots metadata. Required OpenStreetMap attribution SHALL be visible when the map loads. Events missing `lat`/`lng` SHALL be omitted from markers (coordinates MUST NOT be invented).

#### Scenario: Map view mirrors the filtered feed

- **WHEN** a member has applied filters to the events feed and opens the map view
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

### Requirement: Map respects cookie consent

The system SHALL NOT load MapLibre GL JS or third-party OpenStreetMap tile requests when the user has declined non-essential cookies (or has no accepted consent decision). In that case it SHALL show a static fallback (address list and/or consent prompt) instead of the interactive map.

#### Scenario: Declining consent disables the map embed

- **WHEN** the user has declined non-essential cookies and views a page that would show the event map
- **THEN** the map embed is not loaded and a fallback is shown
- **AND** no OpenStreetMap tile requests are made

### Requirement: List and map navigation preserves filters

The system SHALL provide navigation between `/:locale/events` and `/:locale/events/map` that preserves the active filter query parameters (`category`, `partnerId`, `from`, `to`). Feed `page` MAY be omitted on the map link.

#### Scenario: Feed to map preserves filters

- **WHEN** a member on `/events` with active filters opens the map view link
- **THEN** `/events/map` is requested with the same filter query params

#### Scenario: Map to feed preserves filters

- **WHEN** a member on `/events/map` with active filters opens the list view link
- **THEN** `/events` is requested with the same filter query params
