## MODIFIED Requirements

### Requirement: Phase 0 package scope

During Phase 4 catalog step 01, `packages/` SHALL include `config/`, `db/`, `auth/`, and `images/`. `@unveiled/db` SHALL extend beyond `users` and `subscriptions` with catalog tables (`images`, `partners`, `events`). `@unveiled/images` SHALL provide server-side image processing into the six fixed JPEG variants without importing `apps/web`. Billing and UI packages are not created until their respective phases.

#### Scenario: Package directory listing after catalog step 01

- **WHEN** catalog step 01 is complete
- **THEN** `packages/` contains `config/`, `db/`, `auth/`, and `images/` and no billing or UI packages

#### Scenario: Images package is buildable

- **WHEN** `bun run typecheck` runs after Phase 4 step 01
- **THEN** `@unveiled/images` typechecks without importing `apps/web`

#### Scenario: Catalog tables in database package

- **WHEN** a consumer imports schema symbols from `@unveiled/db`
- **THEN** `images`, `partners`, and `events` tables and related enums are exported alongside existing auth tables

## ADDED Requirements

### Requirement: Image processing runtime target

The application SHALL target Cloudflare Workers for `apps/web` SSR and SHALL document a Workers-capable image processor for admin uploads. Product documentation SHALL name `@standardagents/sip` (or equivalent Workers-native library) as the processing approach and SHALL describe JPEG variant filenames. The historical “Node-only sharp / Option B local uploads” hosting assumption is superseded; sip implementation may land in a later change while docs and the public filename contract already describe JPEG.

#### Scenario: Documentation states the target processor

- **WHEN** an operator reads `docs/migration/extras/image-uploads.md` after this change
- **THEN** the doc names `@standardagents/sip` (or equivalent Workers-native library) as the processing approach and describes JPEG variant filenames
