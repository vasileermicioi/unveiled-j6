# Event Catalog

Phase 4 catalog persistence and image processing for partner venue records and events.

## Requirements

### Requirement: Catalog persistence tables

The `@unveiled/db` package SHALL define Drizzle schema and migrations for `public.images`, `public.partners`, and `public.events` matching `docs/product/database/schema-overview.md`, including FK from `events.image_id` → `images.id` (required), `partners.logo_image_id` → `images.id` (optional), and `events.partner_id` → `partners.id`. The schema SHALL include enums for image source, ticket type, secret code mode, and timing mode; a check constraint `remaining_capacity >= 0` on `events`; and indexes on `events(date_time)`, `(date_time, partner_id)`, and `(date_time, category)`.

#### Scenario: Migration applies on empty catalog

- **WHEN** `bun run db:migrate` runs against a database with Phase 2 tables
- **THEN** `images`, `partners`, and `events` tables exist with documented columns and constraints

#### Scenario: Remaining capacity non-negative

- **WHEN** an `events` row is inserted with `remaining_capacity` below zero
- **THEN** the database rejects the insert

#### Scenario: Event image required at schema level

- **WHEN** an `events` row is inserted without `image_id`
- **THEN** the database rejects the insert

### Requirement: Six-variant JPEG image pipeline

