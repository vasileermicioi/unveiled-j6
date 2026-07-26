## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Event gallery images documented in image-upload SoT

Product image-upload docs SHALL describe optional multi-image event galleries (`event_gallery_images`) as an in-scope companion to the required primary event image (`events.image_id`). Docs SHALL state that each gallery photo uses the same five WebP variant pipeline and cleanup rules as other catalog images, that gallery membership MUST NOT replace the primary hero, and that event delete / gallery remove clean up unreferenced gallery image rows and bucket objects. Docs SHALL NOT list multi-image galleries as deliberately out of scope.

#### Scenario: Image-uploads doc covers galleries

- **WHEN** an agent reads `docs/product/extras/image-uploads.md` after this step
- **THEN** multi-image event galleries are documented (or cross-linked) rather than listed as out of scope
- **AND** the primary hero image remains described as singular and required for events
- **AND** gallery photos are described as using the five WebP variant pipeline (not six JPEG)
