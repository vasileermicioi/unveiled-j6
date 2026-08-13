# Image Uploads

Client and server contracts for the five-variant WebP image pipeline used by admin event and partner uploads.

## Requirements

### Requirement: Client-side variant generation contract
The system SHALL produce exactly five product WebP variants (`hero-1920.webp`, `large-1280.webp`, `medium-640.webp`, `small-320.webp`, `og-1200x630.webp`) in the browser using Pica (plus canvas cover-crop for OG). Source input SHALL be any image the browser can decode for rasterization (including SVG); output SHALL always be WebP. The client SHALL NOT reject sources solely for being smaller than 800×420 or larger than 8 MB. Aspect-preserving ladder variants SHALL NOT upscale beyond the decoded source width/height (OG cover-crop MAY upscale to exactly 1200×630).

#### Scenario: Generator emits five WebP variants
- **WHEN** a browser-decodable source image is passed to the client generator
- **THEN** it returns five WebP blobs named with the fixed variant filenames and OG exactly 1200×630

#### Scenario: Aspect-preserving variants never upscale
- **WHEN** a valid source image narrower than a ladder target (e.g. width 800) is passed to the client generator
- **THEN** each of `hero-1920.webp`, `large-1280.webp`, `medium-640.webp`, and `small-320.webp` has width less than or equal to the source width (and within that variant’s max edge/width cap)

#### Scenario: Undersized sources are not rejected for dimensions
- **WHEN** a source smaller than 800×420 is passed to the client generator
- **THEN** generation proceeds (subject to successful decode/encode); dimension-based rejection for 800×420 SHALL NOT apply

#### Scenario: SVG and non-JPEG sources are accepted
- **WHEN** a valid SVG (or other browser-decodable raster format) is selected
- **THEN** the client rasterizes it, emits WebP variants, and does not upload the raw source bytes

#### Scenario: No original master is produced
- **WHEN** variant generation succeeds
- **THEN** the variants map does not include `original.webp` / `original.jpg` and no source-format object is uploaded

### Requirement: Server accepts prebuilt variant sets
The system SHALL accept a complete set of five prebuilt WebP variants from a trusted admin upload flow, validate them, store all five objects under `images/{id}/` with Content-Type `image/webp`, and insert one `images` row — without re-encoding or resizing on the server for that path. The server SHALL NOT enforce the former 800×420 or 8 MB product limits on these prebuilt variants (aside from any explicitly documented abuse/DoS caps). Ladder non-upscale checks SHALL use client-claimed source dimensions when no original master is present. OG SHALL remain exactly 1200×630.

#### Scenario: Valid prebuilt WebP set persists
- **WHEN** an admin submission includes all five valid WebP variants for a new image id
- **THEN** the server uploads those objects and returns/stores the image id for event or partner attachment

#### Scenario: Incomplete or non-WebP set rejected
- **WHEN** any required variant file is missing or not WebP
- **THEN** the server rejects the submission and does not leave a partial public image id referenced by events/partners

#### Scenario: Invalid OG or ladder dimensions rejected
- **WHEN** `og-1200x630.webp` is not exactly 1200×630, or a ladder variant exceeds its max width/edge cap or is larger than the claimed source dimensions
- **THEN** the server rejects the submission without inserting an `images` row for attach

#### Scenario: Prebuilt path does not resize
- **WHEN** a valid prebuilt variant set is persisted through the prebuilt accept API
- **THEN** the server does not re-encode or resize those WebP bytes and stores the submitted bytes as-is

### Requirement: Admin direct upload processing location
The system SHALL generate the five WebP variants for admin image supply (local file picker and remote URL via authenticated bytes proxy) in the browser with Pica before the SSR form POST, and the server SHALL persist those prebuilt variants to object storage without server-side resize for that submission. Admin image upload REQUIRES JavaScript.

#### Scenario: Admin picks a local image file
- **WHEN** an admin selects a valid image file on event or partner create/edit and submits the form
- **THEN** the client produces five WebP variants and the server stores them under `images/{id}/` without server-side resize for that submission

#### Scenario: Client processing failure surfaces before persist
- **WHEN** the client generator rejects or fails on a selected file (unreadable, encode unsupported, or processing error)
- **THEN** the admin sees a localized processing error and the form does not persist a new catalog image from that incomplete attempt

