## ADDED Requirements

### Requirement: Event gallery images

The system SHALL allow zero or more gallery images per event, stored separately from the required primary `events.image_id`. Gallery membership SHALL be persisted in `event_gallery_images` with `event_id` (FK → `events.id` ON DELETE CASCADE), `image_id` (FK → `images.id` ON DELETE RESTRICT), and `sort_order` (integer, not null), using composite primary key `(event_id, image_id)`. The `@unveiled/db` catalog domain SHALL expose helpers to list gallery images for an event ordered by `sort_order` ascending, add one or more gallery images with append `sort_order` (reject when the event is missing or the resulting count would exceed **12**), and remove one or more gallery image ids (delete join rows and, when unreferenced, delete `images` rows and bucket objects per image-upload cleanup rules). Adding or removing gallery images MUST NOT replace or clear the primary hero `events.image_id`. Deleting an event MUST remove its gallery join rows (via cascade) and clean up gallery image records/objects in the same delete flow as the primary image.

#### Scenario: Add gallery images to an event

- **WHEN** an authorized admin adds one or more gallery images to an event under the configured maximum of 12
- **THEN** those images are listed for that event in `sort_order` ascending
- **AND** the primary hero `events.image_id` is unchanged

#### Scenario: Remove gallery images

- **WHEN** an authorized admin removes one or more gallery image ids from an event
- **THEN** those gallery associations are deleted
- **AND** unreferenced image objects are removed per image-upload cleanup rules
- **AND** the primary hero `events.image_id` is unchanged

#### Scenario: Gallery max size rejected

- **WHEN** `addEventGalleryImages` would cause the event's gallery count to exceed 12
- **THEN** the operation fails without inserting rows beyond the cap

#### Scenario: Deleting an event cleans gallery images

- **WHEN** a catalog event with gallery images is deleted
- **THEN** `event_gallery_images` rows for that event are removed via FK cascade
- **AND** the former gallery `images` rows and bucket objects are deleted in the same delete flow (respecting `skipBucket` in tests)
