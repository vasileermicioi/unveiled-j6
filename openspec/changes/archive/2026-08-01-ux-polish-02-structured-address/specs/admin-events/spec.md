## MODIFIED Requirements

### Requirement: Admin event location authoring

Admin create/edit SHALL collect a postal code (`zip_code` / form field `zipCode`) instead of neighborhood/Kiez, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The zip control SHALL be a native text input validated via the shared postal registry for `(DE, berlin)`. Street location SHALL be collected as structured native fields (`street`, `house_number`, optional `address_line2`) with structured geocode preview (line2 excluded from geocode). The form SHALL NOT ship a city/country picker.

#### Scenario: Admin sets Berlin zip on create

- **WHEN** an admin creates an event with a valid Berlin PLZ and other required fields
- **THEN** the event is saved with `country=DE`, `city=berlin`, and that `zip_code`

#### Scenario: Admin invalid zip rejected

- **WHEN** an admin submits a non-Berlin or malformed zip
- **THEN** the form is rejected with an admin-visible error

#### Scenario: Country and city are fixed on the form

- **WHEN** an admin opens create or edit event
- **THEN** country and city are shown prefilled as Germany and Berlin
- **AND** the admin cannot change country or city via the form
- **AND** no neighborhood/Kiez select is shown

### Requirement: Address is the only admin location input

Admin event create and edit forms SHALL collect street location via structured native fields — required street, required house number, optional address line 2 — not via latitude, longitude, map zoom, or a free-text address authoring field. Postal location SHALL be collected separately as country/city/zip under the admin event location authoring rules. The system SHALL NOT present latitude, longitude, or map zoom as admin-editable fields. A map MAY be shown to preview a **structured** geocode of street + house number + postal fields (including partner-prefill geocode on create); `address_line2` SHALL be excluded from the geocode query. The map preview marker SHALL NOT be draggable and SHALL NOT treat map click or zoom as the source of truth for coordinates. Geocode failure SHALL NOT block saving a valid structured location; the map preview MAY remain at a prior or default view. Derived `lat`/`lng` MAY be posted from the geocode preview as hidden fields when a geocode (or preserved existing coordinates on edit) is resolved; the system MUST NOT persist default map-center coordinates as if they were a successful geocode. Display `address` SHALL be composed server-side on write.

#### Scenario: Add event prefills structured location and map from partner

- **WHEN** an admin is on the new-event form and selects a partner
- **THEN** the event street, house number, optional line2, and zip fields are set from that partner
- **AND** the map preview updates to a structured geocode when geocoding succeeds

#### Scenario: Edit event keeps existing location when partner changes

- **WHEN** an admin is on the edit-event form and changes the partner
- **THEN** the existing structured location fields remain unchanged until edited manually
- **AND** the map preview follows the current structured geocode rules (not a silent partner overwrite)

#### Scenario: Geocode soft-fails leave structured location filled

- **WHEN** an admin selects a partner whose location cannot be geocoded
- **THEN** the structured location fields are still set
- **AND** saving the event with that location succeeds
- **AND** the map preview may stay unchanged
- **AND** the saved event MUST NOT store invented default-center coordinates for that failed geocode

#### Scenario: No admin lat lng or zoom controls

- **WHEN** an admin opens create or edit event
- **THEN** no latitude, longitude, or map zoom number fields are shown
- **AND** the map marker is not offered as a drag-to-set authoring control
- **AND** no free-text address authoring field is shown as the street-location source of truth

### Requirement: Partner location prefill on add only

When creating a single event, changing the partner control SHALL prefill the event structured location fields (`street`, `house_number`, optional `address_line2`, `zip_code`) from that partner's stored structured fields and SHALL attempt to update the map **preview** from a structured geocode (line2 excluded). When editing an existing event, changing the partner control SHALL NOT overwrite the event structured location fields. Map coordinates on edit SHALL follow structured-geocode rules and MUST NOT be silently replaced from the newly selected partner's location.

#### Scenario: Add event prefills structured location and map from partner

- **WHEN** an admin on the new-event form selects a partner from the dropdown
- **THEN** street, house number, optional line2, and zip are set from that partner
- **AND** the map preview updates to a structured geocode when geocoding succeeds

#### Scenario: Edit event keeps existing location when partner changes

- **WHEN** an admin on the edit-event form changes the partner
- **THEN** the existing structured location fields remain unchanged until the admin edits them manually
- **AND** the map preview is not silently overwritten from the new partner's location

#### Scenario: Geocode soft-fails leave structured location filled

- **WHEN** an admin on the new-event form selects a partner whose location cannot be geocoded
- **THEN** the structured location fields are still set from that partner
- **AND** the map preview is left unchanged (or at its prior default)
- **AND** saving the event with that location succeeds

### Requirement: BDD coverage for form control and prefill UX

Gherkin scenarios for checkbox multi-select languages/age groups and add-only partner structured-location/map prefill SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Structured street/house/zip prefill on add (and non-overwrite on edit) MUST be covered; live Nominatim map-pin success MAY be deferred when CI cannot reach Nominatim reliably.

#### Scenario: Coverage matrix lists new admin form scenarios

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new admin-events scenarios (pass or explicit deferral)

#### Scenario: Admin languages and age groups use checkbox multi-selects

- **WHEN** an admin opens create or edit event
- **THEN** Playwright can assert languages and target age groups are chosen with checkboxes (languages expose a search filter; age groups do not)
- **AND** selectors remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`

#### Scenario: Add event prefills partner structured location

- **WHEN** an admin on the new-event form selects a partner that has stored structured location fields
- **THEN** Playwright asserts street, house number, and zip fields are set from that partner
- **AND** live map-pin geocode success is not required for the scenario to pass (soft-fail leaves map unchanged)

#### Scenario: Edit event does not overwrite location when partner changes

- **WHEN** an admin on the edit-event form changes the partner
- **THEN** Playwright asserts the existing structured location fields remain unchanged
