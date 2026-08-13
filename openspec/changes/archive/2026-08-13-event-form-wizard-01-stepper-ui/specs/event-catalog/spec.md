## ADDED Requirements

### Requirement: Admin event create and edit use a three-step form
Admin create (`/:locale/admin/events/new`) and edit (`/:locale/admin/events/:id/edit`) SHALL present fields in three steps with visible progress: (1) general — partner, title, description, structured location, category, event type, tags, language metadata; (2) datetimes and tickets — occurrence list/range builder, timing mode, capacity when SECRET_CODE, ticket type and redemption inventory; (3) image — primary image upload (required on create; optional replace on edit). The system SHALL keep all fields in a single SSR `POST` form. Inactive steps SHALL remain in the document so their values submit. Clone SHALL remain a separate dates/inventory form.

#### Scenario: Create walks three steps
- **WHEN** I open new-event
- **THEN** I see step 1 General with progress indicating step 1 of 3
- **AND** I do not see the datetime list or image uploader until I go to those steps

#### Scenario: Create submit is on the image step
- **WHEN** I am on new-event step 3
- **THEN** I can submit the form
- **AND** earlier steps' values are included in the POST

#### Scenario: Edit can jump to image
- **WHEN** I open edit-event
- **THEN** I can move to step 3 without posting
- **AND** saving posts the full form including unchanged dates and image id

#### Scenario: Missing image returns to step 3
- **WHEN** I create an event and submit without a primary image
- **THEN** the form is rejected
- **AND** the re-rendered form shows the image step
