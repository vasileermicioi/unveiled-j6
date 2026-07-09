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

### Requirement: Phase 0–4 component story coverage

Every UI component shipped in Phases 0–4 SHALL have at least one Ladle story per visual state documented in `ui/ui-component-map.md`.

#### Scenario: EventCard CTA states are story-isolated

- **WHEN** a developer opens `EventCard` stories in Ladle
- **THEN** guest, waitlist, unlock, and book CTA labels are each visible in a dedicated story
- **AND** the guest story shows "See details" regardless of sold-out capacity

#### Scenario: Page-level components are story-isolated

- **WHEN** a developer browses `apps/web` component stories
- **THEN** marketing pages, auth chrome, onboarding steps, and admin list layouts each render without requiring a live session or database

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
