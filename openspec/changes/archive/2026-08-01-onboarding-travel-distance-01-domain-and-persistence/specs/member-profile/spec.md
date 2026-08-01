## ADDED Requirements

### Requirement: Travel distance persistence

The system SHALL persist `users.profile.max_distance` as a positive integer kilometers within the configured bounds (inclusive **1–50** unless constants are updated in one place) when onboarding location or profile preferences are saved with a travel distance. Preference saves SHALL NOT clear `max_distance` to null as a blanket policy. Invalid, non-integer, missing (on location-touching saves), or out-of-range values SHALL be rejected with a typed validation error without mutating preference fields. Legacy `districts` SHALL still be cleared on location writes. GDPR anonymization SHALL continue to remove preference fields including `max_distance` (full profile wipe remains acceptable).

#### Scenario: Preference save keeps max_distance

- **WHEN** a member saves preferences including zip_code and max_distance = 10
- **THEN** profile.max_distance is 10 after save

#### Scenario: Out-of-range distance rejected

- **WHEN** a save includes max_distance outside the allowed bounds
- **THEN** the save is rejected with a validation error

#### Scenario: Non-integer distance rejected

- **WHEN** a save includes max_distance that is not a finite integer (for example 10.5 or a non-numeric string)
- **THEN** the save is rejected with a validation error

#### Scenario: Location save with zip and distance round-trips

- **WHEN** a preference or onboarding location save includes a valid Berlin zip_code and max_distance within bounds
- **THEN** the persisted profile contains both zip_code and max_distance
- **AND** districts is cleared (null or absent)

## MODIFIED Requirements

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests (including Other + free text), moods, location (`country` / `city` / `zip_code` under Germany/Berlin defaults for this release), timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists for non-location fields; location SHALL use the shared postal registry (Berlin PLZ under `DE` / `berlin`) rather than the 12 Berlin Bezirke `districts` multi-select. The Vibes location editor SHALL show country and city as prefilled, non-editable Germany/Berlin display (submitted as `DE` / `berlin`) plus a native zip input with locale labels (Country / Land, City / Stadt, PLZ / Zip code) and a short hint that Unveiled currently serves Berlin. Persistence SHALL merge into `users.profile`, store the location trio, clear legacy `districts`, persist validated `max_distance` (integer km within configured bounds), set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`. Preference saves SHALL NOT clear `max_distance` to null as a blanket policy. Invalid or non-Berlin zip or invalid `max_distance` SHALL be rejected with a user-visible / typed validation error without mutating preference fields. Dedicated travel-distance form chrome and copy MAY be completed in the follow-on UI step (`onboarding-travel-distance-02`); domain persistence and validation SHALL accept and store `max_distance` in this change.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates interests (including Other + free text), moods, location zip under Germany/Berlin, max_distance within bounds, timing, preferred days, languages (searchable list), or accessibility needs and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile including `country`, `city`, `zip_code`, and `max_distance`
- **AND** `max_distance` is not cleared to `null` by policy

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
