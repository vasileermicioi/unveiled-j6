## ADDED Requirements

### Requirement: Bun workspaces monorepo root

The repository SHALL use Bun workspaces with `apps/*` and `packages/*` globs, a shared dependency `catalog` in the root `package.json`, and root scripts `dev`, `build`, `lint`, and `typecheck`.

#### Scenario: Install dependencies

- **WHEN** a developer runs `bun install` at the repository root
- **THEN** workspace packages resolve and lockfile is created without errors

#### Scenario: Lint from root

- **WHEN** a developer runs `bun run lint` at the repository root
- **THEN** Biome executes against the repository and exits without fatal errors

### Requirement: Shared config package

The repository SHALL provide `@unveiled/config` with shared TypeScript (`tsconfig.base.json`, `tsconfig.react.json`) and Biome presets consumed by apps and future packages.

#### Scenario: Extend shared tsconfig

- **WHEN** a new workspace package adds `"extends": "@unveiled/config/tsconfig.base.json"`
- **THEN** TypeScript inherits strict baseline compiler options without duplicating config

#### Scenario: Extend shared Biome preset

- **WHEN** the root `biome.json` extends `@unveiled/config/biome.json`
- **THEN** lint and format rules are inherited from the shared preset

### Requirement: Phase 0 package scope

During Phase 0 step 01, the only package under `packages/*` SHALL be `packages/config`. No database, auth, billing, or UI packages are created yet.

#### Scenario: Package directory listing

- **WHEN** Phase 0 step 01 is complete
- **THEN** `packages/` contains only `config/` and no other domain packages
