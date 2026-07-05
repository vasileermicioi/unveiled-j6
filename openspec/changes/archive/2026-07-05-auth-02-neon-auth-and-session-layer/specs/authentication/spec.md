## ADDED Requirements

### Requirement: Same-origin Better Auth forward proxy

The application SHALL expose Better Auth at `/api/auth/*` on the same origin as the SSR app, forwarding requests to `AUTH_URL` (Neon's Better Auth backend). No Better Auth server or `neon_auth` Drizzle schema is implemented in this repo.

#### Scenario: Auth API reachable

- **WHEN** a client requests `GET /api/auth/get-session`
- **THEN** the request is forwarded to `AUTH_URL` and a valid Better Auth-compatible response is returned

#### Scenario: Cookies preserved

- **WHEN** a client completes a sign-in through the forwarded auth API
- **THEN** session cookies are set on the application origin (not a cross-origin Neon URL)

#### Scenario: Forward-only proxy

- **WHEN** any `/api/auth/*` request is handled
- **THEN** the handler forwards method, path, body, and auth headers/cookies to `AUTH_URL` without custom Better Auth route logic

### Requirement: Session parsing middleware

The `@unveiled/auth` package SHALL parse the current session into an `AppSession` with app fields (`role`, `credits`, `partnerId`, `onboardingComplete`) joined from `public.users`.

#### Scenario: Authenticated session resolved

- **WHEN** a valid session cookie is present and a matching `public.users` row exists
- **THEN** `getSession` returns the user with `role`, `credits`, and `onboardingComplete` from the database

#### Scenario: Neon Auth user without app row

- **WHEN** a valid Neon Auth session exists but no `public.users` row is present
- **THEN** the system provisions a new USER account before returning the session

### Requirement: New member starter state

On first provisioning of a self-service account (email/password or Google OAuth), the system SHALL create a `USER` with 17 credits, subscription status `INACTIVE`, and `onboarding_complete: false`.

#### Scenario: Email signup provisioning

- **WHEN** a new member completes signup via email/password
- **THEN** `public.users` has `role=USER`, `credits=17`, `profile.onboarding_complete=false`, and `public.subscriptions.status=INACTIVE`

#### Scenario: Google first login provisioning

- **WHEN** a visitor signs in with Google for the first time
- **THEN** the created account matches the same starter state as email signup

#### Scenario: Social login never creates elevated roles

- **WHEN** a visitor authenticates via Google OAuth for the first time
- **THEN** the provisioned `role` is always `USER`, never `PARTNER` or `ADMIN`

### Requirement: Role guard helpers

The `@unveiled/auth` package SHALL export middleware guards that enforce authentication and optional role membership for HonoX routes.

#### Scenario: Unauthenticated access to guarded handler

- **WHEN** `requireAuth` wraps a handler and no session exists
- **THEN** the handler is not executed and the middleware signals unauthorized

#### Scenario: Wrong role rejected

- **WHEN** `requireRole('ADMIN')` wraps a handler and the session user has `role=USER`
- **THEN** the handler is not executed and the middleware signals forbidden