The `@unveiled/images` package SHALL process a valid JPEG, PNG, or WebP source into exactly six JPEG objects under `images/{id}/{variant}.jpg` per `docs/product/extras/image-uploads.md`, upload them to S3-compatible storage with Content-Type `image/jpeg`, and expose helpers to compute public URLs from `IMAGE_PUBLIC_BASE_URL`. Fixed filenames SHALL be: `original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, `small-320.jpg`, `og-1200x630.jpg`.

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

### Requirement: Server-side image processor

The `@unveiled/images` package SHALL generate the six JPEG variants using `@standardagents/sip` (WASM/scanline processing). The package SHALL NOT depend on `sharp` or other Node-native image addons.

#### Scenario: Unit test generates variants without sharp

- **WHEN** `bun test` runs in `packages/images`
- **THEN** variant generation succeeds using sip and asserts JPEG outputs and correct dimensions

#### Scenario: OG cover-crop

- **WHEN** a source image is processed
- **THEN** `og-1200x630.jpg` is exactly 1200×630 pixels (center cover-crop; upscale allowed only for this variant)

### Requirement: Partner catalog domain rules

The catalog domain layer in `@unveiled/db` SHALL enforce partner validation and lifecycle rules from `docs/product/features/admin-partners.feature`, including required name, contact email, and address; optional logo (upload or remote URL, not both); automatic `venue_check_in_token` generation when omitted on create; propagating partner display name changes to all related events' denormalized `partner_name`; and synchronous deletion of associated logo `images` row and bucket objects when a partner is deleted.

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

The catalog domain layer in `@unveiled/db` SHALL enforce event validation, defaults, and derived fields from `docs/product/features/admin-events.feature`, including required image (upload buffer or remote URL path, exactly one source); redemption configuration rules; default capacity 10, ticket type `SECRET_CODE`, secret code mode `MANUAL`, timing mode `TIME_SLOT`; computed `start_time_minutes` and `weekday` from `date_time` in Europe/Berlin; series slot uniqueness; capacity recalculation when total capacity changes; and synchronous replacement/deletion of event `images` rows and bucket objects per `docs/product/extras/image-uploads.md` §8.

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

### Requirement: Admin image upload on the application host

Admin partner and event image uploads SHALL succeed on the primary deployed host (Cloudflare Workers). The system SHALL NOT require a separate Node-only process for variant generation in the happy path. Multipart uploads remain SSR form POST only.

#### Scenario: Partner create with logo on Workers

- **WHEN** an admin submits a valid logo file to `/:locale/admin/partners/new` on the Workers deployment
- **THEN** the request completes successfully, six JPEG variants are stored in object storage, and the partner detail/list shows the logo thumbnail

#### Scenario: Event create with image on Workers

- **WHEN** an admin submits a valid event image file to `/:locale/admin/events/new` on the Workers deployment
- **THEN** the request completes successfully, six JPEG variants are stored in object storage, and admin/public surfaces can resolve the image thumbnail URL

#### Scenario: Validation failures still reject uploads

- **WHEN** an admin submits a file that is too large, below minimum dimensions, or provides both upload and remote URL
- **THEN** the request fails with a clear validation error and no incomplete image row/objects are left for that attempt

### Requirement: Image attach orchestration

The catalog domain layer SHALL orchestrate `@unveiled/images` processing, `images` row insertion, S3 upload, and old-image cleanup in a single transaction where applicable: `attachImageToPartner` and `attachImageToEvent` call `processImageFromBuffer` or `processImageFromUrl`, insert an `images` row, upload six variants, and when replacing an existing image delete the prior `images` row and all six bucket objects synchronously.

#### Scenario: Event image attach creates images row

- **WHEN** `attachImageToEvent` succeeds with a valid remote URL
- **THEN** a new `images` row exists with `source = REMOTE_URL` and six objects exist in the bucket

#### Scenario: Image replace deletes old assets

- **WHEN** an event with an existing image is updated with a new image source after the event row references the new `image_id`
- **THEN** the old `images` row and its six bucket objects are removed

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

### Requirement: Admin event upload-only form UI

Admin event create and edit forms SHALL NOT expose a remote image URL text field. Image input SHALL use a file upload control (HeroUI `FileTrigger` or equivalent). Edit forms SHOULD display the current event image preview when `image_id` is set.

#### Scenario: No URL field on admin event form

- **WHEN** an ADMIN opens the event create or edit form
- **THEN** no remote image URL text input is shown

#### Scenario: Edit shows current thumbnail preview

- **WHEN** an ADMIN opens edit for an event that has an `image_id`
- **THEN** the form displays a preview using the `small-320` variant URL

### Requirement: Admin event form select controls

Admin event create/edit and series forms SHALL use native HTML `<select>` (or native checkbox groups for multi-value fields) for partner, category, event type, timing mode, ticket type, secret-code mode, barrier-free, languages, and target age groups. HeroUI `Select` / `ListBox` SHALL NOT be required for those fields. SSR field names and validation remain unchanged. Native selects SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native select classes from `globals.css` (e.g. `.admin-native-select`).

#### Scenario: Partner field is a native select

- **WHEN** an admin opens Create Event
- **THEN** the Partner control is a native HTML select (or equivalent native multi pattern) associated with an accessible label

#### Scenario: Multi-value fields post the same array names

- **WHEN** an admin submits languages or target age groups
- **THEN** the POST body still carries the existing array field names accepted by admin parsers

#### Scenario: Category and event type remain native selects

- **WHEN** an admin opens Create Event or Edit Event
- **THEN** category and event type are native HTML selects (or documented native multi pattern) with unchanged `name` attributes

### Requirement: Admin event numeric fields

Admin event create/edit forms SHALL use native HTML `<input type="number">` for credit price and total capacity (and any shared admin number primitive). HeroUI `NumberField` SHALL NOT be required for those fields. Bounds and SSR field names remain unchanged (`credit_price`, `total_capacity`). Native number inputs SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native number classes from `globals.css` (e.g. `.admin-native-number`).

#### Scenario: Capacity is a native number input

- **WHEN** an admin opens Create Event
- **THEN** total capacity is a native number input with an accessible label and posts the existing field name on submit

#### Scenario: Credit price is a native number input

- **WHEN** an admin opens Create Event
- **THEN** credit price is a native number input with an accessible label and posts the existing field name (`credit_price`) on submit

#### Scenario: Numeric bounds and defaults unchanged

- **WHEN** an admin creates an event without overriding numeric fields
- **THEN** credit price defaults to at least 1 and total capacity defaults to 10 (matching existing product/parser defaults)
- **AND** client-side min constraints remain ≥ 1 for both fields

### Requirement: Admin event languages and age groups multi-select

The admin event form SHALL capture `languages` and `target_age_groups` as multi-value fields with predefined options, not comma-separated free text. Controls SHALL be native HTML (`<select multiple>` or a native checkbox group) posting the same array field names (`languages`, `target_age_groups`) accepted by admin parsers. Submitted values SHALL persist to the existing `text[]` and enum-array columns respectively. HeroUI `Select` / `ListBox` SHALL NOT be required for these fields.

#### Scenario: Admin selects multiple languages

- **WHEN** an ADMIN selects German and English in the languages multi-value control and submits a valid form
- **THEN** the event row stores both language codes in `languages`

#### Scenario: Admin selects multiple age groups

- **WHEN** an ADMIN selects two or more target age group options and submits a valid form
- **THEN** the event row stores the selected values in `target_age_groups`

#### Scenario: Multi-value POST field names unchanged

- **WHEN** an ADMIN submits languages and target age groups via the native multi-value controls
- **THEN** the request body still uses the `languages` and `target_age_groups` array field names

### Requirement: Admin event map geolocation with zoom

The admin event form SHALL provide a map-based geolocation picker (MapLibre GL JS with OpenStreetMap tiles) instead of free-text latitude and longitude fields. The form SHALL persist latitude, longitude, and map zoom level on the event record.

#### Scenario: Admin sets location via map

- **WHEN** an ADMIN places a marker on the geolocation map and submits a valid form
- **THEN** the event row stores the marker coordinates in `lat` and `lng` and the map zoom in `map_zoom`

#### Scenario: Edit restores map viewport

- **WHEN** an ADMIN opens edit for an event that has `lat`, `lng`, and `map_zoom` set
- **THEN** the map picker initializes centered at those coordinates and zoom level

### Requirement: Admin event list thumbnails

The admin events list SHALL display a thumbnail for each event with an `image_id`, using the `small-320.jpg` variant URL from `@unveiled/images`.

#### Scenario: List thumbnail from small-320 variant

- **WHEN** an ADMIN views `/admin/events` and an event has a persisted image
- **THEN** the list row shows a thumbnail loaded from `{IMAGE_PUBLIC_BASE_URL}/images/{image_id}/small-320.jpg`

### Requirement: Demo seed idempotency

The `scripts/seed-demo.ts` script invoked by `bun run seed:demo` SHALL insert demo partners and events only when both `partners` and `events` table counts are zero, and SHALL perform no inserts when any partner or event already exists.

#### Scenario: Seed on empty database

- **WHEN** both `partners` and `events` are empty and seed runs
- **THEN** at least one partner and one upcoming event exist

#### Scenario: Seed skipped when data exists

- **WHEN** at least one partner or event exists and seed runs
- **THEN** row counts are unchanged

### Requirement: Demo seed writes JPEG variants

`bun run seed:demo` SHALL populate catalog images through `@unveiled/images` so seeded objects use the six `.jpg` filenames and are viewable on Workers without a separate local upload pass.

#### Scenario: Fresh demo seed

- **WHEN** an operator runs `bun run seed:demo` against a database with R2 configured
- **THEN** seeded events/partners reference images whose public variant URLs end in `.jpg` and resolve successfully

#### Scenario: Seed uses the shared image pipeline

- **WHEN** demo seed creates partners and events with remote or generated image sources
- **THEN** image persistence goes through the catalog domain + `@unveiled/images` sip pipeline (not a sharp-only or WebP-filename side path)

### Requirement: Admin partner SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/partners/*` for list, create, edit, and delete of partner **venue records** (not partner login accounts), using dedicated form POST pages without client-side modals, matching `docs/product/sitemap/sitemap.md`. List route SHALL support `?q=` search on **partner name only** and `?page=` pagination (page size 25) per `docs/product/extras/pagination-and-search.md`. List results SHALL be ordered by `created_at` descending, then `id` descending. Create and edit forms SHALL accept multipart logo file upload or remote logo URL (exactly one source when provided) and delegate validation and image processing to the catalog domain layer.

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

