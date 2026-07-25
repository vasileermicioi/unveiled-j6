## ADDED Requirements

### Requirement: Profile preferred languages share onboarding searchable multi-select
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same searchable preferred-languages multi-select as onboarding step 4: client-side filter only, `DE`/`EN` first when the filter is empty, remaining options A–Z by locale label, `Non-Verbal` not offered, values validated against `@unveiled/auth/constants` `PREFERRED_LANGUAGES`, and selected values still submitted when they do not match the active filter.

#### Scenario: Profile languages searchable list pins DE and EN
- **WHEN** a signed-in member opens the languages control on `/profile/preferences` with an empty filter
- **THEN** the first two options are German and English (locale labels)
- **AND** typing in the filter narrows the visible options client-side
- **AND** Non-Verbal is not offered

## MODIFIED Requirements

### Requirement: Profile preferences use native localized controls
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same native HTML form controls and DE/EN option-label contract as onboarding preference steps. Persistence, allowlists, and SSR form POST behavior remain unchanged except that travel radius is not collected and preferred languages use the searchable multi-select pattern.

#### Scenario: Profile vibes editor shows native checkboxes
- **WHEN** a signed-in member opens `/profile/preferences`
- **THEN** multi-value preference fields (other than the languages searchable control) render as native checkboxes with visible labels
- **AND** preferred languages use native checkboxes inside a searchable client-side filter control (not HeroUI Select)
- **AND** travel radius is NOT shown
- **AND** accessibility uses a native checkbox with a short option label under a section title

#### Scenario: Profile preference options follow locale
- **WHEN** a member views `/de/profile/preferences`
- **THEN** option labels are German according to onboarding locale maps
- **AND** under `/en/profile/preferences` the same options are English

### Requirement: Profile accessibility section shares onboarding chrome
The cultural preferences editor at `/:locale/profile/preferences` SHALL present accessibility with the same question + yes-checkbox chrome and shared copy keys as onboarding step 4 (EN `Accessibility needed?` / `Yes`, DE `Barrierefreiheit benötigt?` / `Ja`). The persisted value SHALL remain a boolean posted as `accessibility`.

#### Scenario: Profile preferences accessibility mirrors Languages
- **WHEN** a signed-in member views `/profile/preferences`
- **THEN** accessibility has the accessibility question above its Yes/Ja checkbox, parallel to the Languages block
- **AND** the option label is the short affirmative (EN `Yes`, DE `Ja`)
