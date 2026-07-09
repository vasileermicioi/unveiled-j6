## ADDED Requirements

### Requirement: Phase 4½ release gate

The authentication domain's Phase 4½ done-when criteria SHALL include Playwright coverage for all implementable `auth.feature` scenarios, with explicitly marked skips only for Phase 9 GDPR flows and optional Google OAuth CI limitations, and that suite SHALL run as part of the CI E2E job.

#### Scenario: Auth E2E is part of phase gate

- **WHEN** Phase 4½ is declared complete
- **THEN** `e2e/specs/auth.spec.ts` is included in the CI E2E job
- **AND** every skip in that file cites the deferral phase or blocker in the skip message

#### Scenario: Auth coverage remains env-driven

- **WHEN** CI runs auth E2E
- **THEN** credentials come from `E2E_USER_*` / `E2E_ADMIN_*` secrets (or disposable signup)
- **AND** production passwords are never hardcoded in the spec file
