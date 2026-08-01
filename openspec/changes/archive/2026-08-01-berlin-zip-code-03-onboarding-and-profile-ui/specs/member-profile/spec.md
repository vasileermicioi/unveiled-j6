## MODIFIED Requirements

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests (including Other + free text), moods, location (`country` / `city` / `zip_code` under Germany/Berlin defaults for this release), timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists for non-location fields; location SHALL use the shared postal registry (Berlin PLZ under `DE` / `berlin`) rather than the 12 Berlin Bezirke `districts` multi-select. The Vibes location editor SHALL show country and city as prefilled, non-editable Germany/Berlin display (submitted as `DE` / `berlin`) plus a native zip input with locale labels (Country / Land, City / Stadt, PLZ / Zip code) and a short hint that Unveiled currently serves Berlin. Travel radius (`max_distance`) SHALL NOT be collected or required. Persistence SHALL merge into `users.profile`, store the location trio, clear legacy `districts`, set `max_distance` to `null`, set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`. Invalid or non-Berlin zip SHALL be rejected with a user-visible error without mutating preference fields.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates interests (including Other + free text), moods, location zip under Germany/Berlin, timing, preferred days, languages (searchable list), or accessibility needs and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile including `country`, `city`, and `zip_code`
- **AND** `max_distance` is cleared to `null`
- **AND** travel radius is not part of the Vibes form

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

- **WHEN** a preference payload contains a value outside the onboarding allowlists or an invalid location trio
- **THEN** the update fails validation without mutating preference fields
