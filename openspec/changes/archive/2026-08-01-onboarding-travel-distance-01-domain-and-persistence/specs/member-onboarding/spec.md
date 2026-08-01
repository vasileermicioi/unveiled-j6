## ADDED Requirements

### Requirement: Location step stores travel distance

Onboarding location step persistence SHALL store `max_distance` together with `country`, `city`, and `zip_code` when the step is submitted with valid values. `max_distance` SHALL be a positive integer kilometers within the configured bounds (inclusive **1–50** unless constants are updated in one place). Invalid, missing, or out-of-range `max_distance` SHALL reject the step without completing it. The step SHALL continue to clear legacy `districts` on successful write. Dedicated travel-distance form chrome MAY be completed in the follow-on UI step (`onboarding-travel-distance-02`); domain validation SHALL require and persist `max_distance` in this change.

#### Scenario: Location step persists zip and max_distance

- **WHEN** onboarding location step is submitted with a valid Berlin zip and max_distance within bounds
- **THEN** the profile stores country, city, zip_code, and max_distance
- **AND** districts is cleared (null or absent)

#### Scenario: Location step rejects out-of-range max_distance

- **WHEN** onboarding location step is submitted with max_distance outside the allowed bounds
- **THEN** the step is rejected with a validation error
- **AND** the location preference is not advanced as saved with that invalid distance

## MODIFIED Requirements

### Requirement: Step 3 location preferences

Onboarding step 3 SHALL collect a postal code (`zip_code`) via a native text input, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The system SHALL NOT offer the 12 Berlin Bezirke multi-select. Locale copy SHALL label Country / Land, City / Stadt, and PLZ / Zip code, and MAY include a short hint that Unveiled currently serves Berlin without claiming the data model can never expand. Domain persistence for step 3 SHALL also require and store validated `max_distance` (integer km within configured bounds) with the location trio; travel-distance form chrome and locale labels MAY land in the follow-on UI step. Invalid or non-Berlin zip under `(DE, berlin)`, or invalid `max_distance`, SHALL be rejected with a user-visible / typed validation error without completing the step.

#### Scenario: Step 3 — zip under Germany/Berlin

- **WHEN** I am on onboarding step 3
- **THEN** country shows Germany and city shows Berlin (prefilled, not a free picker)
- **AND** I can enter a Berlin PLZ
- **AND** I cannot multi-select hangout districts

#### Scenario: Step 3 — invalid zip rejected

- **WHEN** I submit onboarding step 3 with a malformed or non-Berlin zip
- **THEN** the step is rejected with a user-visible error
- **AND** the location preference is not advanced as saved with that invalid zip

#### Scenario: Step 3 — domain persists max_distance with zip

- **WHEN** onboarding location persistence receives a valid Berlin zip and max_distance within bounds
- **THEN** profile.max_distance is stored with the location trio
- **AND** max_distance is not cleared to null by policy
