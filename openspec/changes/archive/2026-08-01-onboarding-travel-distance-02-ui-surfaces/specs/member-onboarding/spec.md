## MODIFIED Requirements

### Requirement: Preference controls are native and localized
Onboarding preference forms SHALL use native HTML form controls (`checkbox`, `radio`, `input`, `select`, `textarea` as applicable) for preference capture — not HeroUI Checkbox/Radio/Switch/NumberField/Select custom chrome. All preference section labels and option values SHALL be available in German and English according to the active URL locale. Stored allowlist keys MAY remain locale-invariant; user-visible labels MUST come from locale copy maps. Location on step 3 SHALL use a native zip text input (plus non-editable country/city display) and a native number input for travel distance (`max_distance`) in kilometers, not a multi-select checkbox group and not HeroUI NumberField/Select.

#### Scenario: Accessibility preference is a visible native checkbox
- **WHEN** a user reaches the onboarding timing/preferences step
- **THEN** accessibility is a native checkbox with a visible short option label under an accessibility section title
- **AND** the control is operable with keyboard and exposes an accessible name

#### Scenario: Preference options follow locale
- **WHEN** the user views onboarding preferences under `/de/...`
- **THEN** option labels are German (not leftover English-only catalog strings)
- **AND** under `/en/...` the same options are English

#### Scenario: Multi-value preferences use native checkboxes
- **WHEN** a user completes interests or timing onboarding steps
- **THEN** multi-value fields (interests, moods, timing, preferred days) are native checkboxes
- **AND** preferred languages use native checkboxes inside a searchable client-side filter control (not HeroUI Select)
- **AND** when Other is selected under interests, a native text input or textarea captures `interests_other`
- **AND** age group is a native radio (or native select) group

#### Scenario: Location zip uses a native text input
- **WHEN** a user completes onboarding step 3 (location)
- **THEN** zip code is a native text input
- **AND** country and city are shown as non-editable prefilled values (not HeroUI Select pickers)

#### Scenario: Travel distance uses a native number input
- **WHEN** a user completes onboarding step 3 (location)
- **THEN** travel distance is a native `input type="number"` (not HeroUI NumberField or Select)
- **AND** the control is labeled in the active locale with a kilometers unit

### Requirement: Location step stores travel distance

Onboarding location step persistence SHALL store `max_distance` together with `country`, `city`, and `zip_code` when the step is submitted with valid values. `max_distance` SHALL be a positive integer kilometers within the configured bounds (inclusive **1–50** unless constants are updated in one place). Invalid, missing, or out-of-range `max_distance` SHALL reject the step without completing it. The step SHALL continue to clear legacy `districts` on successful write. The onboarding location form SHALL collect travel distance via a native control so members can submit a valid `max_distance` with the location trio.

#### Scenario: Location step persists zip and max_distance

- **WHEN** onboarding location step is submitted with a valid Berlin zip and max_distance within bounds
- **THEN** the profile stores country, city, zip_code, and max_distance
- **AND** districts is cleared (null or absent)

#### Scenario: Location step rejects out-of-range max_distance

- **WHEN** onboarding location step is submitted with max_distance outside the allowed bounds
- **THEN** the step is rejected with a validation error
- **AND** the location preference is not advanced as saved with that invalid distance

### Requirement: Step 3 location preferences

Onboarding step 3 SHALL collect a postal code (`zip_code`) via a native text input and a travel distance in kilometers (`max_distance`) via a native number input, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The system SHALL NOT offer the 12 Berlin Bezirke multi-select. Locale copy SHALL label Country / Land, City / Stadt, PLZ / Zip code, and travel distance (e.g. EN “How far will you travel?”, DE “Wie weit bist du bereit zu fahren?”) with a kilometers unit, and MAY include a short hint that Unveiled currently serves Berlin without claiming the data model can never expand. Travel distance SHALL be required on step 3. Submitting valid values SHALL store `country`, `city`, `zip_code`, and `max_distance`. Invalid or non-Berlin zip under `(DE, berlin)`, or invalid/missing `max_distance`, SHALL be rejected with a user-visible / typed validation error without completing the step.

#### Scenario: Step 3 — hangout location and travel distance

- **WHEN** I am on onboarding step 3
- **THEN** country shows Germany and city shows Berlin (prefilled)
- **AND** I can enter a Berlin PLZ
- **AND** I can set how far I am willing to travel in km
- **AND** I cannot multi-select hangout districts
- **AND** submitting valid values stores country, city, zip_code, and max_distance

#### Scenario: Step 3 — invalid zip rejected

- **WHEN** I submit onboarding step 3 with a malformed or non-Berlin zip
- **THEN** the step is rejected with a user-visible error
- **AND** the location preference is not advanced as saved with that invalid zip

#### Scenario: Step 3 — invalid travel distance rejected

- **WHEN** I submit onboarding step 3 with an invalid or out-of-range travel distance
- **THEN** the step is rejected with a user-visible error
- **AND** the location preference is not advanced as saved with that invalid distance