### Requirement: Admin dashboard demo seed control

The `/:locale/admin` dashboard SHALL display quick links to admin sections and a control to run demo seed data only when both partners and events tables are empty, invoking the same `runDemoSeed` logic as `bun run seed:demo`.

#### Scenario: Seed on empty database from dashboard

- **WHEN** both partners and events are empty and an ADMIN submits the dashboard seed action
- **THEN** demo partners and events are created and the seed control is no longer shown

#### Scenario: Seed button hidden after data exists

- **WHEN** at least one partner or event exists
- **THEN** the dashboard does not offer the empty-DB seed action

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, series create, edit, delete, and redemption code export, using dedicated form POST pages without client-side modals, matching `docs/product/sitemap/sitemap.md` and `docs/product/features/admin-events.feature`. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records. Create and edit forms SHALL accept multipart **file upload** for images (required on create; optional replace on edit) and delegate validation, image processing, and storage to the catalog domain layer and `@unveiled/images`. Admin event forms SHALL NOT accept remote image URL paste.

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

### Requirement: Admin event series confirm survives preview remount

When an ADMIN creates an event series via `/admin/events/series/new`, the confirm POST after preview SHALL include the partner id, redemption configuration, and event image required by `createEventSeries`, even if the client remounts the form tree between preview and confirm. Required select values SHALL be carried by named native form controls (or equivalent named inputs), not by ephemeral display-only widget state. Playwright scenarios for manual-slot and date-range series creation SHALL assert successful create (redirect to the admin events list and visible event titles), not the preview step alone.

