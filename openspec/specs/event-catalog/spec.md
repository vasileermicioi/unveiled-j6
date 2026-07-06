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

- **WHEN** an event with an existing image is updated via `attachImageToEvent` with a new source
- **THEN** the old `images` row and its six bucket objects are removed and the event references the new image

### Requirement: Demo seed idempotency

The `scripts/seed-demo.ts` script invoked by `bun run seed:demo` SHALL insert demo partners and events only when both `partners` and `events` table counts are zero, and SHALL perform no inserts when any partner or event already exists.

#### Scenario: Seed on empty database

- **WHEN** both `partners` and `events` are empty and seed runs
- **THEN** at least one partner and one upcoming event exist

#### Scenario: Seed skipped when data exists

- **WHEN** at least one partner or event exists and seed runs
- **THEN** row counts are unchanged

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
