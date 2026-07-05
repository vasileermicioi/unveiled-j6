## ADDED Requirements

### Requirement: Protected route redirect

Unauthenticated visitors attempting to access authenticated-only path prefixes SHALL be redirected to `/:locale/login`.

#### Scenario: Guest blocked from events feed prefix

- **WHEN** an unauthenticated visitor requests `/de/events`
- **THEN** the server responds with a redirect to `/de/login`

#### Scenario: Guest blocked from profile prefix

- **WHEN** an unauthenticated visitor requests `/en/profile`
- **THEN** the server responds with a redirect to `/en/login`

#### Scenario: Guest blocked from onboarding prefix

- **WHEN** an unauthenticated visitor requests `/de/onboarding`
- **THEN** the server responds with a redirect to `/de/login`

### Requirement: Role-based route redirect skeleton

Authenticated users attempting to access areas outside their role SHALL be redirected away from forbidden prefixes.

#### Scenario: USER blocked from partner portal prefix

- **WHEN** a signed-in USER requests `/de/partner`
- **THEN** the server redirects to `/de`

#### Scenario: USER blocked from admin prefix

- **WHEN** a signed-in USER requests `/de/admin`
- **THEN** the server redirects away from the admin area to `/de`

#### Scenario: PARTNER blocked from admin prefix

- **WHEN** a signed-in PARTNER requests `/en/admin`
- **THEN** the server redirects to `/en`

### Requirement: Authenticated navbar state

The app shell navbar SHALL reflect signed-in state when a valid session exists, including a credits display placeholder and a logout action.

#### Scenario: Signed-in navbar

- **WHEN** a signed-in member views any locale page
- **THEN** the navbar shows authenticated affordances including a credits badge and logout control

#### Scenario: Guest navbar login links

- **WHEN** an unauthenticated visitor views any locale page
- **THEN** the navbar includes links to `/:locale/login` and `/:locale/signup`

#### Scenario: Credits from session

- **WHEN** a signed-in member with 17 credits views any locale page
- **THEN** the navbar credits display shows 17 credits

### Requirement: Logout

Signed-in users SHALL be able to log out, ending the session and returning to the locale home page.

#### Scenario: Logout flow

- **WHEN** a signed-in user activates logout
- **THEN** the session ends and the browser navigates to `/:locale`

#### Scenario: Post-logout protected access

- **WHEN** a user logs out and then requests a protected path prefix
- **THEN** they are redirected to login

### Requirement: Phase 2 release gate

Phase 2 auth SHALL be complete when staging supports signup, login, logout, password reset, Google OAuth, authenticated navbar, and protected-route redirects without console errors on `/de` and `/en`.

#### Scenario: Client demo acceptance

- **WHEN** the client runs the Phase 2 demo on staging
- **THEN** they can sign up, log in, see authenticated navbar state, log out, and reset password via email

#### Scenario: Google OAuth on staging

- **WHEN** the client uses Google sign-in on staging
- **THEN** a new or returning USER session is established with correct starter or existing account state

#### Scenario: No console errors on locale roots

- **WHEN** a guest or signed-in user loads `/de` or `/en` on staging
- **THEN** the browser console shows no errors
