## ADDED Requirements

### Requirement: Address is the only admin location input
Admin event create, edit, and series forms SHALL collect location via the address field only. The system SHALL NOT present latitude, longitude, or map zoom as admin-editable fields. A map MAY be shown to preview a geocode of the address (including partner-prefill geocode on create/series). The map preview marker SHALL NOT be draggable and SHALL NOT treat map click or zoom as the source of truth for coordinates. Geocode failure SHALL NOT block saving a valid address; the map preview MAY remain at a prior or default view. Derived `lat`/`lng` MAY be posted from the geocode preview as hidden fields when a geocode (or preserved existing coordinates on edit) is resolved; the system MUST NOT persist default map-center coordinates as if they were a successful geocode.

#### Scenario: Add event prefills address and map from partner
- **WHEN** an admin is on the new-event (or series-create) form and selects a partner
- **THEN** the address field is set to that partner's address
- **AND** the map preview updates to a geocode of that address when geocoding succeeds

#### Scenario: Edit event keeps existing address when partner changes
- **WHEN** an admin is on the edit-event form and changes the partner
- **THEN** the existing address remains unchanged until edited manually
- **AND** the map preview follows the current address geocode rules (not a silent partner overwrite)

#### Scenario: Geocode soft-fails leave address filled
- **WHEN** an admin selects a partner whose address cannot be geocoded
- **THEN** the address field is still set
- **AND** saving the event with that address succeeds
- **AND** the map preview may stay unchanged
- **AND** the saved event MUST NOT store invented default-center coordinates for that failed geocode

#### Scenario: No admin lat lng or zoom controls
- **WHEN** an admin opens create, edit, or series-create event
- **THEN** no latitude, longitude, or map zoom number fields are shown
- **AND** the map marker is not offered as a drag-to-set authoring control

## MODIFIED Requirements

### Requirement: Partner location prefill on add only
When creating a single event or an event series, changing the partner control SHALL prefill the event address from that partner's stored address and SHALL attempt to update the map **preview** from a geocode of that address. When editing an existing event, changing the partner control SHALL NOT overwrite the event address. Map coordinates on edit SHALL follow address-geocode rules and MUST NOT be silently replaced from the newly selected partner's address.

#### Scenario: Add event prefills address and map from partner
- **WHEN** an admin on the new-event (or series-create) form selects a partner from the dropdown
- **THEN** the address field is set to that partner's address
- **AND** the map preview updates to a geocode of that address when geocoding succeeds

#### Scenario: Edit event keeps existing location when partner changes
- **WHEN** an admin on the edit-event form changes the partner
- **THEN** the existing address remains unchanged until the admin edits it manually
- **AND** the map preview is not silently overwritten from the new partner's address

#### Scenario: Geocode soft-fails leave address filled
- **WHEN** an admin on the new-event form selects a partner whose address cannot be geocoded
- **THEN** the address field is still set to that partner's address
- **AND** the map preview is left unchanged (or at its prior default)
- **AND** saving the event with that address succeeds

## REMOVED Requirements

### Requirement: Admin-authored map zoom / manual coordinate entry
**Reason**: Product makes address the only admin location input; `map_zoom` authoring is removed and the column is dropped; lat/lng are system-derived from geocode for map display only.
**Migration**: Use address field + geocode preview; persist derived `lat`/`lng` when geocode succeeds; drop `events.map_zoom`.
