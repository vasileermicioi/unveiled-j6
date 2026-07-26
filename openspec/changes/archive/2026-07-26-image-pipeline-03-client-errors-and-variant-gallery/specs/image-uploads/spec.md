## ADDED Requirements

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