#### Scenario: Manual series confirm creates events

- **WHEN** an ADMIN configures a series with manual slots, previews, re-attaches a required image if needed, and confirms
- **THEN** one event is created per slot
- **AND** the events appear on `/admin/events`

#### Scenario: Date-range series confirm creates events

- **WHEN** an ADMIN configures a series with the date-range builder, previews, re-attaches a required image if needed, and confirms
- **THEN** events for the generated slots are created
- **AND** the events appear on `/admin/events`

#### Scenario: Confirm does not drop partner_id after remount

- **WHEN** the series form remounts between preview and confirm with a previously chosen partner
- **THEN** the confirm POST still includes a non-empty `partner_id` matching that partner

### Requirement: Admin event list discovery aids

The admin events list at `/:locale/admin/events` SHALL support GET search and pagination (`?q=&page=`, page size 25) per `docs/product/extras/pagination-and-search.md`, searching event title and denormalized partner name. List results SHALL be ordered by `created_at` descending, then `id` descending. The list SHALL display a `small-320` thumbnail for each event's image when present, plus title, partner, date/time (Europe/Berlin), capacity, and row actions for edit, delete, and codes export.

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

### Requirement: EventCard public component

The `@unveiled/ui` package SHALL export an `EventCard` component matching `docs/product/ui/ui-component-map.md` (product SoT updates for CTA copy may lag until hardening), using image variants `medium-640` and `small-320` via srcset. The primary CTA SHALL use the label **Book Now** / **Bin dabei** when remaining capacity is greater than zero, for both guests and signed-in members regardless of subscription status. When remaining capacity is zero, the CTA SHALL use **Waitlist** / **Warteliste**. The primary CTA SHALL navigate to the public event detail route `/:locale/events/:id` and SHALL NOT navigate directly to `/events/:id/book` or `/membership`.

#### Scenario: Guest Book Now opens detail

- **WHEN** a guest views an EventCard with remaining capacity
- **THEN** the primary CTA label is Book Now (or Bin dabei)
- **AND** following the CTA opens `/:locale/events/:id` without authentication

#### Scenario: Member Book Now regardless of subscription

- **WHEN** a signed-in member with inactive subscription views an EventCard with remaining capacity
- **THEN** the primary CTA label is Book Now (or Bin dabei)

#### Scenario: Sold-out Waitlist label

- **WHEN** any viewer sees an EventCard with zero remaining capacity
- **THEN** the primary CTA label is Waitlist (or Warteliste)

#### Scenario: Bookmark control accessibility

- **WHEN** EventCard renders a save toggle
- **THEN** the control exposes an `aria-label` describing save/unsaved state

