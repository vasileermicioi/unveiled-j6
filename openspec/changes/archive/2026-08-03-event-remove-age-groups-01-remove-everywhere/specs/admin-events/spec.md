## MODIFIED Requirements

### Requirement: Multi-value event metadata uses checkbox multi-selects

The admin event create/edit form SHALL collect supported languages via a searchable native-checkbox multi-select (same interaction model as onboarding preferred languages), except that when Language-independent is checked the languages multi-select SHALL NOT be shown or required. The form SHALL NOT collect or display target age groups. Other single-value choice fields (partner, category, etc.) SHALL continue to use a native HTML `select` unless a documented exception applies. Supported languages and language-independent are mutually exclusive in the UI: language-independent checked means languages are not collected.

#### Scenario: Languages multi-select with search

- **WHEN** an admin opens create or edit event
- **AND** Language-independent is unchecked
- **THEN** languages are chosen with a searchable checkbox multi-select
- **AND** only a short default list is shown until search is used
- **AND** a hint explains that search is needed to find other languages
- **AND** already-selected values remain available for the form POST even when filtered out of the visible list

#### Scenario: No target age groups control

- **WHEN** an admin opens create or edit event
- **THEN** no target age groups / Altersgruppen checkbox multi-select is shown

### Requirement: BDD coverage for form control and prefill UX

Gherkin scenarios for checkbox multi-select languages and add-only partner structured-location/map prefill SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Structured street/house/zip prefill on add (and non-overwrite on edit) MUST be covered; live Nominatim map-pin success MAY be deferred when CI cannot reach Nominatim reliably. There SHALL NOT be a required e2e scenario for event target age groups multi-select.

#### Scenario: Coverage matrix lists new admin form scenarios

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new admin-events scenarios (pass or explicit deferral)
- **AND** it does not require a pass row for “Age groups multi-select without search”

#### Scenario: Admin languages use checkbox multi-select

- **WHEN** an admin opens create or edit event
- **THEN** Playwright can assert languages are chosen with checkboxes that expose a search filter
- **AND** selectors remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`

#### Scenario: Add event prefills partner structured location

- **WHEN** an admin on the new-event form selects a partner that has stored structured location fields
- **THEN** Playwright asserts street, house number, and zip fields are set from that partner
- **AND** live map-pin geocode success is not required for the scenario to pass (soft-fail leaves map unchanged)

#### Scenario: Edit event does not overwrite location when partner changes

- **WHEN** an admin on the edit-event form changes the partner
- **THEN** Playwright asserts the existing structured location fields remain unchanged

## ADDED Requirements

### Requirement: Optional accessibility and audience metadata without age groups

The system SHALL allow admins to optionally set barrier-free accessibility, supported languages, language-independent, and subtitles when creating or editing an event. The system SHALL NOT collect or store target age groups on events.

#### Scenario: Optional accessibility and audience metadata

- **WHEN** I create or edit an event
- **THEN** I can optionally set barrier-free accessibility, supported languages, language-independent, and subtitles
- **AND** supported languages and language-independent are mutually exclusive in the UI
- **AND** subtitles are independent of spoken languages / language-independent
- **AND** no target age groups control is shown
