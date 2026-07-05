# Member Onboarding

Server-side onboarding domain for the four-step member preference wizard. Phase 3 step 01 covers `@unveiled/auth` helpers; step 02 adds locale middleware guards; wizard UI ships in step 03.

## Requirements

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

### Requirement: Onboarding required before member app

Signed-in USERs with `onboarding_complete = false` SHALL be redirected away from member app path prefixes to their current onboarding step.

#### Scenario: Events feed blocked until onboarding complete

- **WHEN** an incomplete USER requests `/:locale/events`
- **THEN** the server responds with a redirect to `/:locale/onboarding/age` (or the resumed step path from `getOnboardingStepPath`)

#### Scenario: Saved list blocked until onboarding complete

- **WHEN** an incomplete USER requests `/:locale/saved`
- **THEN** the server responds with a redirect to the current onboarding step under `/:locale/onboarding/*`

#### Scenario: Bookings blocked until onboarding complete

- **WHEN** an incomplete USER requests `/:locale/bookings`
- **THEN** the server responds with a redirect to the current onboarding step under `/:locale/onboarding/*`

#### Scenario: Profile blocked until onboarding complete

- **WHEN** an incomplete USER requests `/:locale/profile`
- **THEN** the server responds with a redirect to the current onboarding step under `/:locale/onboarding/*`

### Requirement: Membership reachable during onboarding

Signed-in USERs with incomplete onboarding SHALL retain access to the membership path without being redirected solely for incomplete onboarding status.

#### Scenario: Membership reachable during onboarding

- **WHEN** an incomplete USER requests `/:locale/membership`
- **THEN** the request is not redirected to onboarding solely for incomplete status

#### Scenario: Marketing routes remain reachable during onboarding

- **WHEN** an incomplete USER requests a public marketing path such as `/:locale/discover`
- **THEN** the onboarding middleware does not redirect them to the wizard

### Requirement: Completed users skip wizard

Signed-in USERs with `onboarding_complete = true` SHALL not access onboarding routes.

#### Scenario: Direct wizard access redirects to feed

- **WHEN** a complete USER requests `/:locale/onboarding/age`
- **THEN** the server redirects to `/:locale/events`

#### Scenario: Any onboarding step redirects to feed

- **WHEN** a complete USER requests any path under `/:locale/onboarding/*`
- **THEN** the server redirects to `/:locale/events`

### Requirement: Non-USER roles skip onboarding

PARTNER and ADMIN sessions SHALL never be redirected into the onboarding wizard.

#### Scenario: Partner not sent to onboarding

- **WHEN** a signed-in PARTNER requests any member or onboarding path
- **THEN** onboarding middleware does not redirect them into `/:locale/onboarding/*`

#### Scenario: Partner hitting onboarding prefix redirected to role home

- **WHEN** a signed-in PARTNER requests `/:locale/onboarding/age`
- **THEN** the server redirects to `/:locale` (role home stub until `/partner` exists)

#### Scenario: Admin not sent to onboarding

- **WHEN** a signed-in ADMIN loads the app or requests any onboarding path
- **THEN** onboarding middleware never forces an onboarding redirect

#### Scenario: Admin hitting onboarding prefix redirected to role home

- **WHEN** a signed-in ADMIN requests `/:locale/onboarding/age`
- **THEN** the server redirects to `/:locale` (role home stub until `/admin` exists)
