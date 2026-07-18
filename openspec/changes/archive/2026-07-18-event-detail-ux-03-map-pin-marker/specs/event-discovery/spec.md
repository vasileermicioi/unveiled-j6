## ADDED Requirements

### Requirement: Map markers use a recognizable pin

MapLibre event markers (member map and public event detail LOCATION map) SHALL render a recognizable location-pin icon using brand colors (dark fill / yellow accent), not a plain black rectangle or square. The pin tip SHALL mark the event’s lat/lng. Required OpenStreetMap attribution and cookie-consent gating remain unchanged.

#### Scenario: Detail map shows a pin icon

- **WHEN** a user views an event detail LOCATION map with valid coordinates and accepted cookie consent
- **THEN** the marker appears as a pin icon (not a solid black square)

#### Scenario: Member map uses the same pin treatment

- **WHEN** a signed-in member opens `/:locale/events/map` with matching filtered events that have coordinates
- **THEN** markers use the same pin icon treatment as the detail map
