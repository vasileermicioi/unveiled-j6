## MODIFIED Requirements

### Requirement: Travel distance persistence

The system SHALL leave `users.profile.max_distance` untouched on onboarding location and cultural preference saves: those saves SHALL NOT require, validate, write, or clear `max_distance` as policy. Legacy non-null values MAY remain in JSONB until a later cleanup. Legacy `districts` SHALL still be cleared on location writes. GDPR anonymization SHALL continue to remove preference fields including `max_distance` (full profile wipe remains acceptable).

#### Scenario: Preference save leaves max_distance untouched

- **WHEN** a member saves preferences including a valid Berlin zip_code and the profile already has `max_distance` = 10
- **THEN** profile.max_distance remains 10 after save
- **AND** the save does not require a posted travel-distance field

#### Scenario: Preference save without prior max_distance stays unset

- **WHEN** a member saves preferences including a valid Berlin zip_code and the profile has `max_distance` null or absent
- **THEN** profile.max_distance remains null or absent after save

#### Scenario: Location save with zip round-trips without distance

- **WHEN** a preference or onboarding location save includes a valid Berlin zip_code without max_distance
- **THEN** the persisted profile contains zip_code
- **AND** districts is cleared (null or absent)
- **AND** max_distance is not newly written by the save path

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests (including Other + free text), moods, location (`country` / `city` / `zip_code` under Germany/Berlin defaults for this release), timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists for non-location fields; location SHALL use the shared postal registry (Berlin PLZ under `DE` / `berlin`) rather than the 12 Berlin Bezirke `districts` multi-select. The Vibes location editor SHALL show country and city as prefilled, non-editable Germany/Berlin display (submitted as `DE` / `berlin`) plus a native zip input, with locale labels (Country / Land, City / Stadt, PLZ / Zip code) and a short hint that Unveiled currently serves Berlin. Vibes location SHALL NOT show a travel-distance control and SHALL NOT require or persist `max_distance`. Persistence SHALL merge into `users.profile`, store the location trio, clear legacy `districts`, leave any existing `max_distance` untouched, set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`. Invalid or non-Berlin zip SHALL be rejected with a user-visible / typed validation error without mutating preference fields.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates interests (including Other + free text), moods, location zip under Germany/Berlin, timing, preferred days, languages (searchable list), or accessibility needs and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile including `country`, `city`, and `zip_code`
- **AND** `max_distance` is not required and is not newly written by the save

#### Scenario: Edit cultural preferences zip without travel distance

- **WHEN** I update my zip code (and other Vibes fields) on profile preferences
- **THEN** my profile preferences are saved including `country`, `city`, and `zip_code`
- **AND** country and city remain Germany / Berlin (not a free picker)
- **AND** I cannot multi-select hangout districts
- **AND** I cannot set a travel distance / radius

#### Scenario: Preference save preserves onboarding state

- **WHEN** an onboarded member saves cultural preferences
- **THEN** `behavior.onboarding_step` and `profile.onboarding_complete` are unchanged
- **AND** `behavior.preferences_updated_at` is updated

#### Scenario: Invalid preference values rejected

- **WHEN** a preference payload contains a value outside the onboarding allowlists or an invalid location trio
- **THEN** the update fails validation without mutating preference fields

### Requirement: Profile preferences use native localized controls

The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same native HTML form controls and DE/EN option-label contract as onboarding preference steps. Persistence, allowlists, and SSR form POST behavior remain unchanged except that travel distance (`max_distance`) is **not** collected, preferred languages use the searchable multi-select pattern, and interests may include Other with free text (`interests_other`).

#### Scenario: Profile vibes editor shows native checkboxes

- **WHEN** a signed-in member opens `/profile/preferences`
- **THEN** multi-value preference fields (other than the languages searchable control) render as native checkboxes with visible labels
- **AND** preferred languages use native checkboxes inside a searchable client-side filter control (not HeroUI Select)
- **AND** when Other is selected under interests, a native text input or textarea captures `interests_other`
- **AND** no travel-distance / `max_distance` number input is shown
- **AND** accessibility uses a native checkbox with a short option label under a section title

#### Scenario: Profile preference options follow locale

- **WHEN** a member views `/de/profile/preferences`
- **THEN** option labels are German according to onboarding locale maps
- **AND** under `/en/profile/preferences` the same options are English

### Requirement: Product docs and Playwright match Vibes preference options

`docs/product/features/profile.feature` Scenario “Edit cultural preferences ("Vibes")” and `e2e/specs/profile.spec.ts` SHALL describe / exercise the shipped Vibes editor: interests (including Other + free text), moods, location as `country` / `city` / `zip_code` under Germany/Berlin defaults, timing, preferred days, searchable languages, and accessibility needs — and SHALL NOT require or show travel distance / `max_distance` or Bezirk hangout multi-select. Coverage-matrix rows for that Scenario SHALL match the updated title/assertions and SHALL note zip-only location (no travel distance).

#### Scenario: Profile feature file Vibes has zip without travel distance

- **WHEN** an implementer reads the Vibes scenario in `docs/product/features/profile.feature`
- **THEN** it mentions updating interests (including Other + free text), location zip under Germany/Berlin, languages (searchable list), or accessibility needs as implemented
- **AND** travel distance is not part of the Vibes form
- **AND** 12 Bezirke / hangout districts multi-select is not required

#### Scenario: Profile e2e Vibes asserts zip without travel distance

- **WHEN** `e2e/specs/profile.spec.ts` runs Scenario Edit cultural preferences ("Vibes")
- **THEN** the preferences form shows zip under Germany/Berlin (not Bezirk checkboxes)
- **AND** the preferences form does not show a travel-distance control
- **AND** saving preferences with a valid zip still succeeds
