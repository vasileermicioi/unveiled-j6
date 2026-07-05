## ADDED Requirements

### Requirement: Onboarding preference allowlists

The system SHALL accept only the preference values defined in `docs/migration/features/onboarding.feature`: age groups `18-25`, `26-35`, `36-50`, `50+`; interests Theater, Kino, Museum, Ausstellung, Konzert, Talk/Lesung, Comedy, Tanz/Performance; moods Leicht, Experimentell, Klassisch, Politisch, Fam; districts Mitte, X-Berg, P-Berg, Charlottenburg, Wedding, F-Hain, Schöneberg; timing After Work, Weekend, Day; weekdays Monday–Sunday; preferred languages DE, EN, Non-Verbal; `max_distance` integer 1–25 km; `accessibility` boolean.

#### Scenario: Invalid interest rejected

- **WHEN** a save helper receives an interest not in the allowlist
- **THEN** the operation fails validation without mutating `users.profile`

#### Scenario: Distance out of range rejected

- **WHEN** `max_distance` is 0 or 26
- **THEN** the operation fails validation

### Requirement: Onboarding step resolution

The `@unveiled/auth` package SHALL expose a function that returns the locale-relative onboarding path for an incomplete USER based on saved progress, defaulting new users to `/onboarding/age`.

#### Scenario: New user starts at age

- **WHEN** a USER has `profile.onboarding_complete = false` and no onboarding progress
- **THEN** step resolution returns `/onboarding/age`

#### Scenario: Progress resumes at interests

- **WHEN** age step is done (including skip) and interests are not yet saved
- **THEN** step resolution returns `/onboarding/interests`

#### Scenario: Progress resumes at location

- **WHEN** interests and moods are saved and location preferences are not yet saved
- **THEN** step resolution returns `/onboarding/location`

#### Scenario: Progress resumes at timing

- **WHEN** location step is saved and timing preferences are not yet saved
- **THEN** step resolution returns `/onboarding/timing`

### Requirement: Profile persistence helpers

The system SHALL merge onboarding step payloads into `public.users.profile` JSONB and update behavior timestamps (`preferences_updated_at`; `onboarding_completed_at` on completion) without touching unrelated profile fields such as `first_name`. Each successful step save SHALL update `behavior.onboarding_step` to the next step (or clear it on completion).

#### Scenario: Age skip advances without age_group

- **WHEN** step `age` is submitted with an explicit skip action
- **THEN** `age_group` remains null and progress advances to interests

#### Scenario: Partial save preserves other profile fields

- **WHEN** an onboarding step payload is saved for a user with existing `first_name` and `last_name`
- **THEN** only fields for the current step are merged and name fields remain unchanged

#### Scenario: Completion marks profile complete

- **WHEN** `completeOnboarding` runs after step `timing` is saved
- **THEN** `profile.onboarding_complete` is true, `behavior.onboarding_completed_at` is set, and `behavior.onboarding_step` is cleared or frozen

#### Scenario: Preferences timestamp updated on save

- **WHEN** any onboarding step is saved successfully
- **THEN** `behavior.preferences_updated_at` is set to an ISO timestamp in Europe/Berlin timezone semantics
