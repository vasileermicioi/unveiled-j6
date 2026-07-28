## MODIFIED Requirements

### Requirement: Admin event map geolocation with zoom
The admin event form SHALL provide a MapLibre GL JS + OpenStreetMap map **preview** of the event address geocode instead of free-text latitude, longitude, or map zoom fields. Address SHALL be the only admin-authored location input. When geocoding succeeds (partner prefill and/or address re-geocode), the system SHALL persist derived `lat` and `lng` on the event record for detail and member map display. The system SHALL NOT persist `map_zoom`. Geocode failure SHALL NOT block saving a valid address and MUST NOT invent default-center coordinates.

#### Scenario: Admin location via address geocode preview
- **WHEN** an ADMIN enters or prefills an address that geocodes successfully and submits a valid form
- **THEN** the event row stores the geocoded coordinates in `lat` and `lng`
- **AND** the form does not require admin-authored map zoom

#### Scenario: Edit restores map preview from derived coordinates
- **WHEN** an ADMIN opens edit for an event that has `lat` and `lng` set
- **THEN** the map preview initializes centered at those coordinates using a default zoom
- **AND** the marker is not offered as a drag-to-set authoring control

#### Scenario: Geocode failure saves address without invented coordinates
- **WHEN** an ADMIN saves a valid address that cannot be geocoded and no prior resolved coordinates apply
- **THEN** the event row stores the address
- **AND** `lat` and `lng` remain null (or unset)
- **AND** no `map_zoom` value is written
