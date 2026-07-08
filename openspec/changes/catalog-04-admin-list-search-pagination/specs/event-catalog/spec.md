## MODIFIED Requirements

### Requirement: Admin partner SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/partners/*` for list, create, edit, and delete of partner **venue records** (not partner login accounts), using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md`. List route SHALL support `?q=` search on **partner name only** and `?page=` pagination (page size 25) per `docs/migration/extras/pagination-and-search.md`. List results SHALL be ordered by `created_at` descending, then `id` descending. Create and edit forms SHALL accept multipart logo file upload (upload-only in admin UI after catalog-04 image follow-ups) and delegate validation and image processing to the catalog domain layer.

#### Scenario: Admin creates partner with file upload

- **WHEN** an ADMIN submits the new partner form with valid fields and a logo image file
- **THEN** a partner row is created and the uploaded logo is processed into six WebP variants in object storage

#### Scenario: Partner list shows logo thumbnail

- **WHEN** an ADMIN views `/admin/partners` and a partner has a logo
- **THEN** the list displays a thumbnail using the `small-320` variant URL

#### Scenario: Partner validation errors re-render form

- **WHEN** an ADMIN submits a partner form with invalid email or missing required fields
- **THEN** the form re-renders with a validation error, previously entered values preserved, and no partial row is created

#### Scenario: Partner delete blocked when events exist

- **WHEN** an ADMIN confirms delete for a partner that has related events
- **THEN** the delete is rejected with an error message and the partner row remains

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/partners`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns

#### Scenario: Paginated admin partner list

- **WHEN** an ADMIN opens `/admin/partners?page=1`
- **THEN** partners are listed with SSR-rendered pagination controls and a server-side total count

#### Scenario: Admin partner list search by name

- **WHEN** an ADMIN opens `/admin/partners?q=berghain`
- **THEN** only partners whose **name** matches the query (case-insensitive) are listed and pagination totals reflect the filtered count

#### Scenario: Admin partner list newest first

- **WHEN** an ADMIN opens `/admin/partners` without filters
- **THEN** partners appear with the most recently created row first

#### Scenario: Partner list page clamp

- **WHEN** an ADMIN opens `/admin/partners?page=99` and fewer than 99 pages of results exist
- **THEN** the server redirects to the last valid page or equivalent clamp so the table is not empty solely due to an out-of-range page number

### Requirement: Admin event list discovery aids

The admin events list at `/:locale/admin/events` SHALL support GET search and pagination (`?q=&page=`, page size 25) per `docs/migration/extras/pagination-and-search.md`, searching event title and denormalized partner name. List results SHALL be ordered by `created_at` descending, then `id` descending. The list SHALL display a `small-320` thumbnail for each event's image when present, plus title, partner, date/time (Europe/Berlin), capacity, and row actions for edit, delete, and codes export.

#### Scenario: Paginated admin event list

- **WHEN** an ADMIN opens `/admin/events?page=1`
- **THEN** events are listed with SSR-rendered pagination controls and a server-side total count

#### Scenario: Admin event list search

- **WHEN** an ADMIN opens `/admin/events?q=berghain`
- **THEN** only events whose title or denormalized partner name matches the query (case-insensitive) are listed and pagination totals reflect the filtered count

#### Scenario: Admin event list newest first

- **WHEN** an ADMIN opens `/admin/events` without filters
- **THEN** events appear with the most recently created row first

#### Scenario: Event list page clamp

- **WHEN** an ADMIN opens `/admin/events?page=99` and fewer than 99 pages of results exist
- **THEN** the server redirects to the last valid page or equivalent clamp so the table is not empty solely due to an out-of-range page number

#### Scenario: Event list shows image thumbnail

- **WHEN** an ADMIN views `/admin/events` and an event has an image
- **THEN** the list displays a thumbnail using the `small-320` variant URL
