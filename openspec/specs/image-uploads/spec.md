# Image Uploads

Client and server contracts for the six-variant JPEG image pipeline used by admin event and partner uploads.

## Requirements

### Requirement: Client-side variant generation contract
The system SHALL be able to produce the six product JPEG variants (`original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, `small-320.jpg`, `og-1200x630.jpg`) in the browser using Pica (plus canvas cover-crop for OG), matching the dimension and non-upscale rules already defined for server-side generation.

#### Scenario: Generator emits six JPEG variants
- **WHEN** a valid source image (≥800×420, JPEG/PNG/WebP) is passed to the client generator
- **THEN** it returns six JPEG blobs named with the fixed variant filenames and OG exactly 1200×630

#### Scenario: Aspect-preserving variants never upscale
- **WHEN** a valid source image narrower than a ladder target (e.g. width 800) is passed to the client generator
- **THEN** each of `original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, and `small-320.jpg` has width less than or equal to the source width (and within that variant’s max edge/width cap)

#### Scenario: Undersized sources are rejected
- **WHEN** a source image smaller than 800×420 is passed to the client generator
- **THEN** the generator fails validation without emitting a partial variants map

### Requirement: Server accepts prebuilt variant sets
The system SHALL accept a complete set of six prebuilt JPEG variants from a trusted admin upload flow, validate them, store all six objects under `images/{id}/`, and insert one `images` row — without re-encoding or resizing on the server for that path.

#### Scenario: Valid prebuilt set persists
- **WHEN** an admin submission includes all six valid JPEG variants for a new image id
- **THEN** the server uploads those objects and returns/stores the image id for event or partner attachment

#### Scenario: Incomplete variant set rejected
- **WHEN** any of the six required variant files is missing or not JPEG
- **THEN** the server rejects the submission and does not leave a partial public image id referenced by events/partners

#### Scenario: Invalid OG or ladder dimensions rejected
- **WHEN** `og-1200x630.jpg` is not exactly 1200×630, or a ladder variant exceeds its max width/edge cap or is larger than the inspected `original.jpg`
- **THEN** the server rejects the submission without inserting an `images` row for attach

#### Scenario: Prebuilt path does not resize
- **WHEN** a valid prebuilt variant set is persisted through the prebuilt accept API
- **THEN** the server does not re-encode or resize those JPEG bytes and stores the submitted bytes as-is

### Requirement: Admin direct upload processing location
The system SHALL generate the six JPEG variants for admin image supply (local file picker and remote URL via authenticated bytes proxy) in the browser with Pica before the SSR form POST, and the server SHALL persist those prebuilt variants to object storage without server-side resize for that submission. Admin image upload REQUIRES JavaScript.

#### Scenario: Admin picks a local image file
- **WHEN** an admin selects a valid image file on event or partner create/edit and submits the form
- **THEN** the client produces six JPEG variants and the server stores them under `images/{id}/` without server-side resize for that submission

#### Scenario: Client processing failure surfaces before persist
- **WHEN** the client generator rejects or fails on a selected file (undersized, unreadable, or processing error)
- **THEN** the admin sees a localized processing error and the form does not persist a new catalog image from that incomplete attempt

#### Scenario: Admin image supply requires JavaScript
- **WHEN** an admin attempts to supply a new event or partner image (file or remote URL)
- **THEN** variant generation runs in the browser and the supported path requires JavaScript

### Requirement: Workers runtime has no sip resize
The system SHALL NOT depend on `@standardagents/sip` for image resizing in the Cloudflare Workers deployable or in the `@unveiled/images` server entry used by that deployable. Admin variant generation for uploads and remote URLs SHALL run in the browser with Pica; the server SHALL validate and store prebuilt JPEG variants only.

#### Scenario: Workers runtime has no sip resize
- **WHEN** the web app is built for Cloudflare Workers
- **THEN** the deployable does not depend on `@standardagents/sip` for image resizing

### Requirement: Admin remote URL uses bytes proxy then client Pica
When an admin supplies a remote image URL (instead of a local file), the system SHALL fetch the image bytes through an authenticated admin bytes proxy, generate the six JPEG variants in the browser with Pica, and persist them via the same prebuilt accept path as file-picker uploads. The server SHALL NOT resize remote-URL images with sip or any other Worker-side encoder.

#### Scenario: Admin pastes a remote image URL
- **WHEN** an admin pastes a valid remote image URL on event create/edit and completes client processing
- **THEN** the island obtains bytes via the admin proxy, produces six JPEG variants with Pica, and the server stores those prebuilt variants without Worker-side resize

#### Scenario: Proxy rejects unsafe or failed remote fetch
- **WHEN** the remote URL is unreachable, exceeds size/type limits, or fails admin-proxy validation
- **THEN** the admin sees a localized error and no new catalog image is persisted from that attempt
