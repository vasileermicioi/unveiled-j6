## MODIFIED Requirements

### Requirement: Admin event create and edit use a three-step form
Admin create (`/:locale/admin/events/new`) and edit (`/:locale/admin/events/:id/edit`) SHALL present fields in three steps with visible progress: (1) general — partner, title, description, structured location, category, event type, tags, language metadata; (2) Date & tickets — Timing mode; then ticket/capacity/redemption controls (capacity number when SECRET_CODE, ticket type, secret code or voucher inventory); then the range builder and editable datetime list; (3) image — primary image upload (required on create; optional replace on edit). The system SHALL keep all fields in a single SSR `POST` form. Inactive steps SHALL remain in the document so their values submit. Clone SHALL remain a separate dates/inventory form but SHALL expose Timing mode as an editable control (not a hidden-only field) so All day vs Time slot UI matches create/edit.

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

#### Scenario: Timing mode is first on Date & tickets
- **WHEN** I open create or edit event and go to step 2
- **THEN** Timing mode is shown before the datetime list and range builder

#### Scenario: Datetime list is last on Date & tickets
- **WHEN** I am on create or edit step 2
- **THEN** the range builder and datetime rows are below ticket type and redemption fields

## ADDED Requirements

### Requirement: All day hides time inputs
When `timing_mode` is `ALL_DAY`, admin create, edit, and clone datetime UIs SHALL hide every clock time input (range-builder slot times and per-row times) and SHALL hide additional time-slot rows beyond the first. Dates, per-row credits, and the first slot’s credits SHALL remain. Stored instants SHALL remain Europe/Berlin midnight for All day. When `timing_mode` is `TIME_SLOT`, date and time inputs SHALL both be shown. Hidden or unmounted time fields SHALL NOT be `required`.

#### Scenario: All day keeps dates only
- **WHEN** Timing mode is All day on create, edit, or clone
- **THEN** I do not see hour/minute inputs on the range builder or datetime rows
- **AND** I still see date fields and credits

#### Scenario: Time slot shows times
- **WHEN** Timing mode is Time slot
- **THEN** range slots and datetime rows include time inputs
