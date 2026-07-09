## RENAMED Requirements

### Requirement: Six-variant WebP image pipeline
- FROM: `Six-variant WebP image pipeline`
- TO: `Six-variant JPEG image pipeline`

## MODIFIED Requirements

### Requirement: Six-variant JPEG image pipeline

The `@unveiled/images` package SHALL process a valid JPEG, PNG, or WebP source into exactly six JPEG objects under `images/{id}/{variant}.jpg` per `docs/migration/extras/image-uploads.md`, upload them to S3-compatible storage with Content-Type `image/jpeg`, and expose helpers to compute public URLs from `IMAGE_PUBLIC_BASE_URL`. Fixed filenames SHALL be: `original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, `small-320.jpg`, `og-1200x630.jpg`.

#### Scenario: Direct buffer processing

- **WHEN** `processImageFromBuffer` receives a valid image at least 800×420 and under 8 MB
- **THEN** six JPEG variants are produced with correct max-width or cover-crop behavior and no upscaling except `og-1200x630`

#### Scenario: Undersized source rejected

- **WHEN** the source is smaller than 800×420
- **THEN** processing fails with a validation error and no bucket objects are written

#### Scenario: Public variant URL

- **WHEN** `buildVariantUrl(imageId, "medium-640.jpg")` is called with `IMAGE_PUBLIC_BASE_URL` set
- **THEN** the returned URL follows `{base}/images/{id}/medium-640.jpg`

#### Scenario: Remote URL processing

- **WHEN** `processImageFromUrl` receives a reachable JPEG, PNG, or WebP URL meeting size and dimension rules
- **THEN** the same six JPEG variants are produced as a direct buffer upload

#### Scenario: Image object deletion

- **WHEN** `deleteImageObjects(imageId)` is called for an image that was uploaded
- **THEN** all six objects under `images/{imageId}/` are removed from the bucket

### Requirement: Admin event image upload pipeline

Admin event create and edit SHALL persist images exclusively via multipart file upload through the catalog domain layer and `@unveiled/images` pipeline. On successful create, the system SHALL store six JPEG variants in object storage, insert an `images` row with `source=UPLOAD`, and set `events.image_id`. Public variant URLs SHALL be computed via `buildVariantUrl` — not stored as free-text URLs on the event row.

#### Scenario: Create stores six R2 variants

- **WHEN** an ADMIN submits a valid create form with an accepted image file
- **THEN** the event references a new `image_id` and six JPEG objects exist at `images/{image_id}/` in the configured bucket

#### Scenario: Create rejects missing image

- **WHEN** an ADMIN submits a create form without an image file
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Edit replace removes old assets

- **WHEN** an ADMIN edits an event and uploads a new image file
- **THEN** the previous `images` row and its six bucket objects are deleted and the event references the new `image_id`

#### Scenario: Edit without file keeps image

- **WHEN** an ADMIN submits an edit form without a new image file
- **THEN** the existing `image_id` and bucket objects are unchanged

### Requirement: Admin event list thumbnails

The admin events list SHALL display a thumbnail for each event with an `image_id`, using the `small-320.jpg` variant URL from `@unveiled/images`.

#### Scenario: List thumbnail from small-320 variant

- **WHEN** an ADMIN views `/admin/events` and an event has a persisted image
- **THEN** the list row shows a thumbnail loaded from `{IMAGE_PUBLIC_BASE_URL}/images/{image_id}/small-320.jpg`

### Requirement: Admin partner SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/partners/*` for list, create, edit, and delete of partner **venue records** (not partner login accounts), using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md`. List route SHALL support `?q=` search on **partner name only** and `?page=` pagination (page size 25) per `docs/migration/extras/pagination-and-search.md`. List results SHALL be ordered by `created_at` descending, then `id` descending. Create and edit forms SHALL accept multipart logo file upload or remote logo URL (exactly one source when provided) and delegate validation and image processing to the catalog domain layer.

#### Scenario: Admin creates partner with logo URL

- **WHEN** an ADMIN submits the new partner form with valid name, contact email, address, and a remote logo URL
- **THEN** a partner row is created and the logo is stored via the standard six-variant pipeline

#### Scenario: Admin creates partner with file upload

- **WHEN** an ADMIN submits the new partner form with valid fields and a logo image file (no URL)
- **THEN** a partner row is created and the uploaded logo is processed into six JPEG variants in object storage

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

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, series create, edit, delete, and redemption code export, using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md` and `docs/migration/features/admin-events.feature`. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records. Create and edit forms SHALL accept multipart **file upload** for images (required on create; optional replace on edit) and delegate validation, image processing, and storage to the catalog domain layer and `@unveiled/images`. Admin event forms SHALL NOT accept remote image URL paste.

#### Scenario: Admin creates event with required image upload

- **WHEN** an ADMIN submits a valid new event form with a file upload
- **THEN** the event is persisted with `image_id` set and six JPEG variants stored in object storage

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
