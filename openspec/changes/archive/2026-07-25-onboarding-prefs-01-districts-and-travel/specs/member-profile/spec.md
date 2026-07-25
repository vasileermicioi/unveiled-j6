## MODIFIED Requirements

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests, moods, districts, timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists (including the 12 Berlin Bezirke for districts). Travel radius (`max_distance`) SHALL NOT be collected or required. Persistence SHALL merge into `users.profile`, set `max_distance` to `null`, set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates preference fields and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile
- **AND** `max_distance` is cleared to `null`

#### Scenario: Preference save preserves onboarding state

- **WHEN** an onboarded member saves cultural preferences
- **THEN** `behavior.onboarding_step` and `profile.onboarding_complete` are unchanged
- **AND** `behavior.preferences_updated_at` is updated

#### Scenario: Invalid preference values rejected

- **WHEN** a preference payload contains a value outside the onboarding allowlists
- **THEN** the update fails validation without mutating preference fields

### Requirement: Profile preferences use native localized controls
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same native HTML form controls and DE/EN option-label contract as onboarding preference steps. Persistence, allowlists, and SSR form POST behavior remain unchanged except that travel radius is not collected.

#### Scenario: Profile vibes editor shows native checkboxes
- **WHEN** a signed-in member opens `/profile/preferences`
- **THEN** multi-value preference fields render as native checkboxes with visible labels
- **AND** travel radius is NOT shown
- **AND** accessibility uses a native checkbox with a short option label under a section title

#### Scenario: Profile preference options follow locale
- **WHEN** a member views `/de/profile/preferences`
- **THEN** option labels are German according to onboarding locale maps
- **AND** under `/en/profile/preferences` the same options are English

### Requirement: Profile hangout labels share onboarding district maps
The cultural preferences editor at `/:locale/profile/preferences` SHALL render hangout (district) option labels via the same `getDistrictLabel` locale maps as onboarding. Stored values SHALL be the 12 official Berlin Bezirk names from `@unveiled/auth/constants` `DISTRICTS`. DE and EN labels SHALL use those proper Bezirk names (no informal shorthand such as `X-Berg`).

#### Scenario: Profile preferences offer Berlin Bezirke
- **WHEN** a member views `/profile/preferences`
- **THEN** hangout options are the 12 official Bezirke (e.g. Friedrichshain-Kreuzberg, Neukölln)
- **AND** there is no travel-distance control

#### Scenario: Profile hangout labels match onboarding in both locales
- **WHEN** a member views `/en/profile/preferences` or `/de/profile/preferences`
- **THEN** hangout option labels are the official Bezirk names, not informal shorthand or EN-only expansions like `Kreuzberg`
