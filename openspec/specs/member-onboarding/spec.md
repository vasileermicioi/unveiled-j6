# Member Onboarding

Four-step SSR onboarding wizard for incomplete USERs, gate/skip behavior for other roles, and automated browser coverage.

## Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`), including: 12 Bezirke without travel radius; interests Other + free text; searchable languages with DE/EN first; accessibility “needed?” yes checkbox. Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation.

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts the updated preference controls, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only

### Requirement: Preference controls are native and localized
Onboarding preference forms SHALL use native HTML form controls (`checkbox`, `radio`, `input`, `select`, `textarea` as applicable) for preference capture — not HeroUI Checkbox/Radio/Switch/NumberField/Select custom chrome. All preference section labels and option values SHALL be available in German and English according to the active URL locale. Stored allowlist keys MAY remain locale-invariant; user-visible labels MUST come from locale copy maps.

#### Scenario: Accessibility preference is a visible native checkbox
- **WHEN** a user reaches the onboarding timing/preferences step
- **THEN** accessibility is a native checkbox with a visible short option label under an accessibility section title
- **AND** the control is operable with keyboard and exposes an accessible name

#### Scenario: Preference options follow locale
- **WHEN** the user views onboarding preferences under `/de/...`
- **THEN** option labels are German (not leftover English-only catalog strings)
- **AND** under `/en/...` the same options are English

#### Scenario: Multi-value preferences use native checkboxes
- **WHEN** a user completes interests, location, or timing onboarding steps
- **THEN** multi-value fields (interests, moods, districts, timing, preferred days) are native checkboxes
- **AND** preferred languages use native checkboxes inside a searchable client-side filter control (not HeroUI Select)
- **AND** when Other is selected under interests, a native text input or textarea captures `interests_other`
- **AND** age group is a native radio (or native select) group
- **AND** travel radius is NOT collected

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

### Requirement: Localized hangout / district option labels
The system SHALL render onboarding hangout (district) option labels from the active URL locale via `getDistrictLabel`. Stored preference values SHALL be the 12 official Berlin Bezirk names from `@unveiled/auth/constants` `DISTRICTS`. DE and EN labels SHALL use those proper Bezirk names (no informal shorthand keys such as `X-Berg`).

#### Scenario: Location step offers all Berlin Bezirke
- **WHEN** a member views onboarding step 3 (location)
- **THEN** they can multi-select from: Mitte, Friedrichshain-Kreuzberg, Pankow, Charlottenburg-Wilmersdorf, Spandau, Steglitz-Zehlendorf, Tempelhof-Schöneberg, Neukölln, Treptow-Köpenick, Marzahn-Hellersdorf, Lichtenberg, Reinickendorf
- **AND** there is no travel-distance / “how far would you travel” control

#### Scenario: District labels use proper Bezirk names in both locales
- **WHEN** a member views onboarding step 3 under `/en` or `/de`
- **THEN** hangout option labels are the official Bezirk names (e.g. Friedrichshain-Kreuzberg), not informal shorthand (`X-Berg`) or EN-only expansions (`Kreuzberg`)

### Requirement: Product docs match onboarding preference options

`docs/product/features/onboarding.feature`, `extras/content-i18n-inventory.md`, `database/schema-overview.md`, and `testing/coverage-matrix.md` SHALL describe the shipped preference UX: interests include Other + free text (`interests_other`); location offers the 12 official Berlin Bezirke and does not collect travel radius; timing offers searchable preferred languages (DE/EN first; no Non-Verbal) and Accessibility needed? with a Yes/Ja checkbox. `max_distance` SHALL be documented as legacy/unused (not collected). Coverage-matrix Scenario titles SHALL match the updated Gherkin.

#### Scenario: Onboarding feature file matches shipped steps 2–4

- **WHEN** an implementer reads `docs/product/features/onboarding.feature` after this step
- **THEN** step 2 mentions Other + free text, step 3 lists the 12 Bezirke without travel radius, and step 4 describes searchable languages and Accessibility needed?
- **AND** stale informal district keys, travel-radius controls, Non-Verbal language options, and Required/Erforderlich accessibility labels are absent from those scenarios
