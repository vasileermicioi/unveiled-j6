## MODIFIED Requirements

### Requirement: Deployment documentation

`apps/web/DEPLOYMENT.md` SHALL document the staging URL, build/start commands, and required environment variables. For Phase 2 staging, `DATABASE_URL` and `AUTH_URL` SHALL be documented as required, including instructions for creating a test user and enabling Google OAuth in the Neon Auth project.

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

### Requirement: Phase 0 package scope

During Phase 2 auth step 02, `packages/` SHALL include `config/`, `db/`, and `auth/`. Billing, images, and UI packages are not created until their respective phases.

#### Scenario: Package directory listing after auth step 02

- **WHEN** auth step 02 is complete
- **THEN** `packages/` contains `config/`, `db/`, and `auth/` and no other domain packages

#### Scenario: Auth package consumed by web middleware

- **WHEN** auth step 04 is complete
- **THEN** `packages/auth/` exists and is consumed by `apps/web` locale middleware for session resolution and route protection
