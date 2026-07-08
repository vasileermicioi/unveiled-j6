# Event Catalog

Phase 4 catalog persistence and image processing for partner venue records and events.

## Requirements

### Requirement: Catalog persistence tables

The `@unveiled/db` package SHALL define Drizzle schema and migrations for `public.images`, `public.partners`, and `public.events` matching `docs/migration/database/schema-overview.md`, including FK from `events.image_id` → `images.id` (required), `partners.logo_image_id` → `images.id` (optional), and `events.partner_id` → `partners.id`. The schema SHALL include enums for image source, ticket type, secret code mode, and timing mode; a check constraint `remaining_capacity >= 0` on `events`; and indexes on `events(date_time)`, `(date_time, partner_id)`, and `(date_time, category)`.

#### Scenario: Migration applies on empty catalog

- **WHEN** `bun run db:migrate` runs against a database with Phase 2 tables
- **THEN** `images`, `partners`, and `events` tables exist with documented columns and constraints

#### Scenario: Remaining capacity non-negative

- **WHEN** an `events` row is inserted with `remaining_capacity` below zero
- **THEN** the database rejects the insert

#### Scenario: Event image required at schema level

- **WHEN** an `events` row is inserted without `image_id`
- **THEN** the database rejects the insert

### Requirement: Six-variant WebP image pipeline

The `@unveiled/images` package SHALL process a valid JPEG, PNG, or WebP source into exactly six WebP objects under `images/{id}/{variant}.webp` per `docs/migration/extras/image-uploads.md`, upload them to S3-compatible storage, and expose helpers to compute public URLs from `IMAGE_PUBLIC_BASE_URL`.

#### Scenario: Direct buffer processing

- **WHEN** `processImageFromBuffer` receives a valid image at least 800×420 and under 8 MB
- **THEN** six variants are produced with correct max-width or cover-crop behavior and no upscaling except `og-1200x630`

#### Scenario: Undersized source rejected

- **WHEN** the source is smaller than 800×420
- **THEN** processing fails with a validation error and no bucket objects are written

#### Scenario: Public variant URL

- **WHEN** `buildVariantUrl(imageId, "medium-640.webp")` is called with `IMAGE_PUBLIC_BASE_URL` set
- **THEN** the returned URL follows `{base}/images/{id}/medium-640.webp`

#### Scenario: Remote URL processing

- **WHEN** `processImageFromUrl` receives a reachable JPEG, PNG, or WebP URL meeting size and dimension rules
- **THEN** the same six variants are produced as a direct buffer upload

#### Scenario: Image object deletion

- **WHEN** `deleteImageObjects(imageId)` is called for an image that was uploaded
- **THEN** all six objects under `images/{imageId}/` are removed from the bucket

### Requirement: Partner catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce partner validation and lifecycle rules from `docs/migration/features/admin-partners.feature`, including required name, contact email, and address; optional logo (upload or remote URL, not both); automatic `venue_check_in_token` generation when omitted on create; propagating partner display name changes to all related events' denormalized `partner_name`; and synchronous deletion of associated logo `images` row and bucket objects when a partner is deleted.

#### Scenario: Invalid partner email rejected

- **WHEN** `createPartner` receives `contact_email` that is not a valid email
- **THEN** the operation fails without inserting a row

#### Scenario: Partner rename updates events

- **WHEN** a partner with existing events is renamed
- **THEN** all events for that partner reflect the new `partner_name`

#### Scenario: Venue check-in token auto-generated

- **WHEN** `createPartner` is called without a `venue_check_in_token`
- **THEN** a unique token is generated and stored on the new partner row

### Requirement: Event catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/migration/features/admin-events.feature`, including required image (upload buffer or remote URL path, exactly one source); redemption configuration rules; default capacity 10, ticket type `SECRET_CODE`, secret code mode `MANUAL`, timing mode `TIME_SLOT`; computed `start_time_minutes` and `weekday` from `date_time` in Europe/Berlin; series slot uniqueness; capacity recalculation when total capacity changes; and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/migration/extras/image-uploads.md` §8.

#### Scenario: Missing event image rejected

- **WHEN** `createEvent` is called without an image source (neither upload nor URL)
- **THEN** the operation fails validation

#### Scenario: Conflicting image sources rejected

- **WHEN** `createEvent` or `updateEvent` receives both an upload buffer and a remote URL
- **THEN** the operation fails validation without writing rows or bucket objects

#### Scenario: Event series creates one row per slot

- **WHEN** `createEventSeries` receives multiple unique date/time slots
- **THEN** one event row is created per slot sharing base details

#### Scenario: Duplicate series slots rejected

