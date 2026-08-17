## MODIFIED Requirements

### Requirement: Automated browser coverage for auth flows
Each implementable Gherkin scenario in `docs/product/features/auth.feature` SHALL have a Playwright test in `e2e/specs/auth.spec.ts` with a title matching the scenario line (or Scenario Outline plus example row). There is no Google OAuth skip: Google is not offered, so the suite MUST NOT `test.skip` Google provider limitations. The scenario `Auth screens do not offer Google` SHALL pass in CI without `test.skip`. GDPR export/delete and admin-processed deletion SHALL pass once `gdpr-rights` ships, or use `test.skip` only with an explicit Neon Auth / env / harness reason naming the blocker (not “Phase 9 — not built”).

#### Scenario: Core auth loop is E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/auth.spec.ts`
- **THEN** signup, login, logout, validation outlines, route protection, role-based redirects, and the absence of Google/social login are asserted
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

#### Scenario: Auth screens do not offer Google is E2E-verified

- **WHEN** `Scenario: Auth screens do not offer Google` runs
- **THEN** the test is not skipped
- **AND** a guest opening `/:locale/login` and `/:locale/signup` sees email and password fields
- **AND** no button or link named Google / Continue with Google / Weiter mit Google is visible
- **AND** the page description does not mention Google

### Requirement: Phase 4½ release gate
The authentication domain's Phase 4½ done-when criteria SHALL include Playwright coverage for all implementable `auth.feature` scenarios. The authentication suite in CI SHALL NOT skip Google OAuth. Coverage matrix and `e2e/README.md` SHALL list the no-Google scenario as `pass`, not `deferred`. Remaining named skips are only Neon Auth / harness blockers for GDPR if still present, and that suite SHALL run as part of the CI E2E job. GDPR flows are no longer deferred solely as “Phase 9.”

#### Scenario: Auth E2E is part of phase gate

- **WHEN** Phase 4½ is declared complete
- **THEN** `e2e/specs/auth.spec.ts` is included in the CI E2E job
- **AND** every skip in that file cites the deferral owner or blocker in the skip message
- **AND** no skip cites Google OAuth or a missing Google provider

#### Scenario: Auth coverage remains env-driven

- **WHEN** CI runs auth E2E
- **THEN** credentials come from `E2E_USER_*` / `E2E_ADMIN_*` secrets (or disposable signup)
- **AND** production passwords are never hardcoded in the spec file

#### Scenario: No-Google coverage is pass not deferred

- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` and `e2e/README.md` after this change
- **THEN** `Scenario: Auth screens do not offer Google` is listed as `pass`
- **AND** former Google OAuth scenarios are absent (not `deferred`)
