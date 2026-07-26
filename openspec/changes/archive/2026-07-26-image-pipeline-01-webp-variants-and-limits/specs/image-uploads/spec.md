## ADDED Requirements

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

## MODIFIED Requirements

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

Product image-upload docs SHALL describe optional multi-image event galleries (`event_gallery_images`) as an in-scope companion to the required primary event image (`events.image_id`). Docs SHALL state that each gallery photo uses the same five WebP variant pipeline and cleanup rules as other catalog images, that gallery membership MUST NOT replace the primary hero, and that event delete / gallery remove clean up unreferenced gallery image rows and bucket objects. Docs SHALL NOT list multi-image galleries as deliberately out of scope. (Full product-doc rewrite for this change MAY land in Image pipeline step 04; code and this OpenSpec contract SHALL already describe five WebP variants.)

#### Scenario: Image-uploads doc covers galleries

- **WHEN** an agent reads `docs/product/extras/image-uploads.md` (after step 04 sync, or interim code/README comments)
- **THEN** multi-image event galleries are documented (or cross-linked) rather than listed as out of scope
- **AND** the primary hero image remains described as singular and required for events

## REMOVED Requirements

### Requirement: Six JPEG variants including original.jpg
**Reason:** Superseded by five WebP variants without an original master.
**Migration:** Use `VARIANT_FILENAMES` WebP set; regenerate seed/offline packs; migrate or re-upload existing R2 objects to `*.webp`.

### Requirement: Undersized sources are rejected at 800×420
**Reason:** Product dimension gate removed; undersized sources proceed when decode/encode succeeds.
**Migration:** Remove `MIN_IMAGE_WIDTH` / `MIN_IMAGE_HEIGHT` enforcement from client and prebuilt validation; keep ladder non-upscale vs source/claimed dims.
