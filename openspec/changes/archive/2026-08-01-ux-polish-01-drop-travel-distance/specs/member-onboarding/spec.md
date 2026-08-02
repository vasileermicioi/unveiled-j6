## REMOVED Requirements

### Requirement: Location step stores travel distance

**Reason**: Travel distance is no longer collected; location saves leave any legacy `max_distance` JSONB value untouched and do not persist a new value.
**Migration**: Collect Germany/Berlin + Berlin zip only (see modified Step 3 location preferences). Do not call `validateMaxDistance` on location saves.

## MODIFIED Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`), including: step 3 zip under prefilled Germany/Berlin **without** travel distance / `max_distance`; interests Other + free text; searchable languages with DE/EN first; accessibility “needed?” yes checkbox. Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation. Scenario titles SHALL match Gherkin `Scenario:` lines verbatim (including the step 3 zip title).

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts the updated preference controls, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only
- **AND** `completeLocationStep` fills a valid Berlin PLZ under Germany/Berlin and does **not** fill or require travel distance / `max_distance`

### Requirement: Preference controls are native and localized

Onboarding preference forms SHALL use native HTML form controls (`checkbox`, `radio`, `input`, `select`, `textarea` as applicable) for preference capture — not HeroUI Checkbox/Radio/Switch/NumberField/Select custom chrome. All preference section labels and option values SHALL be available in German and English according to the active URL locale. Stored allowlist keys MAY remain locale-invariant; user-visible labels MUST come from locale copy maps. Location on step 3 SHALL use a native zip text input (plus non-editable country/city display) and SHALL NOT show a travel-distance / `max_distance` number input.

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
- **AND** no travel-distance / `max_distance` control is shown

### Requirement: Step 3 location preferences

Onboarding step 3 SHALL collect a postal code (`zip_code`) via a native text input, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The system SHALL NOT offer the 12 Berlin Bezirke multi-select. The system SHALL NOT require, show, or persist travel distance / `max_distance` on this step. Locale copy SHALL label Country / Land, City / Stadt, and PLZ / Zip code, and MAY include a short hint that Unveiled currently serves Berlin without claiming the data model can never expand. Submitting a valid Berlin zip SHALL store `country`, `city`, and `zip_code`, clear legacy `districts`, and leave any existing `max_distance` JSONB value untouched. Invalid or non-Berlin zip under `(DE, berlin)` SHALL be rejected with a user-visible / typed validation error without completing the step.

#### Scenario: Step 3 — zip under Germany/Berlin only

- **WHEN** I am on onboarding step 3
- **THEN** country shows Germany and city shows Berlin (prefilled)
- **AND** I can enter a Berlin PLZ
- **AND** I cannot set a travel distance / radius
- **AND** I cannot multi-select hangout districts
- **AND** submitting a valid zip stores country, city, and zip_code

#### Scenario: Step 3 — invalid zip rejected

- **WHEN** I submit onboarding step 3 with a malformed or non-Berlin zip
- **THEN** the step is rejected with a user-visible error
- **AND** the location preference is not advanced as saved with that invalid zip

#### Scenario: Step 3 — existing max_distance left untouched

- **WHEN** a profile already has a non-null `max_distance` and onboarding location step is submitted with a valid Berlin zip only
- **THEN** the persisted profile keeps the previous `max_distance` value
- **AND** districts is cleared (null or absent)

### Requirement: Product docs match onboarding preference options

`docs/product/features/onboarding.feature`, `extras/content-i18n-inventory.md`, `database/schema-overview.md`, and `testing/coverage-matrix.md` SHALL describe the shipped preference UX: interests include Other + free text (`interests_other`); location on step 3 collects `zip_code` with country/city prefilled to Germany/Berlin (`DE` / `berlin`), does not offer Bezirk multi-select, and does **not** collect travel distance / `max_distance`; timing offers searchable preferred languages (DE/EN first; no Non-Verbal) and Accessibility needed? with a Yes/Ja checkbox. Docs MAY note that more cities/countries can be added later via the postal registry without changing the field trio. `max_distance` SHALL be documented as optional legacy JSONB (not an active onboarding preference). i18n inventory SHALL NOT list active `radiusLabel` / travel-distance chrome for onboarding. Coverage-matrix Scenario titles SHALL match the updated Gherkin; notes SHALL state zip-only location (no travel distance).

#### Scenario: Onboarding feature file matches shipped steps 2–4

- **WHEN** an implementer reads `docs/product/features/onboarding.feature` after this step
- **THEN** step 2 mentions Other + free text, step 3 describes zip under Germany/Berlin without travel distance, without Bezirk multi-select, and step 4 describes searchable languages and Accessibility needed?
- **AND** scenarios that require filling travel distance are absent
- **AND** stale hangout-district / 12-Bezirke scenarios, Non-Verbal language options, and Required/Erforderlich accessibility labels remain absent from those scenarios

#### Scenario: Coverage matrix tracks zip-only step 3

- **WHEN** an implementer reads `docs/product/testing/coverage-matrix.md` onboarding rows
- **THEN** the step 3 row uses the zip Scenario title and notes Germany/Berlin defaults without travel distance
- **AND** the notes do not require a travel-distance control

#### Scenario: Onboarding e2e asserts no travel distance control

- **WHEN** `e2e/specs/onboarding.spec.ts` runs Scenario Step 3 — zip under Germany/Berlin
- **THEN** the location form shows zip under Germany/Berlin
- **AND** the test asserts that travel distance / radius is absent (or equivalent proximity assertion)
