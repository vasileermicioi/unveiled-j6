# Authentication

Neon Auth (Better Auth backend) plus application user persistence in Postgres.

## Requirements

### Requirement: App users table

The system SHALL store application user records in `public.users` with `id` matching the Better Auth user id from Neon Auth, separate from Neon Auth's managed auth tables. Drizzle SHALL NOT model the `neon_auth` schema.

#### Scenario: Users table exists after migration

- **WHEN** auth step 01 migrations have been applied
- **THEN** `public.users` exists with columns `id`, `email`, `email_verified`, `role`, `credits`, `partner_id`, `profile`, `behavior`, `created_at`, `updated_at`, and `deleted_at`

#### Scenario: Role enum constraint

- **WHEN** a row is inserted into `public.users`
- **THEN** `role` accepts only `USER`, `ADMIN`, or `PARTNER`

#### Scenario: Credits non-negative

- **WHEN** a row is inserted or updated in `public.users`
- **THEN** `credits` is constrained to be greater than or equal to zero

### Requirement: Subscriptions table

The system SHALL store subscription state in a 1:1 `public.subscriptions` table keyed by `user_id` referencing `public.users.id`.

#### Scenario: Subscriptions table exists after migration

- **WHEN** auth step 01 migrations have been applied
- **THEN** `public.subscriptions` exists with `user_id` FK to `public.users.id` and a `status` enum including `INACTIVE`

### Requirement: Typed database client export

The `@unveiled/db` package SHALL export a typed Drizzle client and schema symbols consumable by `@unveiled/auth` and route handlers without importing from `apps/web`.

#### Scenario: Package import from future auth package

- **WHEN** `@unveiled/auth` imports `createDb` (or equivalent) from `@unveiled/db`
- **THEN** TypeScript resolves the client with typed `users` and `subscriptions` tables

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

### Requirement: Auth route map

The application SHALL expose locale-prefixed auth pages at `/login`, `/signup`, `/forgot-password`, and `/reset-password` under `/:locale/`.

#### Scenario: German login page

- **WHEN** a visitor navigates to `/de/login`
- **THEN** a server-rendered sign-in form is displayed with email/password and Google options

#### Scenario: English signup page

- **WHEN** a visitor navigates to `/en/signup`
- **THEN** a server-rendered registration form collects email, password, first name, and last name

#### Scenario: Auth pages not indexed

- **WHEN** a crawler loads any auth page
- **THEN** the HTML includes `<meta name="robots" content="noindex">`

### Requirement: HeroUI auth UI variant

Auth screens SHALL use `@better-auth-ui/heroui` components and `@better-auth-ui/react` hooks, inheriting the HeroUI Uber theme reskin. The shadcn auth variant SHALL NOT be used.

#### Scenario: No shadcn dependency

- **WHEN** `apps/web/package.json` is inspected after this step
- **THEN** `@better-auth-ui/shadcn` is not listed as a dependency

#### Scenario: Theme consistency

- **WHEN** a user views `/de/login`
- **THEN** the page background is brand-yellow and form surfaces use the global HeroUI theme tokens from `globals.css`

### Requirement: Signup validation

The signup form SHALL reject invalid input client-side before contacting the server.

#### Scenario: Invalid email

- **WHEN** a visitor submits signup with email `not-an-email`
- **THEN** a validation error is shown for the email field

#### Scenario: Password too short

- **WHEN** a visitor submits signup with password `12345`
- **THEN** a validation error is shown for the password field

#### Scenario: Missing name

- **WHEN** a visitor submits signup with an empty first or last name
- **THEN** a validation error is shown for the name field

### Requirement: Password reset flow

The application SHALL provide forgot-password and reset-password pages wired to Neon Auth's email reset flow.

#### Scenario: Request reset email

- **WHEN** a visitor submits a valid email on `/forgot-password`
- **THEN** Neon Auth sends a password reset email to that address

#### Scenario: Empty email rejected

- **WHEN** a visitor submits the forgot-password form with an empty email
- **THEN** the request is rejected client-side with a validation error

### Requirement: Google OAuth sign-in

Login and signup pages SHALL offer "Continue with Google" via Neon Auth's social provider, configured in the Neon Auth project (not app env vars).

#### Scenario: Google sign-in button present

- **WHEN** a visitor views `/de/login` or `/de/signup`
- **THEN** a Google OAuth sign-in option is visible

#### Scenario: Returning Google user

- **WHEN** a visitor signs in with Google and an account with matching email already exists
- **THEN** they are signed into the existing account without creating a duplicate
