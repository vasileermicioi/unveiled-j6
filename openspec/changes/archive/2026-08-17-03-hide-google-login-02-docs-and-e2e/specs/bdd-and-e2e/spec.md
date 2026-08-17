## ADDED Requirements

### Requirement: Auth coverage inventory has no Google deferral
`docs/product/testing/coverage-matrix.md`, `docs/product/testing/bdd-and-e2e.md`, and `e2e/README.md` SHALL map `docs/product/features/auth.feature` scenario `Auth screens do not offer Google` to a Playwright test in `e2e/specs/auth.spec.ts` with status `pass`. Google OAuth signup/login and “social login never creates PARTNER/ADMIN” SHALL NOT remain as `deferred` rows or skip-inventory entries. Google OAuth is not a valid `test.skip` reason.

#### Scenario: Coverage matrix lists no-Google as pass
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** `Auth screens do not offer Google` maps to `e2e/specs/auth.spec.ts` with status `pass`
- **AND** rows for `Sign up or log in with Google` and `Social login never creates a PARTNER or ADMIN account` are absent or marked removed — not `deferred`

#### Scenario: Skip inventory drops Google OAuth
- **WHEN** an implementer opens `e2e/README.md` skip inventory and `bdd-and-e2e.md` residual notes after this change
- **THEN** there is no current skip or residual note that Google OAuth scenarios remain deferred for a Neon test provider
- **AND** CI notes MUST NOT say Google OAuth scenarios may `test.skip` when Neon credentials are unavailable

## MODIFIED Requirements

### Requirement: GDPR Playwright coverage
The system SHALL cover `auth.feature` GDPR scenarios (export, deletion, admin-assisted deletion, distinct from subscription cancel) in Playwright with verbatim titles, and SHALL assert profile entry points from `profile.feature`. After gdpr-rights hardening, remaining GDPR auth/profile e2e rows SHALL pass or be named-deferred with explicit reasons (Neon Auth / env / harness only — never “not built” or “Phase 9”). The coverage matrix and `e2e/README.md` SHALL reflect the updated inventory. Google OAuth is not a current skip class and MUST NOT be listed as a GDPR-adjacent deferral.

#### Scenario: GDPR scenarios executable
- **WHEN** gdpr-rights hardening completes
- **THEN** remaining GDPR auth/profile e2e rows pass or are named-deferred with reasons

#### Scenario: Coverage matrix reflects gdpr-rights close-out
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** auth GDPR scenario rows and profile “Access account deletion and data export” are `pass`, env `skip`, or named deferral — not `deferred` solely because GDPR UI is missing

#### Scenario: No silent or outdated GDPR skips
- **WHEN** `e2e/specs/auth.spec.ts` GDPR tests are reviewed after this change
- **THEN** no scenario skips solely with “Phase 9 — … not built” or equivalent “UI not built” wording
