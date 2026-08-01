## ADDED Requirements

### Requirement: Step 3 location preferences
Onboarding step 3 SHALL collect a postal code (`zip_code`) via a native text input, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The system SHALL NOT offer the 12 Berlin Bezirke multi-select. Locale copy SHALL label Country / Land, City / Stadt, and PLZ / Zip code, and MAY include a short hint that Unveiled currently serves Berlin without claiming the data model can never expand. Travel distance / radius SHALL NOT be collected (still owned by the travel-distance change). Invalid or non-Berlin zip under `(DE, berlin)` SHALL be rejected with a user-visible error without completing the step.

#### Scenario: Step 3 — zip under Germany/Berlin
- **WHEN** I am on onboarding step 3
- **THEN** country shows Germany and city shows Berlin (prefilled, not a free picker)
- **AND** I can enter a Berlin PLZ
- **AND** I cannot multi-select hangout districts
- **AND** I cannot set a travel distance / radius

#### Scenario: Step 3 — invalid zip rejected
- **WHEN** I submit onboarding step 3 with a malformed or non-Berlin zip
- **THEN** the step is rejected with a user-visible error
- **AND** the location preference is not advanced as saved with that invalid zip

## MODIFIED Requirements

### Requirement: Preference controls are native and localized
Onboarding preference forms SHALL use native HTML form controls (`checkbox`, `radio`, `input`, `select`, `textarea` as applicable) for preference capture — not HeroUI Checkbox/Radio/Switch/NumberField/Select custom chrome. All preference section labels and option values SHALL be available in German and English according to the active URL locale. Stored allowlist keys MAY remain locale-invariant; user-visible labels MUST come from locale copy maps. Location on step 3 SHALL use a native zip text input (plus non-editable country/city display), not a multi-select checkbox group.

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
- **AND** travel radius is NOT collected

#### Scenario: Location zip uses a native text input
- **WHEN** a user completes onboarding step 3 (location)
- **THEN** zip code is a native text input
- **AND** country and city are shown as non-editable prefilled values (not HeroUI Select pickers)

## REMOVED Requirements

### Requirement: Localized hangout / district option labels
**Reason**: Member location preference switched from 12 Berlin Bezirke multi-select to postal `country` / `city` / `zip_code` under Germany/Berlin defaults.
**Migration**: Use Step 3 location preferences (zip under fixed Germany/Berlin). Leave product Gherkin / e2e matrix wording updates to `berlin-zip-code-04-docs-and-e2e`.
