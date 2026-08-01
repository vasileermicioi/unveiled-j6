# Member Onboarding

Four-step SSR onboarding wizard for incomplete USERs, gate/skip behavior for other roles, and automated browser coverage.

## Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`), including: step 3 zip under prefilled Germany/Berlin **plus** required travel distance (km); interests Other + free text; searchable languages with DE/EN first; accessibility “needed?” yes checkbox. Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation. Scenario titles SHALL match Gherkin `Scenario:` lines verbatim (including the step 3 zip title).

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts the updated preference controls, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only
- **AND** `completeLocationStep` fills a valid Berlin PLZ under Germany/Berlin and a valid travel distance within bounds (not Bezirk checkboxes; not omitting `max_distance`)

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

### Requirement: Interests may include Other with free text
The system SHALL offer an `Other` interest option on onboarding step 2. When `Other` is selected, the member SHALL provide a free-text interest stored as `profile.interests_other`. When `Other` is not selected, `interests_other` SHALL be null. The interests array SHALL include the allowlist key `Other` when that checkbox is checked. `Other` SHALL be a normal member of `@unveiled/auth/constants` `INTERESTS` (appended after the existing eight keys). Locale labels SHALL be EN `Other` and DE `Sonstiges`. Free text SHALL be trimmed; when `Other` is selected it MUST be non-empty and MUST NOT exceed the configured max length (100 characters).

#### Scenario: Other interest requires text
- **WHEN** a member selects Other under WHAT INTERESTS YOU? and submits without free text
- **THEN** the step is rejected with a validation error

#### Scenario: Other interest saves free text
- **WHEN** a member selects Other, enters free text, and submits
- **THEN** `interests` contains `Other` and `interests_other` stores the trimmed text

#### Scenario: Other unchecked clears free text
- **WHEN** a member submits interests without Other selected (even if stray `interests_other` text was posted)
- **THEN** persisted `interests_other` is null

### Requirement: Accessibility preference section chrome
The system SHALL present the accessibility preference as a titled question on onboarding step 4. The section title SHALL be locale-specific (EN `Accessibility needed?`, DE `Barrierefreiheit benötigt?`). The interactive control SHALL be a native checkbox whose option label is a short affirmative (EN `Yes`, DE `Ja`). When checked, the persisted value SHALL be `accessibility: true`; when unchecked, `false`.

#### Scenario: Accessibility mirrors Languages structure
- **WHEN** a member views onboarding step 4
- **THEN** they see the accessibility question above its yes checkbox

#### Scenario: Accessibility option uses short locale label
- **WHEN** a member views onboarding step 4 under `/en`
- **THEN** the accessibility checkbox accessible name is `Yes`
- **AND** under `/de` the option label is `Ja`

### Requirement: Preferred languages are a searchable multi-select
The system SHALL let members multi-select preferred languages from an expanded allowlist on onboarding step 4. The UI SHALL provide a client-side search/filter over the option list (no server search). German (`DE`) and English (`EN`) SHALL appear as the first two options when the filter is empty; remaining options SHALL be ordered A–Z by locale display label. `Non-Verbal` SHALL NOT be offered. Posted values SHALL validate against `@unveiled/auth/constants` `PREFERRED_LANGUAGES`. Selected values SHALL still be submitted when they do not match the active filter.

#### Scenario: Languages searchable list pins DE and EN
- **WHEN** a member opens the languages control on onboarding step 4 with an empty filter
- **THEN** the first two options are German and English (locale labels)
- **AND** typing in the filter narrows the visible options client-side
- **AND** Non-Verbal is not offered

#### Scenario: Preferred language codes validate against allowlist
- **WHEN** a timing step payload includes a preferred language outside `PREFERRED_LANGUAGES` (including `Non-Verbal`)
- **THEN** validation rejects the payload without completing the step

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

### Requirement: Product docs match onboarding preference options

`docs/product/features/onboarding.feature`, `extras/content-i18n-inventory.md`, `database/schema-overview.md`, and `testing/coverage-matrix.md` SHALL describe the shipped preference UX: interests include Other + free text (`interests_other`); location on step 3 collects `zip_code` with country/city prefilled to Germany/Berlin (`DE` / `berlin`), does not offer Bezirk multi-select, and **collects required travel distance** (`max_distance` integer km, inclusive bounds 1–50); timing offers searchable preferred languages (DE/EN first; no Non-Verbal) and Accessibility needed? with a Yes/Ja checkbox. Docs MAY note that more cities/countries can be added later via the postal registry without changing the field trio. `max_distance` SHALL be documented as an **active** preference (collected in onboarding and Vibes; preference saves do not clear it by policy). i18n inventory SHALL list `radiusLabel` / `km` with EN “How far will you travel?” / DE “Wie weit bist du bereit zu fahren?” (+ `km`). Coverage-matrix Scenario titles SHALL match the updated Gherkin; notes SHALL not claim “no travel radius”.

#### Scenario: Onboarding feature file matches shipped steps 2–4

- **WHEN** an implementer reads `docs/product/features/onboarding.feature` after this step
- **THEN** step 2 mentions Other + free text, step 3 describes zip under Germany/Berlin **and** travel distance (km), without Bezirk multi-select, and step 4 describes searchable languages and Accessibility needed?
- **AND** scenarios that forbid travel distance / radius (“I cannot set a travel distance / radius”) are absent
- **AND** stale hangout-district / 12-Bezirke scenarios, Non-Verbal language options, and Required/Erforderlich accessibility labels remain absent from those scenarios

#### Scenario: Coverage matrix tracks zip and travel distance on step 3

- **WHEN** an implementer reads `docs/product/testing/coverage-matrix.md` onboarding rows
- **THEN** the step 3 row uses the zip Scenario title and notes Germany/Berlin defaults **plus** travel distance (km)
- **AND** the notes do not claim travel radius is unavailable

#### Scenario: Onboarding e2e asserts travel distance control

- **WHEN** `e2e/specs/onboarding.spec.ts` runs Scenario Step 3 — zip under Germany/Berlin
- **THEN** the location form shows a travel-distance control (native number / labeled how-far copy) beside zip
- **AND** the test does not assert that travel distance / radius is absent
