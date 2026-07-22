## ADDED Requirements

### Requirement: Event gallery images documented in image-upload SoT

Product image-upload docs SHALL describe optional multi-image event galleries (`event_gallery_images`) as an in-scope companion to the required primary event image (`events.image_id`). Docs SHALL state that each gallery photo uses the same six JPEG variant pipeline and cleanup rules as other catalog images, that gallery membership MUST NOT replace the primary hero, and that event delete / gallery remove clean up unreferenced gallery image rows and bucket objects. Docs SHALL NOT list multi-image galleries as deliberately out of scope.

#### Scenario: Image-uploads doc covers galleries

- **WHEN** an agent reads `docs/product/extras/image-uploads.md`
- **THEN** multi-image event galleries are documented (or cross-linked) rather than listed as out of scope
- **AND** the primary hero image remains described as singular and required for events
