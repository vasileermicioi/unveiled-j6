# Member Onboarding

Four-step SSR onboarding wizard for incomplete USERs, gate/skip behavior for other roles, and automated browser coverage.

## Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`). Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation.

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts input, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only

### Requirement: Preference controls are native and localized
Onboarding preference forms SHALL use native HTML form controls (`checkbox`, `radio`, `input`, `select`, `textarea` as applicable) for preference capture — not HeroUI Checkbox/Radio/Switch/NumberField custom chrome. All preference section labels and option values SHALL be available in German and English according to the active URL locale. Stored allowlist keys MAY remain locale-invariant; user-visible labels MUST come from locale copy maps.

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
- **THEN** multi-value fields (interests, moods, districts, timing, preferred days, preferred languages) are native checkboxes
- **AND** age group is a native radio (or native select) group
- **AND** travel radius is a native number input or native select

### Requirement: Accessibility preference section chrome
The system SHALL present the accessibility preference as a titled section on onboarding step 4, using the same section-label + options layout as the languages preference. The section title SHALL be locale-specific (EN `ACCESSIBILITY?`, DE `BARRIEREFREIHEIT?`). The interactive option label SHALL be a short chip string (EN `Required`, DE `Erforderlich`), not the section title alone. The persisted value SHALL remain a boolean posted as `accessibility`.

#### Scenario: Accessibility mirrors Languages structure
- **WHEN** a member views onboarding step 4
- **THEN** they see a section title for accessibility above its checkbox option(s), just as Languages has a title above its options

#### Scenario: Accessibility option uses short locale label
- **WHEN** a member views onboarding step 4 under `/en`
- **THEN** the accessibility checkbox accessible name is the short option label (e.g. Required), not the full former question string
- **AND** under `/de` the option label is the German short form (e.g. Erforderlich)

### Requirement: Localized hangout / district option labels
The system SHALL render onboarding hangout (district) option labels from the active URL locale via `getDistrictLabel`. German UI SHALL use Berlin shorthand for `X-Berg`, `P-Berg`, and `F-Hain`. English UI SHALL use expanded district names (`Kreuzberg`, `Prenzlauer Berg`, `Friedrichshain`). Stored preference values SHALL remain the allowlist keys from `@unveiled/auth/constants`.

#### Scenario: EN hangout chips use expanded names
- **WHEN** a member views onboarding step 3 (location) under `/en`
- **THEN** the hangout options show expanded English-facing labels (e.g. Kreuzberg), not the DE shorthand set

#### Scenario: DE hangout chips use Berlin shorthand
- **WHEN** a member views the same step under `/de`
- **THEN** the hangout options for X-Berg, P-Berg, and F-Hain show the Berlin shorthand labels
