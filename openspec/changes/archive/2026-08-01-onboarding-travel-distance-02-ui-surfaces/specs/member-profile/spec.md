## MODIFIED Requirements

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests (including Other + free text), moods, location (`country` / `city` / `zip_code` under Germany/Berlin defaults for this release), travel distance (`max_distance` in kilometers), timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists for non-location fields; location SHALL use the shared postal registry (Berlin PLZ under `DE` / `berlin`) rather than the 12 Berlin Bezirke `districts` multi-select. The Vibes location editor SHALL show country and city as prefilled, non-editable Germany/Berlin display (submitted as `DE` / `berlin`) plus a native zip input and a native number input for travel distance, with locale labels (Country / Land, City / Stadt, PLZ / Zip code, travel-distance label + km unit) and a short hint that Unveiled currently serves Berlin. Travel distance SHALL be required when saving location fields. Persistence SHALL merge into `users.profile`, store the location trio, clear legacy `districts`, persist validated `max_distance` (integer km within configured bounds), set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`. Preference saves SHALL NOT clear `max_distance` to null as a blanket policy. Invalid or non-Berlin zip or invalid/missing `max_distance` SHALL be rejected with a user-visible / typed validation error without mutating preference fields.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates interests (including Other + free text), moods, location zip under Germany/Berlin, max_distance within bounds, timing, preferred days, languages (searchable list), or accessibility needs and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile including `country`, `city`, `zip_code`, and `max_distance`
- **AND** `max_distance` is not cleared to `null` by policy

#### Scenario: Edit cultural preferences includes radius

- **WHEN** I update zip and travel distance on `/profile/preferences`
- **THEN** both values are saved on my profile
- **AND** country and city remain Germany / Berlin (not a free picker)
- **AND** I cannot multi-select hangout districts

#### Scenario: Edit cultural preferences zip

- **WHEN** I update my zip code (and other Vibes fields) on profile preferences
- **THEN** my profile preferences are saved including `country`, `city`, and `zip_code`
- **AND** country and city remain Germany / Berlin (not a free picker)
- **AND** I cannot multi-select hangout districts

#### Scenario: Preference save preserves onboarding state

- **WHEN** an onboarded member saves cultural preferences
- **THEN** `behavior.onboarding_step` and `profile.onboarding_complete` are unchanged
- **AND** `behavior.preferences_updated_at` is updated

#### Scenario: Invalid preference values rejected

- **WHEN** a preference payload contains a value outside the onboarding allowlists, an invalid location trio, or an invalid max_distance
- **THEN** the update fails validation without mutating preference fields

### Requirement: Profile preferences use native localized controls
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same native HTML form controls and DE/EN option-label contract as onboarding preference steps. Persistence, allowlists, and SSR form POST behavior remain unchanged except that travel distance (`max_distance`) is collected via a native number input beside zip, preferred languages use the searchable multi-select pattern, and interests may include Other with free text (`interests_other`).

#### Scenario: Profile vibes editor shows native checkboxes
- **WHEN** a signed-in member opens `/profile/preferences`
- **THEN** multi-value preference fields (other than the languages searchable control) render as native checkboxes with visible labels
- **AND** preferred languages use native checkboxes inside a searchable client-side filter control (not HeroUI Select)
- **AND** when Other is selected under interests, a native text input or textarea captures `interests_other`
- **AND** travel distance is shown as a native number input with locale label and km unit
- **AND** accessibility uses a native checkbox with a short option label under a section title

#### Scenario: Profile preference options follow locale
- **WHEN** a member views `/de/profile/preferences`
- **THEN** option labels are German according to onboarding locale maps
- **AND** under `/en/profile/preferences` the same options are English
