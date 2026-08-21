## ADDED Requirements

### Requirement: Event wizard restores unsaved drafts

Admin event create and edit wizards SHALL persist in-progress field values in browser `localStorage` (not cookies) keyed per create-session or event id, restore them after a refresh or step URL change, and clear them after a successful create or save POST. Raw `File` inputs SHALL NOT be stored. Create GET on `/:locale/admin/events/new/dates` and `/:locale/admin/events/new/image` SHALL render those steps (no redirect to step 1) so a restored draft can populate the form. A visible restore notice SHALL offer Discard draft.

#### Scenario: Refresh on an edit step keeps unsaved title

- **WHEN** an admin changes the title on `/:locale/admin/events/:id/edit` and refreshes
- **THEN** the title field still shows the unsaved value
- **AND** a discard control is available

#### Scenario: Edit step link keeps unsaved dates

- **WHEN** an admin changes a datetime row on step 2, then follows the General step link
- **THEN** returning to Date & tickets still shows the unsaved datetime row

#### Scenario: Successful save clears the draft

- **WHEN** an admin saves the event successfully
- **THEN** reopening the edit form shows database values, not the previous unsaved draft

#### Scenario: Create dates GET does not bounce to step 1

- **WHEN** an admin opens `/:locale/admin/events/new/dates` after having filled General (draft stored)
- **THEN** the page renders Date & tickets instead of redirecting to General

#### Scenario: Discard draft reloads server values

- **WHEN** an admin has a restored draft on create or edit and activates Discard draft
- **THEN** the stored draft is removed
- **AND** the form shows server-rendered values (database on edit, empty/defaults on create)

#### Scenario: File inputs are not stored

- **WHEN** an admin selects a primary image file on the Image step and a draft is saved
- **THEN** the stored draft does not contain raw file bytes
- **AND** already-staged image id fields that exist as named non-file inputs MAY be restored
