## ADDED Requirements

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
