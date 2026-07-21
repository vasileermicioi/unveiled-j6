## ADDED Requirements

### Requirement: Accessibility preference section chrome
The system SHALL present the accessibility preference as a titled section on onboarding step 4, using the same section-label + options layout as the languages preference. The section title SHALL be locale-specific (EN `ACCESSIBILITY?`, DE `BARRIEREFREIHEIT?`). The interactive option label SHALL be a short chip string (EN `Required`, DE `Erforderlich`), not the section title alone. The persisted value SHALL remain a boolean posted as `accessibility`.

#### Scenario: Accessibility mirrors Languages structure
- **WHEN** a member views onboarding step 4
- **THEN** they see a section title for accessibility above its checkbox option(s), just as Languages has a title above its options

#### Scenario: Accessibility option uses short locale label
- **WHEN** a member views onboarding step 4 under `/en`
- **THEN** the accessibility checkbox accessible name is the short option label (e.g. Required), not the full former question string
- **AND** under `/de` the option label is the German short form (e.g. Erforderlich)

## MODIFIED Requirements

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