#### Scenario: Admin image supply requires JavaScript
- **WHEN** an admin attempts to supply a new event or partner image (file or remote URL)
- **THEN** variant generation runs in the browser and the supported path requires JavaScript

### Requirement: Workers runtime has no sip resize
The system SHALL NOT depend on `@standardagents/sip` for image resizing in the Cloudflare Workers deployable or in the `@unveiled/images` server entry used by that deployable. Admin variant generation for uploads and remote URLs SHALL run in the browser with Pica; the server SHALL validate and store prebuilt WebP variants only.

#### Scenario: Workers runtime has no sip resize
- **WHEN** the web app is built for Cloudflare Workers
- **THEN** the deployable does not depend on `@standardagents/sip` for image resizing

### Requirement: Admin remote URL uses bytes proxy then client Pica
When an admin supplies a remote image URL (instead of a local file), the system SHALL fetch the image bytes through an authenticated admin bytes proxy, generate the five WebP variants in the browser with Pica, and persist them via the same prebuilt accept path as file-picker uploads. The server SHALL NOT resize remote-URL images with sip or any other Worker-side encoder. The proxy SHALL NOT reintroduce the former 8 MB product gate as a product limit; any remaining byte ceiling SHALL be an explicitly documented abuse/DoS guard. Proxy acceptance SHALL allow browser-decodable image bytes (including SVG) for client rasterization.

#### Scenario: Admin pastes a remote image URL
- **WHEN** an admin pastes a valid remote image URL on event create/edit and completes client processing
- **THEN** the island obtains bytes via the admin proxy, produces five WebP variants with Pica, and the server stores those prebuilt variants without Worker-side resize

#### Scenario: Proxy rejects unsafe or failed remote fetch
- **WHEN** the remote URL is unreachable, exceeds the documented abuse/DoS byte ceiling or timeout, or fails admin-proxy validation
- **THEN** the admin sees a localized error and no new catalog image is persisted from that attempt

### Requirement: Event gallery images documented in image-upload SoT

Product image-upload docs SHALL describe optional multi-image event galleries (`event_gallery_images`) as an in-scope companion to the required primary event image (`events.image_id`). Docs SHALL state that each gallery photo uses the same five WebP variant pipeline and cleanup rules as other catalog images, that gallery membership MUST NOT replace the primary hero, and that event delete / gallery remove clean up unreferenced gallery image rows and bucket objects. Docs SHALL NOT list multi-image galleries as deliberately out of scope.

#### Scenario: Image-uploads doc covers galleries

- **WHEN** an agent reads `docs/product/extras/image-uploads.md` after this step
- **THEN** multi-image event galleries are documented (or cross-linked) rather than listed as out of scope
- **AND** the primary hero image remains described as singular and required for events
- **AND** gallery photos are described as using the five WebP variant pipeline (not six JPEG)

### Requirement: Product documentation matches WebP pipeline
`docs/product/extras/image-uploads.md` and related schema, feature, gaps, i18n, UI-map, and DEPLOYMENT docs SHALL describe five WebP variants (no original master), browser-decodable source acceptance including SVG rasterization, removal of 800×420 and 8 MB product gates, required images for events and partners, client-visible errors that block submit, and the admin resized-variant preview gallery. Those docs SHALL NOT claim six JPEGs, `original.jpg`, optional partner logos, or the old min/max gates as current rules (historical changelog lines MAY remain when clearly marked superseded).

#### Scenario: Image-uploads doc is the SoT for the new contract
- **WHEN** an agent reads `docs/product/extras/image-uploads.md` after this step
- **THEN** it matches the shipped WebP pipeline and does not claim six JPEGs, optional partner logos, or the old min/max gates as current rules

#### Scenario: Schema overview matches WebP and required partner logo
- **WHEN** an agent reads `docs/product/database/schema-overview.md` image-pipeline notes and `partners.logo_image_id`
- **THEN** it describes five WebP variants (no original) and a non-null required partner logo FK

#### Scenario: DEPLOYMENT admin image section matches WebP
- **WHEN** an operator follows `apps/web/DEPLOYMENT.md` for admin image upload
- **THEN** it documents browser Pica → five WebP variants, JavaScript required, no sip / Worker-side resize, and does not instruct JPEG-only or 800×420 gates as current product rules

