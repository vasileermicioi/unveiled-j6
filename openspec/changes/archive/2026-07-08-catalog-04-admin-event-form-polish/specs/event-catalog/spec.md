## ADDED Requirements

### Requirement: Admin event form HeroUI-first controls

Admin event create and edit forms SHALL prefer HeroUI v3 components (`Select`, `DatePicker`, `TimeField`, `TextField`, `InputGroup`) over raw HTML form elements. Native HTML inputs SHALL be used only as a fallback inside HeroUI primitives where the library requires them, not as standalone form controls for dates or selects.

#### Scenario: Event date uses HeroUI date picker

- **WHEN** an ADMIN opens the event create or edit form
- **THEN** the event date is chosen via a HeroUI date picker control rather than a standalone native date input

#### Scenario: Select menu anchors to trigger

- **WHEN** an ADMIN opens a select field such as timing mode or partner on the event form
- **THEN** the option list appears adjacent below the trigger control, not detached at an unrelated viewport position

### Requirement: Admin event languages and age groups multi-select

The admin event form SHALL capture `languages` and `target_age_groups` as multi-select fields with predefined options, not comma-separated free text. Submitted values SHALL persist to the existing `text[]` and enum-array columns respectively.

#### Scenario: Admin selects multiple languages

- **WHEN** an ADMIN selects German and English in the languages multi-select and submits a valid form
- **THEN** the event row stores both language codes in `languages`

#### Scenario: Admin selects multiple age groups

- **WHEN** an ADMIN selects two or more target age group options and submits a valid form
- **THEN** the event row stores the selected values in `target_age_groups`

### Requirement: Admin event map geolocation with zoom

The admin event form SHALL provide a map-based geolocation picker (MapLibre GL JS with OpenStreetMap tiles) instead of free-text latitude and longitude fields. The form SHALL persist latitude, longitude, and map zoom level on the event record.

#### Scenario: Admin sets location via map

- **WHEN** an ADMIN places a marker on the geolocation map and submits a valid form
- **THEN** the event row stores the marker coordinates in `lat` and `lng` and the map zoom in `map_zoom`

#### Scenario: Edit restores map viewport

- **WHEN** an ADMIN opens edit for an event that has `lat`, `lng`, and `map_zoom` set
- **THEN** the map picker initializes centered at those coordinates and zoom level
