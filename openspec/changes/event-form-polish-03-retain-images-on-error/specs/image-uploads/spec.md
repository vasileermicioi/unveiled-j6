## ADDED Requirements

### Requirement: Retain processed primary event image across failed admin submits
When an ADMIN processes a primary event image (client Pica → five WebP variants) and the create/edit/series SSR submit fails after that image has been accepted for staging or persistence, the re-rendered form SHALL still present that image (variant preview via `imageId`) and SHALL allow a subsequent submit without requiring the admin to re-select and re-process the same file. The system SHALL NOT delete a staged primary image solely because unrelated event validation or row insert failed when that image will be offered back on the error form. Orphan cleanup of abandoned staged images remains a non-blocking operational concern. Retention SHALL use a server-staged `imageId` (variant URLs from public base) as the source of truth across SSR re-render; client-only caches MUST NOT be the sole retention path.

#### Scenario: Create validation error keeps processed image
- **WHEN** an admin processes a valid primary image on new event
- **AND** submits the form with another field invalid
- **THEN** the response re-renders the form with an error
- **AND** the processed (or staged) image remains visible in the variant preview
- **AND** the admin can correct the field and submit successfully without choosing the image again

#### Scenario: Edit validation error keeps newly processed replacement image
- **WHEN** an admin processes a replacement primary image on edit event
- **AND** submits the form with another field invalid
- **THEN** the re-rendered form keeps the newly processed/staged image preview available for retry
- **AND** the preview MUST NOT force-revert to only the previous DB image while that staged replacement remains available

#### Scenario: Staged image is not deleted on unrelated create failure
- **WHEN** a complete prebuilt primary image has been staged or persisted during create
- **AND** event row insert or unrelated catalog validation fails
- **THEN** the system does not delete that staged primary image solely because of that failure
- **AND** the error form can reference the same `imageId` on resubmit