#### Scenario: Gaps log records the WebP cutover
- **WHEN** a reader checks `docs/product/extras/gaps-and-decisions.md` for image-upload decisions
- **THEN** the six-JPEG / optional-logo era is marked superseded and the five-WebP / required-logo / client-error / gallery decisions are logged

### Requirement: No source master object is stored
The system SHALL NOT store an `original` / source-master object (neither `original.jpg` nor `original.webp` nor raw source bytes) for catalog images. Only the five product WebP variants SHALL be uploaded under `images/{id}/`.

#### Scenario: Variants map excludes original
- **WHEN** variant generation or prebuilt persist succeeds
- **THEN** the variants map and bucket objects do not include `original.webp` / `original.jpg` and no source-format object is uploaded

### Requirement: SVG and non-raster sources are rasterized client-side
The system SHALL accept any image the browser can decode for rasterization (including SVG) as an admin source, rasterize it in the browser, and emit WebP variants only. The system SHALL NOT upload or serve raw SVG (or other undecoded source bytes) from object storage.

#### Scenario: SVG source is accepted and not stored raw
- **WHEN** a valid SVG (or other browser-decodable format) is selected on an admin image field
- **THEN** the client rasterizes it, emits five WebP variants, and does not upload the raw source bytes

### Requirement: Required images for events and partners
Events SHALL continue to require a primary image. Partners SHALL also require a logo image. The former “partners optional logo” rule is removed. Partner logo supply SHALL use the same client Pica → prebuilt WebP persist path as event images and SHALL be mandatory on create.

#### Scenario: Partner logo required same pipeline as events
- **WHEN** an admin creates a partner
- **THEN** logo supply uses the same client Pica → prebuilt WebP persist path as event images and is mandatory

#### Scenario: Event primary image requirement unchanged
- **WHEN** an admin creates an event without a complete prebuilt primary image set
- **THEN** the system rejects the create (existing required-primary behavior remains in force)

### Requirement: Client-visible image errors block submit
The admin image supply UI SHALL show localized errors for invalid/undecodable images, processing failures, unsupported WebP encoding, incomplete variant sets, and missing required images, and SHALL prevent form submission until the error is resolved or a valid prebuilt set is attached (edit flows may submit other fields when keeping an existing valid image).

#### Scenario: Invalid file shows error and blocks submit
- **WHEN** an admin selects a file the browser cannot decode (or processing fails)
- **THEN** a localized error is shown and submitting the form does not proceed with that incomplete image payload

#### Scenario: WebP encode unsupported shows error and blocks submit
- **WHEN** client variant generation fails because WebP encoding is not supported in the browser
- **THEN** a localized WebP-unsupported error is shown and form submit is blocked while that failed attempt remains the selected image supply

#### Scenario: Required image missing on create blocks submit
- **WHEN** an admin submits event or partner create without a successfully processed image
- **THEN** the client blocks submit and shows a localized required-image error

#### Scenario: Submit while processing is blocked
- **WHEN** an admin attempts to submit while client variant generation is still in progress
- **THEN** the client blocks submit and does not POST an incomplete prebuilt variant set

#### Scenario: Edit may keep existing valid image
- **WHEN** an admin submits event or partner edit without selecting a new file and an existing valid image is already attached
- **THEN** the client does not require a newly processed set and allows the form submit for other field updates

### Requirement: Resized-variant preview gallery
Admin event and partner image surfaces (and gallery add) SHALL show a gallery of the five resized variants for both newly processed uploads and already-uploaded images, using a tile layout comparable to Discover/featured image grids, with each tile labeled by variant size.

#### Scenario: Existing image shows five variant tiles
- **WHEN** an admin opens event or partner edit for a record with an attached image
- **THEN** they see preview tiles for hero-1920, large-1280, medium-640, small-320, and og-1200x630

#### Scenario: New processing updates the gallery
- **WHEN** client variant generation succeeds for a newly selected file
- **THEN** the gallery updates to show those five resized previews before submit

#### Scenario: Gallery-add shows variant previews for processed files
- **WHEN** an admin processes one or more files on event gallery add
- **THEN** the UI shows resized-variant previews for the processed set (per item or a compact multi-item summary) before submit