- **WHEN** `createEventSeries` receives duplicate date/time slots
- **THEN** the operation fails validation before inserting any rows

#### Scenario: Capacity update recalculates remaining

- **WHEN** total capacity is updated on an event with tickets already sold
- **THEN** `remaining_capacity` becomes `max(0, newTotal - soldCount)`

#### Scenario: Derived datetime fields on write

- **WHEN** an event is created or its `date_time` is updated
- **THEN** `start_time_minutes` and `weekday` are computed from `date_time` using Europe/Berlin local time

### Requirement: Image attach orchestration

The catalog domain layer SHALL orchestrate `@unveiled/images` processing, `images` row insertion, S3 upload, and old-image cleanup in a single transaction where applicable: `attachImageToPartner` and `attachImageToEvent` call `processImageFromBuffer` or `processImageFromUrl`, insert an `images` row, upload six variants, and when replacing an existing image delete the prior `images` row and all six bucket objects synchronously.

#### Scenario: Event image attach creates images row

- **WHEN** `attachImageToEvent` succeeds with a valid remote URL
- **THEN** a new `images` row exists with `source = REMOTE_URL` and six objects exist in the bucket

#### Scenario: Image replace deletes old assets

- **WHEN** an event with an existing image is updated with a new image source after the event row references the new `image_id`
- **THEN** the old `images` row and its six bucket objects are removed

### Requirement: Admin event image upload pipeline

Admin event create and edit SHALL persist images exclusively via multipart file upload through the catalog domain layer and `@unveiled/images` pipeline. On successful create, the system SHALL store six WebP variants in object storage, insert an `images` row with `source=UPLOAD`, and set `events.image_id`. Public variant URLs SHALL be computed via `buildVariantUrl` — not stored as free-text URLs on the event row.

#### Scenario: Create stores six R2 variants

- **WHEN** an ADMIN submits a valid create form with an accepted image file
- **THEN** the event references a new `image_id` and six WebP objects exist at `images/{image_id}/` in the configured bucket

#### Scenario: Create rejects missing image

- **WHEN** an ADMIN submits a create form without an image file
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Edit replace removes old assets

- **WHEN** an ADMIN edits an event and uploads a new image file
- **THEN** the previous `images` row and its six bucket objects are deleted and the event references the new `image_id`

#### Scenario: Edit without file keeps image

- **WHEN** an ADMIN submits an edit form without a new image file
- **THEN** the existing `image_id` and bucket objects are unchanged

### Requirement: Admin event upload-only form UI

Admin event create and edit forms SHALL NOT expose a remote image URL text field. Image input SHALL use a file upload control (HeroUI `FileTrigger` or equivalent). Edit forms SHOULD display the current event image preview when `image_id` is set.

#### Scenario: No URL field on admin event form

- **WHEN** an ADMIN opens the event create or edit form
- **THEN** no remote image URL text input is shown

#### Scenario: Edit shows current thumbnail preview

- **WHEN** an ADMIN opens edit for an event that has an `image_id`
- **THEN** the form displays a preview using the `small-320` variant URL

### Requirement: Admin event form HeroUI-first controls

Admin event create and edit forms SHALL prefer HeroUI v3 components (`Select`, `DatePicker`, `TimeField`, `TextField`, `InputGroup`) over raw HTML form elements. Native HTML inputs SHALL be used only as a fallback inside HeroUI primitives where the library requires them, not as standalone form controls for dates or selects.

#### Scenario: Event date uses HeroUI date picker

- **WHEN** an ADMIN opens the event create or edit form
- **THEN** the event date is chosen via a HeroUI date picker control rather than a standalone native date input

#### Scenario: Select menu anchors to trigger

- **WHEN** an ADMIN opens a select field such as timing mode or partner on the event form
- **THEN** the option list appears adjacent below the trigger control, not detached at an unrelated viewport position

### Requirement: Admin event languages and age groups multi-select

The admin event form SHALL capture `languages` and `target_age_groups` as multi-select fields with predefined options, not comma-separated free text. Submitted values SHALL persist to the existing `text[]` and enum-array columns respectively.

#### Scenario: Admin selects multiple languages

- **WHEN** an ADMIN selects German and English in the languages multi-select and submits a valid form
- **THEN** the event row stores both language codes in `languages`

#### Scenario: Admin selects multiple age groups

- **WHEN** an ADMIN selects two or more target age group options and submits a valid form
- **THEN** the event row stores the selected values in `target_age_groups`

### Requirement: Admin event map geolocation with zoom

The admin event form SHALL provide a map-based geolocation picker (MapLibre GL JS with OpenStreetMap tiles) instead of free-text latitude and longitude fields. The form SHALL persist latitude, longitude, and map zoom level on the event record.

