## MODIFIED Requirements

### Requirement: Detail LOCATION shows address and optional map

The public event detail LOCATION section SHALL show the event's composed display `address` whenever the event has an address. When derived coordinates exist, the section SHALL also show the map with a pin marker (existing pin/popup behavior). When coordinates are missing, the composed address SHALL still be shown and the map MAY be omitted. The LOCATION section MUST NOT require coordinates in order to present the address. Public surfaces SHALL NOT require reading structured street/house columns separately when composed `address` is present.

#### Scenario: Detail LOCATION shows address with map

- **WHEN** a visitor opens a valid upcoming event detail URL with a composed address and coordinates
- **THEN** the LOCATION section shows the address text
- **AND** the map shows a recognizable pin marker

#### Scenario: Detail LOCATION shows address without coordinates

- **WHEN** a visitor opens a valid upcoming event detail URL that has a composed address but no coordinates
- **THEN** the LOCATION section shows the address text
- **AND** the page does not require a map to present the location

### Requirement: Public event location display

Event cards and public detail SHALL present the event's zip code in place of neighborhood/Kiez. Public detail LOCATION SHALL show the composed display `address` whenever present; map rules remain gated on lat/lng. Country/city MAY appear on detail for clarity but MUST NOT dominate cards while the product is Berlin-only. Public surfaces MUST NOT reintroduce Bezirk/neighborhood labels for event location metadata.

#### Scenario: Guest sees zip on event detail

- **WHEN** a guest opens a public event detail page
- **THEN** location metadata shows the event zip code (not neighborhood)

#### Scenario: Event card shows zip

- **WHEN** a guest or member views an event card in the feed or listing
- **THEN** the card shows the event zip code
- **AND** the card does not show a neighborhood/Kiez label

#### Scenario: Detail LOCATION uses composed address

- **WHEN** a guest opens a public event detail page for an event with a composed address
- **THEN** the LOCATION section shows that composed address text
