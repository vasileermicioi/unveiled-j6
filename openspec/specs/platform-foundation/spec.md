# Platform Foundation

Monorepo structure, package rollout, database tooling, and deployment documentation.

## Requirements

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

### Requirement: Database migration scripts

The root workspace SHALL expose `db:generate` and `db:migrate` scripts that delegate to `@unveiled/db` and apply Drizzle migrations against `DATABASE_URL`.

#### Scenario: Generate migrations

- **WHEN** a developer runs `bun run db:generate` with `DATABASE_URL` set
- **THEN** Drizzle Kit generates migration files under `packages/db/drizzle/` without errors

#### Scenario: Apply migrations

- **WHEN** a developer runs `bun run db:migrate` with `DATABASE_URL` set
- **THEN** pending migrations apply to the Neon Postgres database and exit successfully

### Requirement: Role-based admin route protection

The application SHALL protect `/:locale/admin/*` routes so that only authenticated users with role `ADMIN` can render partner management and dashboard pages introduced in catalog step 03. Users with role `USER` or `PARTNER` SHALL be redirected away from the `admin` path prefix per the established locale middleware pattern. Unauthenticated visitors SHALL be redirected to login with optional `returnTo`. Only `ADMIN` and `USER` login roles are active in Phase 4 catalog step 03; PARTNER provisioning is deferred to Phase 8.

#### Scenario: Admin section requires ADMIN role

- **WHEN** a signed-in USER navigates to `/de/admin/partners`
- **THEN** the request is rejected by redirect to `/de` (or equivalent forbidden handling)

#### Scenario: Unauthenticated admin access redirects to login

- **WHEN** an unauthenticated visitor navigates to `/de/admin`
- **THEN** the browser is redirected to `/de/login` with the admin path preserved for post-login return where supported

#### Scenario: ADMIN can access admin dashboard

- **WHEN** a signed-in ADMIN navigates to `/de/admin`
- **THEN** the dashboard page renders successfully

### Requirement: Component story development harness

The monorepo SHALL provide a Ladle-based story server for `@unveiled/ui` and `apps/web/app/components`, with a HeroUI theme wrapper matching production `globals.css`.

#### Scenario: Developer runs component stories

- **WHEN** a developer runs `bun run stories` from the repository root
- **THEN** Ladle serves component stories for configured globs
- **AND** stories render with the Unveiled yellow page background and HeroUI Uber theme

### Requirement: Playwright E2E harness

The monorepo SHALL provide a repo-root Playwright test harness at `e2e/` with auth fixtures and a documented proximity-only selector policy.

#### Scenario: Developer runs E2E smoke test

- **WHEN** a developer sets `SITE_URL` and runs `bun run test:e2e`
- **THEN** Playwright executes specs against the SSR app
- **AND** the smoke spec confirms locale redirect from `/` to `/de`

### Requirement: E2E selector policy

Playwright tests SHALL use only accessibility- and layout-based locators (`getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth()`). Production markup SHALL NOT gain test-only attributes.

#### Scenario: Selector policy is documented

- **WHEN** an implementer reads `e2e/README.md`
- **THEN** the proximity-only selector rules and forbidden patterns (`data-testid`, CSS classes, `#id`) are explicit