#### Scenario: Admin sets location via map

- **WHEN** an ADMIN places a marker on the geolocation map and submits a valid form
- **THEN** the event row stores the marker coordinates in `lat` and `lng` and the map zoom in `map_zoom`

#### Scenario: Edit restores map viewport

- **WHEN** an ADMIN opens edit for an event that has `lat`, `lng`, and `map_zoom` set
- **THEN** the map picker initializes centered at those coordinates and zoom level

### Requirement: Admin event list thumbnails

The admin events list SHALL display a thumbnail for each event with an `image_id`, using the `small-320.webp` variant URL from `@unveiled/images`.

#### Scenario: List thumbnail from small-320 variant

- **WHEN** an ADMIN views `/admin/events` and an event has a persisted image
- **THEN** the list row shows a thumbnail loaded from `{IMAGE_PUBLIC_BASE_URL}/images/{image_id}/small-320.webp`

### Requirement: Demo seed idempotency

The `scripts/seed-demo.ts` script invoked by `bun run seed:demo` SHALL insert demo partners and events only when both `partners` and `events` table counts are zero, and SHALL perform no inserts when any partner or event already exists.

#### Scenario: Seed on empty database

- **WHEN** both `partners` and `events` are empty and seed runs
- **THEN** at least one partner and one upcoming event exist

#### Scenario: Seed skipped when data exists

- **WHEN** at least one partner or event exists and seed runs
- **THEN** row counts are unchanged

### Requirement: Admin partner SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/partners/*` for list, create, edit, and delete of partner **venue records** (not partner login accounts), using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md`. List route SHALL support `?q=` search on **partner name only** and `?page=` pagination (page size 25) per `docs/migration/extras/pagination-and-search.md`. List results SHALL be ordered by `created_at` descending, then `id` descending. Create and edit forms SHALL accept multipart logo file upload or remote logo URL (exactly one source when provided) and delegate validation and image processing to the catalog domain layer.

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

### Requirement: Admin dashboard demo seed control

The `/:locale/admin` dashboard SHALL display quick links to admin sections and a control to run demo seed data only when both partners and events tables are empty, invoking the same `runDemoSeed` logic as `bun run seed:demo`.

#### Scenario: Seed on empty database from dashboard

- **WHEN** both partners and events are empty and an ADMIN submits the dashboard seed action
- **THEN** demo partners and events are created and the seed control is no longer shown

#### Scenario: Seed button hidden after data exists

- **WHEN** at least one partner or event exists
- **THEN** the dashboard does not offer the empty-DB seed action

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, series create, edit, delete, and redemption code export, using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md` and `docs/migration/features/admin-events.feature`. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records. Create and edit forms SHALL accept multipart **file upload** for images (required on create; optional replace on edit) and delegate validation, image processing, and storage to the catalog domain layer and `@unveiled/images`. Admin event forms SHALL NOT accept remote image URL paste.

#### Scenario: Admin creates event with required image upload

- **WHEN** an ADMIN submits a valid new event form with a file upload
- **THEN** the event is persisted with `image_id` set and six WebP variants stored in object storage

#### Scenario: Event image required on create

- **WHEN** an ADMIN submits a create form without a file upload
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Conflicting image sources rejected

- **WHEN** an ADMIN submits a create or edit form with both a file upload and a remote URL
- **THEN** the form re-renders with a validation error and no partial write occurs

#### Scenario: Event series creates multiple catalog rows

- **WHEN** an ADMIN confirms an event series with two valid unique slots
- **THEN** two events exist sharing base metadata and distinct `date_time` values, each with its own image if supplied per series rules

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

- **WHEN** an ADMIN edits an event and supplies a new image file upload
- **THEN** the old `images` row and its six bucket objects are removed and the event references the new image

#### Scenario: Delete event removes image assets

- **WHEN** an ADMIN confirms delete for an event
- **THEN** the event row is removed and its associated `images` row and bucket objects are deleted synchronously

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/events`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns

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

### Requirement: Admin redemption codes CSV export

The route `/:locale/admin/events/:id/codes` SHALL respond to GET with a CSV download for the given event, delegating content generation to `exportRedemptionCodesCsv` in the catalog domain layer. Until Phase 6 bookings exist, an empty or header-only CSV is acceptable.

#### Scenario: CSV export download

- **WHEN** an ADMIN requests `/admin/events/:id/codes` for an existing event
- **THEN** the response is `text/csv` with a `Content-Disposition` attachment filename and CSV body from the domain export function

#### Scenario: CSV export for missing event

- **WHEN** an ADMIN requests codes export for a non-existent event id
- **THEN** the server responds with 404
