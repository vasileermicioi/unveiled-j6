## ADDED Requirements

### Requirement: Detail LOCATION shows address and optional map
The public event detail LOCATION section SHALL show the event address whenever the event has an address. When derived coordinates exist, the section SHALL also show the map with a pin marker (existing pin/popup behavior). When coordinates are missing, the address SHALL still be shown and the map MAY be omitted. The LOCATION section MUST NOT require coordinates in order to present the address.

#### Scenario: Detail LOCATION shows address with map
- **WHEN** a visitor opens a valid upcoming event detail URL with an address and coordinates
- **THEN** the LOCATION section shows the address text
- **AND** the map shows a recognizable pin marker

#### Scenario: Detail LOCATION shows address without coordinates
- **WHEN** a visitor opens a valid upcoming event detail URL that has an address but no coordinates
- **THEN** the LOCATION section shows the address text
- **AND** the page does not require a map to present the location

## MODIFIED Requirements

### Requirement: Public event detail layout
The public event detail page SHALL present a checkout-focused layout without requiring authentication. On large viewports it SHALL use two primary rows: (1) title and location on the left with the summary/checkout card on the right; (2) the primary event image on the left with the Markdown description on the right. Below those rows, DETAILS metadata, LOCATION (address whenever present, with map when coordinates exist), and optional gallery behavior remain available. Booking, waitlist, and save mutations remain on authenticated routes; the detail page SHALL NOT create bookings or ledger entries.

#### Scenario: Guest can view public event detail without authentication
- **WHEN** a guest opens a valid upcoming event detail URL ("/events/:id")
- **THEN** the page renders checkout-focused event content (title/location + summary card, then image + description) without requiring login
- **AND** the summary card shows a login (or unlock) CTA without ticket quantity, credit cost, or date chrome
- **AND** DETAILS shows scannable metadata fields without date/time chrome (dense multi-column layout on md+)
- **AND** booking, waitlist, and save mutations remain on authenticated routes
- **AND** the detail page does not create bookings or ledger entries

#### Scenario: Large viewport uses two primary rows
- **WHEN** a guest or member views public event detail on a large viewport
- **THEN** row 1 places title and location beside the checkout/summary card
- **AND** row 2 places the primary event image beside the Markdown description
- **AND** DETAILS, LOCATION (address when present; map when coordinates exist), and gallery remain below those rows
