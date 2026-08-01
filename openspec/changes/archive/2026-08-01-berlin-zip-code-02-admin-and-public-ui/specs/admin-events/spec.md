## ADDED Requirements

### Requirement: Admin event location authoring
Admin create/edit (and series shared base fields while series exists) SHALL collect a postal code (`zip_code` / form field `zipCode`) instead of neighborhood/Kiez, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The zip control SHALL be a native text input validated via the shared postal registry for `(DE, berlin)`. Address + geocode preview behavior is unchanged. The form SHALL NOT ship a city/country picker.

#### Scenario: Admin sets Berlin zip on create
- **WHEN** an admin creates an event with a valid Berlin PLZ and other required fields
- **THEN** the event is saved with `country=DE`, `city=berlin`, and that `zip_code`

#### Scenario: Admin invalid zip rejected
- **WHEN** an admin submits a non-Berlin or malformed zip
- **THEN** the form is rejected with an admin-visible error

#### Scenario: Country and city are fixed on the form
- **WHEN** an admin opens create, edit, or series-create event
- **THEN** country and city are shown prefilled as Germany and Berlin
- **AND** the admin cannot change country or city via the form
- **AND** no neighborhood/Kiez select is shown

## MODIFIED Requirements

### Requirement: Address is the only admin location input
Admin event create, edit, and series forms SHALL collect street location via the address field (not via latitude, longitude, or map zoom). Postal location SHALL be collected separately as country/city/zip under the admin event location authoring rules. The system SHALL NOT present latitude, longitude, or map zoom as admin-editable fields. A map MAY be shown to preview a geocode of the address (including partner-prefill geocode on create/series). The map preview marker SHALL NOT be draggable and SHALL NOT treat map click or zoom as the source of truth for coordinates. Geocode failure SHALL NOT block saving a valid address; the map preview MAY remain at a prior or default view. Derived `lat`/`lng` MAY be posted from the geocode preview as hidden fields when a geocode (or preserved existing coordinates on edit) is resolved; the system MUST NOT persist default map-center coordinates as if they were a successful geocode.

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