### Requirement: Optional image credit
The `images` table SHALL store an optional `credit` text (nullable). Writes SHALL trim whitespace, persist `NULL` when empty or omitted, and reject values longer than 200 characters with a catalog validation error. `credit` is independent of `source` (`UPLOAD` | `REMOTE_URL`) and `source_url`. Inserting a new image (including replacements) SHALL set credit from the submitter or `NULL` and SHALL NOT copy credit from a replaced row. The catalog SHALL allow updating `credit` on an existing image id without replacing variants. Gallery list rows SHALL include `credit` so callers can read it without a second query.

#### Scenario: Persist credit on upload
- **WHEN** an image is persisted with credit "Photo: Ada"
- **THEN** `images.credit` is `Photo: Ada`

#### Scenario: Empty credit stores null
- **WHEN** an image is persisted with blank or omitted credit
- **THEN** `images.credit` is `NULL`

#### Scenario: Credit is trimmed
- **WHEN** an image is persisted with credit "  Photo: Ada  "
- **THEN** `images.credit` is `Photo: Ada`

#### Scenario: Credit too long is rejected
- **WHEN** an image write supplies credit longer than 200 characters
- **THEN** the write is rejected with a catalog validation error
- **AND** no new `images` row is inserted for that persist

#### Scenario: Replace does not inherit credit
- **WHEN** an event or partner image is replaced with a new upload and no credit is supplied
- **THEN** the new `images` row has `credit` NULL

#### Scenario: Update credit without replacing variants
- **WHEN** `updateImageCredit` is called for an existing image id with credit "Logo: Venue"
- **THEN** `images.credit` is `Logo: Venue`
- **AND** variant objects under `images/{id}/` are left unchanged

#### Scenario: Gallery list includes credit
- **WHEN** `listEventGalleryImages` returns a gallery photo whose `images.credit` is "Photo: Ada"
- **THEN** that row’s `credit` is `Photo: Ada`

### Requirement: Admin optional credit on partner, event, and gallery images
Admin partner logo, event primary image, and gallery add/manage SHALL offer an optional credit text field (max 200). JavaScript image processing is unchanged. Field names SHALL be `image_credit` for partner logo and event primary, and `image_credit_{index}` for gallery-add files (index aligned with that file’s prebuilt set). Keeping an existing image on edit SHALL still allow changing credit via SSR POST (`updateImageCredit`) without replacing variants. Gallery add SHALL collect credit per file and persist it on the new `images` row. Gallery manage SHALL show credit under thumbs and SHALL persist credit changes on the same SSR POST as Save order (fields keyed by image id). Replacing an image SHALL apply submitted credit to the new row only; omitted or empty credit SHALL persist NULL and SHALL NOT copy the previous row. Empty credit SHALL persist NULL and SHALL NOT render a public caption. Admin copy SHALL use DE “Bildnachweis” (hint “z. B. Foto: Name”) and EN “Image credit” (hint “e.g. Photo: Name”). `docs/product/features/admin-events.feature` SHALL include scenarios titled `Event primary credit on create`, `Keep existing image and edit credit`, and `Gallery photo credit on add`. `docs/product/features/admin-partners.feature` SHALL include `Partner logo credit without replacing the file`. Playwright SHALL use those titles verbatim. R2 skip is allowed when an upload is required.

#### Scenario: Event primary credit on create
- **WHEN** I create an event and set image credit to "Photo: Ada"
- **THEN** the public event detail shows that credit under the primary image

#### Scenario: Keep existing image and edit credit
- **WHEN** I edit an event, keep the primary image, and set credit to "Logo: Venue"
- **THEN** the stored primary image credit is "Logo: Venue"
- **AND** variant objects under that image id are left unchanged

#### Scenario: Partner logo credit without replacing the file
- **WHEN** I edit a partner, keep the logo, and set credit to "Logo: Venue"
- **THEN** the stored logo image credit is "Logo: Venue"

#### Scenario: Gallery photo credit on add
- **WHEN** I add a gallery photo and set that file’s credit to "Photo: Ada"
- **THEN** the new gallery image row has credit "Photo: Ada"

#### Scenario: Empty credit omitted
- **WHEN** an image has NULL credit
- **THEN** public event detail does not show a credit caption for that image
