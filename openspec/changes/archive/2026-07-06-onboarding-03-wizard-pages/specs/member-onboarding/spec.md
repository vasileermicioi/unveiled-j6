## ADDED Requirements

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
