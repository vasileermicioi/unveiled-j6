## MODIFIED Requirements

### Requirement: Phase 0 package scope

During Phase 2 step 01, `packages/` SHALL include `config/` and `db/`. Auth, billing, images, and UI packages are not created until their respective phases.

#### Scenario: Package directory listing after auth step 01

- **WHEN** auth step 01 is complete
- **THEN** `packages/` contains `config/` and `db/` and no other domain packages

## ADDED Requirements

### Requirement: Database migration scripts

The root workspace SHALL expose `db:generate` and `db:migrate` scripts that delegate to `@unveiled/db` and apply Drizzle migrations against `DATABASE_URL`.

#### Scenario: Generate migrations

- **WHEN** a developer runs `bun run db:generate` with `DATABASE_URL` set
- **THEN** Drizzle Kit generates migration files under `packages/db/drizzle/` without errors

#### Scenario: Apply migrations

- **WHEN** a developer runs `bun run db:migrate` with `DATABASE_URL` set
- **THEN** pending migrations apply to the Neon Postgres database and exit successfully
