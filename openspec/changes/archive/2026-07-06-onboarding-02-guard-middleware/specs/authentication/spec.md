## MODIFIED Requirements

### Requirement: Protected route redirect

Unauthenticated visitors attempting to access authenticated-only path prefixes SHALL be redirected to `/:locale/login`. Signed-in USERs with incomplete onboarding attempting member app prefixes (`events`, `saved`, `bookings`, `profile`) SHALL be redirected to their current onboarding step by onboarding middleware evaluated after session establishment.

#### Scenario: Guest blocked from events feed prefix

- **WHEN** an unauthenticated visitor requests `/de/events`
- **THEN** the server responds with a redirect to `/de/login`

#### Scenario: Guest blocked from profile prefix

- **WHEN** an unauthenticated visitor requests `/en/profile`
- **THEN** the server responds with a redirect to `/en/login`

#### Scenario: Guest blocked from onboarding prefix

- **WHEN** an unauthenticated visitor requests `/de/onboarding`
- **THEN** the server responds with a redirect to `/de/login`

#### Scenario: Incomplete USER blocked from events feed prefix

- **WHEN** a signed-in USER with `onboardingComplete = false` requests `/de/events`
- **THEN** the server responds with a redirect to the current onboarding step under `/de/onboarding/*`
