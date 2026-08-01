## ADDED Requirements

### Requirement: Public event location display
Event cards and public detail SHALL present the event's zip code in place of neighborhood/Kiez. Address and map rules are unchanged. Country/city MAY appear on detail for clarity but MUST NOT dominate cards while the product is Berlin-only. Public surfaces MUST NOT reintroduce Bezirk/neighborhood labels for event location metadata.

#### Scenario: Guest sees zip on event detail
- **WHEN** a guest opens a public event detail page
- **THEN** location metadata shows the event zip code (not neighborhood)

#### Scenario: Event card shows zip
- **WHEN** a guest or member views an event card in the feed or listing
- **THEN** the card shows the event zip code
- **AND** the card does not show a neighborhood/Kiez label
