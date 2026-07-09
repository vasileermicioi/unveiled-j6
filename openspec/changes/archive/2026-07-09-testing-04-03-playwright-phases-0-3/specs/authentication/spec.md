## ADDED Requirements

### Requirement: Automated browser coverage for auth flows

Each implementable Gherkin scenario in `docs/migration/features/auth.feature` SHALL have a Playwright test in `e2e/specs/auth.spec.ts` with a title matching the scenario line (or Scenario Outline plus example row). Deferred scenarios (GDPR export/delete, admin-processed deletion) and Google OAuth when CI cannot complete the provider flow SHALL use `test.skip` with an explicit reason string naming the target phase or blocker.

#### Scenario: Core auth loop is E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/auth.spec.ts`
- **THEN** signup, login, logout, validation outlines, route protection, and role-based redirects are asserted
- **AND** any skipped scenario documents the target phase and reason in the skip message

#### Scenario: Credentials come from environment

- **WHEN** an auth test needs a seeded USER or ADMIN account
- **THEN** it reads `E2E_USER_*` / `E2E_ADMIN_*` (or creates a disposable signup) and NEVER hardcodes production passwords in the spec file

#### Scenario: Password reset does not require mailbox delivery

- **WHEN** the password-reset request scenario runs
- **THEN** the test asserts the forgot-password success UI feedback only
- **AND** does not require verifying email delivery in CI
