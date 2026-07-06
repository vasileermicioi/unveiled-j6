## MODIFIED Requirements

### Requirement: Phase 0 package scope

During Phase 4 catalog step 01, `packages/` SHALL include `config/`, `db/`, `auth/`, and `images/`. `@unveiled/db` SHALL extend beyond `users` and `subscriptions` with catalog tables (`images`, `partners`, `events`). `@unveiled/images` SHALL provide sharp-based server-side image processing without importing `apps/web`. Billing and UI packages are not created until their respective phases.

#### Scenario: Package directory listing after catalog step 01

- **WHEN** catalog step 01 is complete
- **THEN** `packages/` contains `config/`, `db/`, `auth/`, and `images/` and no billing or UI packages

#### Scenario: Images package is buildable

- **WHEN** `bun run typecheck` runs after Phase 4 step 01
- **THEN** `@unveiled/images` typechecks without importing `apps/web`

#### Scenario: Catalog tables in database package

- **WHEN** a consumer imports schema symbols from `@unveiled/db`
- **THEN** `images`, `partners`, and `events` tables and related enums are exported alongside existing auth tables
