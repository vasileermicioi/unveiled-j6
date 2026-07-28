## ADDED Requirements

### Requirement: Event image survives failed create/edit submit
Admin event create, edit, and series forms SHALL retain a client-processed primary image across server-side validation or catalog errors so the admin does not lose the upload. Behavior SHALL match the image-uploads retention requirement: staged `imageId` plus variant gallery on error re-render, and resubmit without re-select. On create and series, a staged `imageId` without a newly selected file SHALL satisfy the required primary image rule. On edit, a newly staged replacement SHALL be preferred over the previous DB image for the error re-render preview. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include acceptance scenarios for this retention behavior.

#### Scenario: Failed create keeps event image for retry
- **WHEN** I create an event with a processed image and the submit is rejected
- **THEN** I still see the resized-variant preview for that image on the form
- **AND** I can retry submit without uploading the image again

#### Scenario: Failed series create keeps event image for retry
- **WHEN** I create an event series with a processed image and the submit is rejected
- **THEN** I still see the resized-variant preview for that image on the form
- **AND** I can retry submit without uploading the image again

#### Scenario: Failed edit keeps newly processed replacement image for retry
- **WHEN** I edit an event, process a replacement primary image, and the submit is rejected
- **THEN** the re-rendered form shows the newly processed/staged replacement preview
- **AND** I can retry submit without choosing the replacement file again
