## ADDED Requirements

### Requirement: Admin partner SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/partners/*` for list, create, edit, and delete of partner **venue records** (not partner login accounts), using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md`. List route SHALL support `?q=` search on partner name and contact email and `?page=` pagination (page size 25) per `docs/migration/extras/pagination-and-search.md`. Create and edit forms SHALL accept multipart logo file upload or remote logo URL (exactly one source when provided) and delegate validation and image processing to the catalog domain layer.

#### Scenario: Admin creates partner with logo URL

- **WHEN** an ADMIN submits the new partner form with valid name, contact email, address, and a remote logo URL
- **THEN** a partner row is created and the logo is stored via the standard six-variant pipeline

#### Scenario: Admin creates partner with file upload

- **WHEN** an ADMIN submits the new partner form with valid fields and a logo image file (no URL)
- **THEN** a partner row is created and the uploaded logo is processed into six WebP variants in object storage

#### Scenario: Partner list shows logo thumbnail

- **WHEN** an ADMIN views `/admin/partners` and a partner has a logo
- **THEN** the list displays a thumbnail using the `small-320` variant URL

#### Scenario: Partner validation errors re-render form

- **WHEN** an ADMIN submits a partner form with invalid email or missing required fields
- **THEN** the form re-renders with a validation error and no partial row is created

#### Scenario: Partner delete blocked when events exist

- **WHEN** an ADMIN confirms delete for a partner that has related events
- **THEN** the delete is rejected with an error message and the partner row remains

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/partners`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns

### Requirement: Admin dashboard demo seed control

The `/:locale/admin` dashboard SHALL display quick links to admin sections and a control to run demo seed data only when both partners and events tables are empty, invoking the same `runDemoSeed` logic as `bun run seed:demo`.

#### Scenario: Seed on empty database from dashboard

- **WHEN** both partners and events are empty and an ADMIN submits the dashboard seed action
- **THEN** demo partners and events are created and the seed control is no longer shown

#### Scenario: Seed button hidden after data exists

- **WHEN** at least one partner or event exists
- **THEN** the dashboard does not offer the empty-DB seed action
