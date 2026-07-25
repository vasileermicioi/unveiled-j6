## ADDED Requirements

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

## MODIFIED Requirements

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
