## ADDED Requirements

### Requirement: Auth screens offer email/password only
The system SHALL offer email/password sign-in and sign-up on `/:locale/login` and `/:locale/signup` and MUST NOT show a Google OAuth (or other social) control, including “Continue with Google” / “Weiter mit Google”. Page copy on those routes MUST NOT promise Google sign-in.

#### Scenario: Auth screens do not offer Google
- **WHEN** a guest opens `/:locale/login` or `/:locale/signup`
- **THEN** email and password fields are available
- **AND** no Google / social-login control is visible
- **AND** the page description does not mention Google

## MODIFIED Requirements

### Requirement: Automated browser coverage for auth flows
Each implementable Gherkin scenario in `docs/product/features/auth.feature` SHALL have a Playwright test in `e2e/specs/auth.spec.ts` with a title matching the scenario line (or Scenario Outline plus example row). There is no Google OAuth skip: Google is not offered, so the suite MUST NOT `test.skip` Google provider limitations. GDPR export/delete and admin-processed deletion SHALL pass once `gdpr-rights` ships, or use `test.skip` only with an explicit Neon Auth / env / harness reason naming the blocker (not “Phase 9 — not built”).

#### Scenario: Core auth loop is E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/auth.spec.ts`
- **THEN** signup, login, logout, validation outlines, route protection, and role-based redirects are asserted
- **AND** any skipped scenario documents the blocker or deferral owner in the skip message
- **AND** Google OAuth is not a valid skip reason

#### Scenario: Credentials come from environment

- **WHEN** an auth test needs a seeded USER or ADMIN account
- **THEN** it reads `E2E_USER_*` / `E2E_ADMIN_*` (or creates a disposable signup) and NEVER hardcodes production passwords in the spec file

#### Scenario: Password reset does not require mailbox delivery

- **WHEN** the password-reset request scenario runs
- **THEN** the test asserts the forgot-password success UI feedback only
- **AND** does not require verifying email delivery in CI

#### Scenario: GDPR scenarios no longer Phase-9 stubs

- **WHEN** gdpr-rights step 03 completes
- **THEN** the four GDPR scenarios in `auth.spec.ts` pass or skip only with Neon Auth / env / harness reasons

### Requirement: Phase 4½ release gate
The authentication domain's Phase 4½ done-when criteria SHALL include Playwright coverage for all implementable `auth.feature` scenarios. Skips are not permitted for Google OAuth. Remaining named skips are only Neon Auth / harness blockers for GDPR if still present, and that suite SHALL run as part of the CI E2E job. GDPR flows are no longer deferred solely as “Phase 9.”

#### Scenario: Auth E2E is part of phase gate

- **WHEN** Phase 4½ is declared complete
- **THEN** `e2e/specs/auth.spec.ts` is included in the CI E2E job
- **AND** every skip in that file cites the deferral owner or blocker in the skip message
- **AND** no skip cites Google OAuth or a missing Google provider

#### Scenario: Auth coverage remains env-driven

- **WHEN** CI runs auth E2E
- **THEN** credentials come from `E2E_USER_*` / `E2E_ADMIN_*` secrets (or disposable signup)
- **AND** production passwords are never hardcoded in the spec file

## REMOVED Requirements

### Requirement: Google OAuth signup and login (product)
**Reason:** Google OAuth is not implemented and MUST NOT be shown on login or signup. Product SoT no longer requires guests to sign up or log in with Google via Neon Auth. Traceability: former `auth.feature` scenarios “Sign up or log in with Google” and “Social login never creates a PARTNER or ADMIN account” (USER-only self-service remains guaranteed by “Sign up as a new member”).
**Migration:** Use email/password on `/:locale/login` and `/:locale/signup`. Re-adding Google is a new change, not a revert of this hide. Playwright for the new “Auth screens do not offer Google” scenario ships in `03-hide-google-login-02-docs-and-e2e`.
