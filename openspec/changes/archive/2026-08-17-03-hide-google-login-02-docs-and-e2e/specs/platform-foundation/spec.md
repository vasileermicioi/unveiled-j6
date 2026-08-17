## ADDED Requirements

### Requirement: Operator and agent auth docs are email/password only
`apps/web/DEPLOYMENT.md`, `AGENTS.md` Auth setup, `packages/auth/README.md`, `docs/COMPONENTS.md` (`AppAuthProvider`), `docs/product/sitemap/sitemap.md`, and `docs/product/extras/integrations-and-config.md` SHALL describe MVP member auth as email/password only. They MUST NOT present Google / “Continue with Google” / “Sign up or log in with Google” as a current product login method. `/auth/callback/google` SHALL NOT be listed as an app route. Google OAuth MAY be noted as optional future / not implemented, with no app env vars. Historical changelog lines in `docs/product/extras/gaps-and-decisions.md` MAY mention the superseded “add Google OAuth” decision.

#### Scenario: Sitemap login is email/password only
- **WHEN** an implementer reads the Auth table in `docs/product/sitemap/sitemap.md`
- **THEN** `/login` is documented as email/password only
- **AND** `/auth/callback/google` is not listed as an application route

#### Scenario: Integrations do not treat Google as current auth
- **WHEN** an implementer reads `docs/product/extras/integrations-and-config.md`
- **THEN** the env table and Google OAuth section state that Google is not a current product auth method
- **AND** they do not instruct operators to enable Google for MVP signup/login

#### Scenario: DEPLOYMENT demo and cutover use email/password
- **WHEN** an operator follows `apps/web/DEPLOYMENT.md` demo, staging checklist, or production cutover
- **THEN** signup/login steps use email/password
- **AND** they are not required to click Continue with Google or enable a Neon Google provider for MVP

#### Scenario: Agent setup docs drop current Google OAuth
- **WHEN** an agent reads `AGENTS.md` Auth setup, `packages/auth/README.md`, or `docs/COMPONENTS.md` AppAuthProvider
- **THEN** MVP auth UI is described as email/password only
- **AND** first-login provisioning is not documented as “email/password and Google OAuth”

## MODIFIED Requirements

### Requirement: Testing documentation in deployment guide

`apps/web/DEPLOYMENT.md` SHALL document how to run Ladle stories and Playwright E2E locally and in CI, including required env vars and known marked skips. Known marked skips SHALL NOT include Google OAuth.

#### Scenario: Operator runs Phase 4½ demo

- **WHEN** an operator follows DEPLOYMENT.md Phase 4½ instructions
- **THEN** they can start story servers and execute the full E2E suite with documented demo credentials

#### Scenario: Known skips are explicit

- **WHEN** an operator reads the Phase 4½ section
- **THEN** permanently or conditionally skipped scenarios (GDPR Neon Auth / env blockers, missing R2) are listed with owners or deferral phases
- **AND** Google OAuth is not listed as a current marked skip
