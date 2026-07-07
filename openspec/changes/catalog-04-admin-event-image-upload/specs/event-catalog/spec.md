## ADDED Requirements

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

### Requirement: Admin event list thumbnails

The admin events list SHALL display a thumbnail for each event with an `image_id`, using the `small-320.webp` variant URL from `@unveiled/images`.

#### Scenario: List thumbnail from small-320 variant

- **WHEN** an ADMIN views `/admin/events` and an event has a persisted image
- **THEN** the list row shows a thumbnail loaded from `{IMAGE_PUBLIC_BASE_URL}/images/{image_id}/small-320.webp`

## MODIFIED Requirements

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, series create, edit, delete, and redemption code export, using dedicated form POST pages without client-side modals, matching `docs/migration/sitemap/sitemap.md` and `docs/migration/features/admin-events.feature`. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records. Create and edit forms SHALL accept multipart **file upload** for images (required on create; optional replace on edit) and delegate validation, image processing, and storage to the catalog domain layer and `@unveiled/images`. Admin event forms SHALL NOT accept remote image URL paste.

#### Scenario: Admin creates event with required image upload

- **WHEN** an ADMIN submits a valid new event form with a file upload
- **THEN** the event is persisted with `image_id` set and six WebP variants stored in object storage

#### Scenario: Event image required on create

- **WHEN** an ADMIN submits a create form without a file upload
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Edit replaces event image

- **WHEN** an ADMIN edits an event and supplies a new image file upload
- **THEN** the old `images` row and its six bucket objects are removed and the event references the new image

#### Scenario: Delete event removes image assets

- **WHEN** an ADMIN confirms delete for an event
- **THEN** the event row is removed and its associated `images` row and bucket objects are deleted synchronously

#### Scenario: Event series creates multiple catalog rows

- **WHEN** an ADMIN confirms an event series with two valid unique slots
- **THEN** two events exist sharing base metadata and distinct `date_time` values, each with its own image if supplied per series rules

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/events`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns
