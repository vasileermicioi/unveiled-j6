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
