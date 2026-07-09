## ADDED Requirements

### Requirement: CI runs Playwright E2E suite

The repository CI pipeline SHALL execute `bun run test:e2e` against a local SSR instance before staging deploy is considered successful.

#### Scenario: Main branch quality gate includes E2E

- **WHEN** a commit is pushed to `main`
- **THEN** lint, typecheck, build, and Playwright E2E run
- **AND** a failing E2E job blocks deploy

#### Scenario: CI E2E uses local SSR

- **WHEN** the E2E job runs in CI
- **THEN** `SITE_URL` is `http://localhost:3000` (or equivalent local origin)
- **AND** Playwright starts or reuses the app via its configured `webServer` / `bun run dev`
- **AND** the job does not use the staging public URL as the primary CI target

#### Scenario: Required secrets are documented

- **WHEN** an operator reads `apps/web/DEPLOYMENT.md` Phase 4½
- **THEN** GitHub secret names required for CI E2E are listed (values omitted)
- **AND** optional R2 secret names are listed separately from required auth/DB secrets

### Requirement: Testing documentation in deployment guide

`apps/web/DEPLOYMENT.md` SHALL document how to run Ladle stories and Playwright E2E locally and in CI, including required env vars and known marked skips.

#### Scenario: Operator runs Phase 4½ demo

- **WHEN** an operator follows DEPLOYMENT.md Phase 4½ instructions
- **THEN** they can start story servers and execute the full E2E suite with documented demo credentials

#### Scenario: Known skips are explicit

- **WHEN** an operator reads the Phase 4½ section
- **THEN** permanently or conditionally skipped scenarios (Phase 9 GDPR, Google OAuth CI limits, missing R2) are listed with owners or deferral phases
