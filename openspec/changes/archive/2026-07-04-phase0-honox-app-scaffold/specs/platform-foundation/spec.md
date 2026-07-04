## ADDED Requirements

### Requirement: Single deployable SSR application

The monorepo SHALL contain exactly one deployable application at `apps/web` (`@unveiled/web`) built with HonoX and React SSR.

#### Scenario: Development server

- **WHEN** a developer runs `bun run dev` from the repository root
- **THEN** the HonoX dev server starts and serves server-rendered HTML

#### Scenario: Production build

- **WHEN** a developer runs `bun run build` from the repository root
- **THEN** `@unveiled/web` produces a production build artifact without errors

#### Scenario: Production start

- **WHEN** a developer runs `bun run start` from `apps/web` after a successful build
- **THEN** the Node.js SSR server serves the built application

### Requirement: Route file convention

SSR pages and layouts SHALL live under `apps/web/app/routes/`. Business logic SHALL NOT be embedded in route files beyond rendering concerns (extract to `packages/*` in later phases).

#### Scenario: Route directory structure

- **WHEN** Phase 0 step 02 is complete
- **THEN** `apps/web/app/routes/` exists and contains at least one SSR route module

#### Scenario: Scaffold index route

- **WHEN** a client requests `/` on the dev or production server
- **THEN** the response is server-rendered HTML containing the scaffold placeholder text

### Requirement: Node.js runtime target

The application SHALL target a Node.js-capable host (not edge-only deployment) to support future server-side image processing with `sharp`.

#### Scenario: Build output compatibility

- **WHEN** the production build is started with Node.js
- **THEN** the SSR server runs without requiring edge-specific APIs

#### Scenario: Web package scripts

- **WHEN** `@unveiled/web` is inspected
- **THEN** it exposes `dev`, `build`, `start`, and `typecheck` scripts consumed by root workspace commands
