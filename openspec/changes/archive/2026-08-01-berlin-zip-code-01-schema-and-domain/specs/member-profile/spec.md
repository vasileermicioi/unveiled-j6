## ADDED Requirements

### Requirement: Location preference storage

Member profile location preference SHALL store `country`, `city`, and `zip_code` on `users.profile`. For this release, saves SHALL default or require `country = DE` and `city = berlin` with a valid Berlin `zip_code` validated via shared `validatePostalCode({ country, city, zipCode })`. The system SHALL NOT collect or persist `districts` arrays for active preference saves. Legacy `districts` keys SHALL be cleared or ignored on write. Unsupported country/city pairs and invalid postal codes SHALL be rejected with a typed validation error.

#### Scenario: Preference save stores zip under Germany/Berlin

- **WHEN** a member preference save includes a valid Berlin zip (country/city defaulted or explicit)
- **THEN** `profile.country`, `profile.city`, and `profile.zip_code` are stored and `districts` is not required

#### Scenario: Preference save clears legacy districts

- **WHEN** a member preference save successfully stores a location trio
- **THEN** `profile.districts` is cleared (null or absent) on the persisted profile

#### Scenario: Invalid zip rejected on preference save

- **WHEN** a preference save includes a malformed or non-Berlin zip under `(DE, berlin)`
- **THEN** the update fails validation without mutating location preference fields

#### Scenario: Unsupported city rejected on preference save

- **WHEN** a preference save includes a country/city pair that is not in the postal registry
- **THEN** the update fails validation without mutating location preference fields

## MODIFIED Requirements

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests (including Other + free text), moods, location (`country` / `city` / `zip_code` under Germany/Berlin defaults for this release), timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists for non-location fields; location SHALL use the shared postal registry (Berlin PLZ under `DE` / `berlin`) rather than the 12 Berlin Bezirke `districts` multi-select. Travel radius (`max_distance`) SHALL NOT be collected or required. Persistence SHALL merge into `users.profile`, store the location trio, clear legacy `districts`, set `max_distance` to `null`, set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`. Dedicated zip form chrome and copy MAY be completed in the follow-on UI step; domain persistence and validation SHALL accept the location trio in this change.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates interests (including Other + free text), moods, location zip under Germany/Berlin, timing, preferred days, languages (searchable list), or accessibility needs and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile including `country`, `city`, and `zip_code`
- **AND** `max_distance` is cleared to `null`
- **AND** travel radius is not part of the Vibes form

#### Scenario: Preference save preserves onboarding state

- **WHEN** an onboarded member saves cultural preferences
- **THEN** `behavior.onboarding_step` and `profile.onboarding_complete` are unchanged
- **AND** `behavior.preferences_updated_at` is updated

#### Scenario: Invalid preference values rejected

- **WHEN** a preference payload contains a value outside the onboarding allowlists or an invalid location trio
- **THEN** the update fails validation without mutating preference fields
