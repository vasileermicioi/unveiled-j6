## ADDED Requirements

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