### Requirement: EventCard hover affordance

On devices that support hover, the `EventCard` SHALL colorize the grayscale cover image and emphasize the card with a layout-neutral hard-offset border shadow and slight scale. The card SHALL NOT show an availability / capacity yellow strip. Hover transitions on the image SHALL be disabled or near-instant when the user prefers reduced motion. Date and credit price on the card SHALL be visible only for members with an active subscription; guests and inactive members SHALL NOT see those fields on the card.

#### Scenario: Pointer hover colorizes cover image

- **WHEN** a user with a hover-capable pointer moves over an EventCard that shows a cover image
- **THEN** the cover image leaves grayscale and appears in full color
- **AND** no availability strip is shown

#### Scenario: Reduced motion prefers less transition

- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** hover transitions on the EventCard image are disabled or near-instant

#### Scenario: Guests do not see date or credits on the card

- **WHEN** a guest views Discover EventCards
- **THEN** date and credit price are not shown on the card

### Requirement: EventCard hover documented in stories

`@unveiled/ui` EventCard Ladle stories SHALL include a state that demonstrates the hover colorize (or an equivalent forced-visible preview) so theme reviews do not require a live browser hover. The product UI component map SHALL describe the EventCard hover contract without an availability strip, and SHALL note that date/credits are subscribed-member-only.

#### Scenario: Story shows colorized cover

- **WHEN** a developer opens the EventCard hover-preview story
- **THEN** the cover is colorized without requiring a pointer hover

#### Scenario: Product map matches subscriber-only meta

- **WHEN** an implementer reads the EventCard entry in `docs/product/ui/ui-component-map.md`
- **THEN** the description states date/credits are for subscribed members only and that there is no availability strip

### Requirement: Discover page live event preview

The public locale home `/:locale` (Discover) SHALL render up to six upcoming events from the database using EventCard components instead of static placeholder content.

#### Scenario: Discover shows upcoming catalog events

- **WHEN** at least one future event exists in the catalog
- **THEN** `/` (locale home) displays up to six EventCards ordered by ascending `date_time`

### Requirement: Public event detail page

