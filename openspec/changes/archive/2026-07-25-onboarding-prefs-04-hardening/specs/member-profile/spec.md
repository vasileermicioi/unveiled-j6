## ADDED Requirements

### Requirement: Product docs and Playwright match Vibes preference options

`docs/product/features/profile.feature` Scenario “Edit cultural preferences ("Vibes")” and `e2e/specs/profile.spec.ts` SHALL describe / exercise the shipped Vibes editor: interests (including Other + free text), moods, 12 Bezirke districts, timing, preferred days, searchable languages, and accessibility needs — and SHALL NOT require or show travel radius. Coverage-matrix rows for that Scenario SHALL match the updated title/assertions.

#### Scenario: Profile feature file Vibes has no travel radius

- **WHEN** an implementer reads the Vibes scenario in `docs/product/features/profile.feature`
- **THEN** it mentions updating interests (including Other + free text), districts (12 Bezirke), languages (searchable list), or accessibility needs as implemented
- **AND** travel radius is not part of the Vibes form

#### Scenario: Profile e2e Vibes asserts no travel radius

- **WHEN** `e2e/specs/profile.spec.ts` runs Scenario Edit cultural preferences ("Vibes")
- **THEN** the preferences form has no travel-distance control
- **AND** saving preferences still succeeds

## MODIFIED Requirements

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests (including Other + free text), moods, districts, timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists (including the 12 Berlin Bezirke for districts). Travel radius (`max_distance`) SHALL NOT be collected or required. Persistence SHALL merge into `users.profile`, set `max_distance` to `null`, set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates interests (including Other + free text), moods, districts (12 Bezirke), timing, preferred days, languages (searchable list), or accessibility needs and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile
- **AND** `max_distance` is cleared to `null`
- **AND** travel radius is not part of the Vibes form

#### Scenario: Preference save preserves onboarding state

- **WHEN** an onboarded member saves cultural preferences
- **THEN** `behavior.onboarding_step` and `profile.onboarding_complete` are unchanged
- **AND** `behavior.preferences_updated_at` is updated

#### Scenario: Invalid preference values rejected

- **WHEN** a preference payload contains a value outside the onboarding allowlists
- **THEN** the update fails validation without mutating preference fields
