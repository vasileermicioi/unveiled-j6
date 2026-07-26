## ADDED Requirements

### Requirement: Partner logo image is required
The system SHALL require a processed catalog image (five WebP variants via the standard admin prebuilt pipeline) when creating a partner. `partners.logo_image_id` SHALL be NOT NULL. Editing a partner MAY replace the logo with a new prebuilt set but SHALL NOT clear the logo to empty.

#### Scenario: Create partner without logo rejected
- **WHEN** an admin submits partner create without a complete prebuilt logo variant set
- **THEN** the system rejects the create and does not insert a partner row

#### Scenario: Create partner with logo succeeds
- **WHEN** an admin submits partner create with a valid five-variant WebP logo set
- **THEN** the partner is stored with a non-null `logo_image_id` referencing that image

#### Scenario: Edit keeps logo when no replacement supplied
- **WHEN** an admin edits partner fields without supplying a new logo
- **THEN** the existing `logo_image_id` remains unchanged and non-null

#### Scenario: Edit cannot clear logo
- **WHEN** an admin attempts to clear a partner logo without supplying a replacement
- **THEN** the system does not set `logo_image_id` to NULL and the previous logo remains attached
