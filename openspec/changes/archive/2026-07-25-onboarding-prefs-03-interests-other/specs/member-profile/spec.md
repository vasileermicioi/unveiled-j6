## ADDED Requirements

### Requirement: Profile interests Other shares onboarding free-text rules
The cultural preferences editor at `/:locale/profile/preferences` SHALL offer the same `Other` interest checkbox and free-text field as onboarding step 2. Persistence and validation SHALL match: `Other` in `interests` requires trimmed non-empty `interests_other` (max 100 characters); when `Other` is absent, `interests_other` SHALL be null. Labels SHALL be EN `Other` / DE `Sonstiges`.

#### Scenario: Profile Other interest requires text
- **WHEN** a signed-in member selects Other on `/profile/preferences` and submits without free text
- **THEN** the save is rejected with a validation error

#### Scenario: Profile Other interest saves free text
- **WHEN** a signed-in member selects Other, enters free text, and saves preferences
- **THEN** `interests` contains `Other` and `interests_other` stores the trimmed text

## MODIFIED Requirements

### Requirement: Profile preferences use native localized controls
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same native HTML form controls and DE/EN option-label contract as onboarding preference steps. Persistence, allowlists, and SSR form POST behavior remain unchanged except that travel radius is not collected, preferred languages use the searchable multi-select pattern, and interests may include Other with free text (`interests_other`).

#### Scenario: Profile vibes editor shows native checkboxes
- **WHEN** a signed-in member opens `/profile/preferences`
- **THEN** multi-value preference fields (other than the languages searchable control) render as native checkboxes with visible labels
- **AND** preferred languages use native checkboxes inside a searchable client-side filter control (not HeroUI Select)
- **AND** when Other is selected under interests, a native text input or textarea captures `interests_other`
- **AND** travel radius is NOT shown
- **AND** accessibility uses a native checkbox with a short option label under a section title

#### Scenario: Profile preference options follow locale
- **WHEN** a member views `/de/profile/preferences`
- **THEN** option labels are German according to onboarding locale maps
- **AND** under `/en/profile/preferences` the same options are English
