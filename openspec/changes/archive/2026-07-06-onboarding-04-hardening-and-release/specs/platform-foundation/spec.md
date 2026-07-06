## MODIFIED Requirements

### Requirement: Deployment documentation

`apps/web/DEPLOYMENT.md` SHALL document the staging URL, build/start commands, and required environment variables. For Phase 2 staging, `DATABASE_URL` and `AUTH_URL` SHALL be documented as required, including instructions for creating a test user and enabling Google OAuth in the Neon Auth project. For Phase 3 staging, `DEPLOYMENT.md` SHALL document onboarding demo verification steps, repeat-demo reset notes, and confirmation that Phase 2 env vars remain sufficient.

#### Scenario: Phase 0 env var table

- **WHEN** a developer reads `apps/web/DEPLOYMENT.md` after Phase 0
- **THEN** they find explicit documentation that no application secrets or service credentials are required yet, with a table ready for future phases

#### Scenario: Phase 2 env var table

- **WHEN** a developer reads `apps/web/DEPLOYMENT.md` after auth step 04
- **THEN** `DATABASE_URL` and `AUTH_URL` are marked required with descriptions (`AUTH_URL` = Neon-provided Better Auth backend API)

#### Scenario: Test user instructions

- **WHEN** a developer reads `apps/web/DEPLOYMENT.md` after auth step 04
- **THEN** they find steps to create or verify a test member account on staging

#### Scenario: Build and start commands documented

- **WHEN** a developer reads `apps/web/DEPLOYMENT.md`
- **THEN** they find the exact root `bun run build` and `apps/web` start command used by CI and local prod verification

#### Scenario: Phase 3 demo documented

- **WHEN** a developer reads `DEPLOYMENT.md` after Phase 3
- **THEN** step-by-step instructions exist to verify signup → onboarding → membership on staging, including skip-age flow and notes for resetting `onboarding_complete` / profile for repeat demos
