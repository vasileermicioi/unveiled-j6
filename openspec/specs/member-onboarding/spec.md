# Member Onboarding

Server-side onboarding domain for the four-step member preference wizard. Phase 3 step 01 covers `@unveiled/auth` helpers; step 02 adds locale middleware guards; step 03 ships the four SSR wizard pages under `/:locale/onboarding/*`.

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

### Requirement: Onboarding route map

The application SHALL expose locale-prefixed onboarding pages at `/onboarding/age`, `/onboarding/interests`, `/onboarding/location`, and `/onboarding/timing` for signed-in USERs with incomplete onboarding.

#### Scenario: German age step

- **WHEN** an incomplete USER navigates to `/de/onboarding/age`
- **THEN** a server-rendered age selection form is displayed with skip and continue actions

#### Scenario: Onboarding pages not indexed

- **WHEN** a crawler loads any onboarding page
- **THEN** the HTML includes `<meta name="robots" content="noindex">`

### Requirement: Step 1 age group skippable

Step 1 SHALL allow selecting one age group or skipping without selecting.

#### Scenario: Age selected

- **WHEN** the USER posts a valid age group on step 1
- **THEN** `profile.age_group` is saved and the USER is redirected to `/onboarding/interests`

#### Scenario: Age skipped

- **WHEN** the USER submits skip on step 1
- **THEN** the USER is redirected to `/onboarding/interests` without setting `age_group`

### Requirement: Step 2 interests and moods

Step 2 SHALL capture multi-select interests and moods from the feature allowlists via SSR form POST.

#### Scenario: Interests saved

- **WHEN** the USER submits valid interest and mood selections
- **THEN** `profile.interests` and `profile.moods` are persisted and the USER is redirected to `/onboarding/location`

### Requirement: Step 3 districts and travel radius

Step 3 SHALL capture multi-select districts and `max_distance` between 1 and 25 km.

#### Scenario: Location preferences saved

- **WHEN** the USER submits valid districts and radius
- **THEN** `profile.districts` and `profile.max_distance` are persisted and the USER is redirected to `/onboarding/timing`

### Requirement: Step 4 timing days languages accessibility

Step 4 SHALL capture timing preference, preferred days, preferred languages, and accessibility toggle.

#### Scenario: Final step completes onboarding

- **WHEN** the USER submits valid step 4 data
- **THEN** remaining profile fields are saved, `onboarding_complete` is true, and the USER is redirected to `/:locale/membership`

### Requirement: HeroUI onboarding UI

Onboarding screens SHALL use HeroUI form primitives and global theme tokens; no raw HTML elements or shadcn components.

#### Scenario: Theme consistency

- **WHEN** a USER views `/de/onboarding/interests`
- **THEN** the page uses brand-yellow background and HeroUI themed form controls

### Requirement: Onboarding route auth guards

Each onboarding route SHALL require a signed-in USER session and redirect users who have already completed onboarding away from the wizard.

#### Scenario: Unauthenticated visitor redirected to login

- **WHEN** a guest requests `/:locale/onboarding/age`
- **THEN** the server redirects to `/:locale/login`

#### Scenario: Complete USER redirected from wizard

- **WHEN** a USER with `onboarding_complete = true` requests any onboarding step
- **THEN** the server redirects to `/:locale/events`

#### Scenario: Out-of-order POST rejected

- **WHEN** an incomplete USER POSTs to a step ahead of their resolved progress
- **THEN** the server redirects to the resolved step path from `getOnboardingStepPath`

### Requirement: Phase 3 release gate

Phase 3 onboarding SHALL be complete when staging supports the full four-step wizard, onboarding guards, skip-age flow, and membership redirect without console errors on `/de` and `/en`.

#### Scenario: Client demo acceptance

- **WHEN** the client runs the Phase 3 demo on staging
- **THEN** they can sign up, complete all onboarding steps (including skip on age), land on membership, and a returning complete user skips the wizard

#### Scenario: No console errors on onboarding routes

- **WHEN** an incomplete USER loads each onboarding step on staging in DE and EN
- **THEN** the browser console shows no errors

#### Scenario: Preferences persisted for admin intel

- **WHEN** onboarding completes on staging
- **THEN** `users.profile` contains the captured arrays and flags even though feed ranking is not yet implemented
