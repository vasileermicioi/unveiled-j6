## ADDED Requirements

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, series create, edit, delete, and redemption code export, using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md` and `docs/migration/features/admin-events.feature`. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records. Create and edit forms SHALL accept multipart image file upload or remote image URL (exactly one source on create; on edit, omit both to keep existing image) and delegate validation, defaults, derived datetime fields, capacity recalculation, and image processing to the catalog domain layer.

#### Scenario: Admin creates event with required image upload

- **WHEN** an ADMIN submits a valid new event form with a file upload and no URL field
- **THEN** the event is persisted with `image_id` set and six WebP variants stored in object storage

#### Scenario: Admin creates event with image URL

- **WHEN** an ADMIN submits a valid new event form with a remote image URL and no file upload
- **THEN** the event is persisted with `image_id` set and six WebP variants stored via the standard pipeline

#### Scenario: Event image required on create

- **WHEN** an ADMIN submits a create form without upload or URL
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Conflicting image sources rejected

- **WHEN** an ADMIN submits a create or edit form with both a file upload and a remote URL
- **THEN** the form re-renders with a validation error and no partial write occurs

#### Scenario: Event series creates multiple catalog rows

- **WHEN** an ADMIN confirms an event series with two valid unique slots
- **THEN** two events exist sharing base metadata and distinct `date_time` values

#### Scenario: Series preview before confirm

- **WHEN** an ADMIN submits a series form in preview mode with valid base fields and slot inputs
- **THEN** the server renders a preview list of generated slots before the confirm POST creates rows

#### Scenario: Redemption validation on create

- **WHEN** an ADMIN creates a VOUCHER event omitting `promo_code` or `event_website_url`
- **THEN** creation is rejected until both are provided

#### Scenario: Secret code required for manual mode

- **WHEN** an ADMIN creates a SECRET_CODE event with secret code mode MANUAL and no secret code
- **THEN** creation is rejected until a secret code is provided

#### Scenario: Edit replaces event image

- **WHEN** an ADMIN edits an event and supplies a new image upload or URL
- **THEN** the old `images` row and its six bucket objects are removed and the event references the new image

#### Scenario: Delete event removes image assets

- **WHEN** an ADMIN confirms delete for an event
- **THEN** the event row is removed and its associated `images` row and bucket objects are deleted synchronously

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/events`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns

### Requirement: Admin event list discovery aids

The admin events list at `/:locale/admin/events` SHALL support GET search and pagination (`?q=&page=`, page size 25) per `docs/migration/extras/pagination-and-search.md`, searching event title and denormalized partner name. The list SHALL display a `small-320` thumbnail for each event's image when present, plus title, partner, date/time (Europe/Berlin), capacity, and row actions for edit, delete, and codes export.

#### Scenario: Paginated admin event list

- **WHEN** an ADMIN opens `/admin/events?page=1`
- **THEN** events are listed with SSR-rendered pagination controls and a server-side total count

#### Scenario: Admin event list search

- **WHEN** an ADMIN opens `/admin/events?q=berghain`
- **THEN** only events whose title or partner name matches the query are listed

#### Scenario: Event list shows image thumbnail

- **WHEN** an ADMIN views `/admin/events` and an event has an image
- **THEN** the list displays a thumbnail using the `small-320` variant URL

### Requirement: Admin redemption codes CSV export

The route `/:locale/admin/events/:id/codes` SHALL respond to GET with a CSV download for the given event, delegating content generation to `exportRedemptionCodesCsv` in the catalog domain layer. Until Phase 6 bookings exist, an empty or header-only CSV is acceptable.

#### Scenario: CSV export download

- **WHEN** an ADMIN requests `/admin/events/:id/codes` for an existing event
- **THEN** the response is `text/csv` with a `Content-Disposition` attachment filename and CSV body from the domain export function

#### Scenario: CSV export for missing event

- **WHEN** an ADMIN requests codes export for a non-existent event id
- **THEN** the server responds with 404