The web app SHALL serve `/:locale/events/:id` without requiring authentication for guests and crawlers, presenting a checkout-focused layout: an identity column (category // partner, title, description, location, hero image) and a summary/action card showing ticket quantity affordance (when applicable), contextual membership/auth messaging, and the primary next-step CTA. Membership credit cost/total and event date/time chrome SHALL be visible only to booking-eligible viewers (SSR `EventDetailViewer.kind === "eligible"` / `ACTIVE` + `CANCELLED_PENDING`); guests and other non–booking-eligible signed-in viewers SHALL NOT see those fields in the page UI. On large viewports the identity column and summary card SHALL share a common top alignment within the main content grid. The hero image SHALL span the identity column width and use responsive sizing appropriate to sm/md/lg viewports (not a permanently undersized inset box). Share/OG metadata SHALL continue to be rendered. JSON-LD `schema.org/Event` MAY still include `startDate` for crawlers even when UI date chrome is gated. Product docs under `docs/product/` (sitemap auth column, SEO indexability, authorization matrix) SHALL mark this route as public (`Auth` empty/`—`, not USER-required). Bookable future events (`date_time` in the future and remaining capacity > 0) SHALL be indexable; sold-out and past events SHALL still render HTTP 200 with a clear state and `noindex, follow`. Booking, waitlist, and save mutations SHALL remain on dedicated authenticated routes; the detail page SHALL NOT create bookings or ledger entries. A close control SHALL navigate via Link to Discover or the member events feed (or a safe `returnTo`), not dismiss a client-only modal.

#### Scenario: Guest opens a shared event link

- **WHEN** a guest opens `/:locale/events/:id` for a published upcoming event
- **THEN** the SSR page renders event content and share/OG metadata without requiring login

#### Scenario: Guest sees checkout card

- **WHEN** a guest opens `/:locale/events/:id` for a bookable upcoming event
- **THEN** they see event identity content and a summary card with a login (or equivalent unlock) CTA
- **AND** they do not see membership credit totals or event date/time chrome
- **AND** they are not forced through auth before viewing the page

#### Scenario: Booking-eligible member sees credits and date

- **WHEN** a booking-eligible member opens the same bookable event detail
- **THEN** membership credit total and event date/time chrome remain visible
- **AND** the primary CTA continues to support booking

#### Scenario: Guest sees aligned checkout composition on large viewport

- **WHEN** a guest opens a valid upcoming event detail URL on a large viewport
- **THEN** the identity content and summary card begin at approximately the same vertical origin
- **AND** the hero image fills the identity column width

#### Scenario: Stacked layout on small viewport

- **WHEN** a guest opens the same page on a small viewport
- **THEN** identity content stacks above the summary card without overlapping the close control

#### Scenario: Eligible member continues to SSR book

- **WHEN** a booking-eligible member opens the same detail page
- **THEN** the primary CTA continues to the dedicated SSR book route `/:locale/events/:id/book`
- **AND** credit deduction still occurs only via the booking domain on that SSR flow

#### Scenario: Close returns to browse

- **WHEN** a visitor activates the detail page close control
- **THEN** they navigate to Discover or the member events feed (as appropriate) rather than dismissing a client-only modal

#### Scenario: Unauthenticated event detail

- **WHEN** a visitor opens a valid upcoming event detail URL
- **THEN** the page returns 200 with hero srcset, identity content, partner/location info, and a checkout summary card whose booking CTA links to login or membership — not an auth redirect

#### Scenario: Event detail Open Graph image

- **WHEN** the event detail HTML is rendered
- **THEN** `og:image` and `twitter:image` reference the event's `og-1200x630` variant URL

#### Scenario: Event JSON-LD stub

- **WHEN** the event detail HTML is rendered
- **THEN** a `schema.org/Event` JSON-LD block includes at minimum name, startDate, location, image (hero-1920 URL), description, and organizer

#### Scenario: Unknown event id

- **WHEN** the id does not exist
- **THEN** the server renders a locale-aware 404 page

#### Scenario: Product sitemap marks detail public

- **WHEN** an agent reads `docs/product/sitemap/sitemap.md` after this change
- **THEN** `/events/:id` has Auth empty/`—` (not USER-required) while `/events/:id/book` and waitlist remain gated

### Requirement: Detail checkout quantity affordance

The public event detail summary card ticket quantity control SHALL use guest max 3 and signed-in max derived from session credits and event remaining capacity (see booking ticket-count bounds). Quantity on detail remains navigation state only (`qty` query) and SHALL NOT create bookings or ledger entries.

#### Scenario: Eligible member sees credit-aware max on detail

- **WHEN** an eligible member opens event detail with enough credits for more than 3 tickets and sufficient capacity
- **THEN** the quantity control can increase beyond 3 up to that computed max

#### Scenario: Guest detail qty stays at three

- **WHEN** a guest opens the same bookable event detail page
- **THEN** the quantity control does not offer a value above 3

### Requirement: Public event detail below-fold metadata

The public event detail page SHALL present below-the-fold DETAILS metadata in a dense, scannable layout that uses horizontal space on medium and large viewports (multi-column label/value grid), rather than a single sparse vertical list inside a wide empty card. The date/time (“when”) metadata cell SHALL be included only for booking-eligible viewers; other applicable DETAILS fields remain for all viewers. LOCATION SHALL show the address and embedded map with chrome that does not leave large unused bands beside the map content. Visual language SHALL remain consistent with Discover EventCard density (uppercase labels, clear hierarchy) while staying on the event-detail surface.

#### Scenario: DETAILS uses horizontal space on large viewport

- **WHEN** a user views an event detail page with multiple metadata fields on a large viewport
- **THEN** DETAILS fields appear in a multi-column grid
- **AND** large empty horizontal regions inside the DETAILS card are avoided

#### Scenario: Guest DETAILS omits date/time cell

- **WHEN** a guest (or other non–booking-eligible viewer) opens public event detail
- **THEN** the DETAILS block does not show the date/time metadata cell
- **AND** other applicable DETAILS fields may still render

#### Scenario: LOCATION shows address and full-width map

- **WHEN** the event has coordinates
- **THEN** the LOCATION block shows the address and a map that spans the content width of its card

### Requirement: Automated browser coverage for admin catalog management

Each Gherkin scenario in `docs/product/features/admin-events.feature` and `docs/product/features/admin-partners.feature` SHALL have a Playwright test with a title matching the scenario line (or Scenario Outline plus example row). Partner scenarios SHALL live in `e2e/specs/admin-partners.spec.ts` and event scenarios in `e2e/specs/admin-events.spec.ts`. Tests SHALL sign in as ADMIN via `loginAsAdmin` / `E2E_ADMIN_*`, use proximity selectors only, and use unique timestamp suffixes for created partner/event names and portal emails. Image upload/URL processing tests SHALL call `test.skip` with reason `R2 vars not configured` when any required R2 env var (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL`) is missing. Image specs SHALL NOT skip solely because the target host is Cloudflare Workers; `e2e/README.md` SHALL allow running image uploads against `bun run dev` and, when configured, against a Workers preview or staging base URL.

#### Scenario: Admin partner CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-partners.spec.ts`
- **THEN** partner create/edit/delete, logo upload or URL, name propagation, QR regeneration, and portal-access flows are asserted in the browser

#### Scenario: Admin event CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-events.spec.ts`
- **THEN** single and series event creation, image required/upload/URL, redemption validation, capacity recalculation, edit, delete, optional metadata, export (or explicit skip with reason), and seed-demo behaviors are asserted

#### Scenario: Published events surface on public pages

- **WHEN** an admin creates or edits an event via the E2E flow
- **THEN** the event appears on the locale home (Discover) and is viewable on `/events/:id` without authentication
- **AND** after a partner rename, the updated partner name is visible on discover for that partner's events

#### Scenario: Image tests skip when R2 is unavailable

- **WHEN** R2 / image env vars are not fully configured
- **THEN** image upload and remote-URL processing tests skip with an explicit reason string
- **AND** they do not fail the suite

#### Scenario: E2E docs do not require sharp-only local uploads

- **WHEN** an operator reads `e2e/README.md` image-test guidance
- **THEN** the docs do not state that admin uploads require `bun run dev` + `sharp` or that Workers preview cannot upload

### Requirement: Featured events curation store

The system SHALL persist an admin-curated featured event list in a dedicated `featured_events` table keyed by existing `events.id`, without duplicating event payload columns. Each row SHALL store `event_id` (PK, FK → `events.id` ON DELETE CASCADE), `sort_order` (integer, not null), and `created_at` (timestamptz, not null, default now). The `@unveiled/db` catalog domain SHALL expose helpers to list featured events (optional upcoming-only filter using UTC `now` against `events.date_time`), list featured event ids, search catalog events excluding already-featured rows (title/partner search consistent with `listEvents`), add a featured row with append `sort_order` (reject missing or already-featured events), and remove a featured row without deleting the underlying `events` row.

#### Scenario: Featured row references catalog event

- **WHEN** an event is added to the featured list
- **THEN** a `featured_events` row is stored for that `event_id` with a `sort_order`
- **AND** the underlying `events` row remains unchanged

#### Scenario: Remove from featured does not delete event

- **WHEN** an event is removed from the featured list
- **THEN** only the `featured_events` row is deleted
- **AND** the `events` row still exists

#### Scenario: Deleting an event clears featured membership

- **WHEN** a catalog event is deleted
- **THEN** any `featured_events` row for that event is removed via FK cascade

#### Scenario: Duplicate feature rejected

- **WHEN** `addFeaturedEvent` is called for an `event_id` that is already featured
- **THEN** the operation fails without inserting a second row

#### Scenario: Upcoming filter on featured list

- **WHEN** `listFeaturedEvents` is called with upcoming-only enabled and a fixed `now`
- **THEN** only featured events with `date_time >= now` are returned
- **AND** results are ordered by `sort_order` then `date_time`
