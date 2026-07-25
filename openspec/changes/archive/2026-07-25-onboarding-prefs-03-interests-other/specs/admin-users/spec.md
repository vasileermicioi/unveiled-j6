## ADDED Requirements

### Requirement: Admin member detail shows interests_other
When a member profile includes a non-empty `interests_other` value, the Membership HQ detail page at `/:locale/admin/users/:id` SHALL display that free-text interest alongside other preference fields. When `interests_other` is null or empty, the detail page SHALL omit the field or show the same empty-state pattern used for other sparse preference values.

#### Scenario: Detail shows Other interest text
- **WHEN** an admin opens a member detail page for a user whose profile has `interests` containing `Other` and a non-empty `interests_other`
- **THEN** the free-text interest is visible in the preferences section

#### Scenario: Detail omits empty interests_other
- **WHEN** an admin opens a member detail page for a user with no `interests_other`
- **THEN** the preferences section does not invent a placeholder value for that field
