## ADDED Requirements

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
- **AND** age group is a native radio (or native select) group
- **AND** travel radius is NOT collected

### Requirement: Accessibility preference section chrome
The system SHALL present the accessibility preference as a titled question on onboarding step 4. The section title SHALL be locale-specific (EN `Accessibility needed?`, DE `Barrierefreiheit benötigt?`). The interactive control SHALL be a native checkbox whose option label is a short affirmative (EN `Yes`, DE `Ja`). When checked, the persisted value SHALL be `accessibility: true`; when unchecked, `false`.

#### Scenario: Accessibility mirrors Languages structure
- **WHEN** a member views onboarding step 4
- **THEN** they see the accessibility question above its yes checkbox

#### Scenario: Accessibility option uses short locale label
- **WHEN** a member views onboarding step 4 under `/en`
- **THEN** the accessibility checkbox accessible name is `Yes`
- **AND** under `/de` the option label is `Ja`
