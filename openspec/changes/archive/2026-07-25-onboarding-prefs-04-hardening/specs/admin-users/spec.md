## ADDED Requirements

### Requirement: Admin member detail preference intel matches preference options

The Membership HQ detail page at `/:locale/admin/users/:id` SHALL present member preference intel using the shipped allowlists and fields: districts as the 12 Berlin Bezirke values when stored; preferred languages from the member language catalog (not Non-Verbal); `interests_other` when set (per existing interests_other requirement). When `max_distance` is null, the detail page MUST NOT present travel distance / radius as an active preference row.

#### Scenario: Detail omits null travel distance

- **WHEN** an admin opens a member detail page for a user whose `max_distance` is null
- **THEN** the preferences section does not show travel distance / radius as an active preference

#### Scenario: Detail shows districts and languages from new allowlists

- **WHEN** an admin opens a member detail page for a user with Bezirk districts and preferred language codes from the member catalog
- **THEN** those stored values are visible in the preferences section
- **AND** the page does not invent Non-Verbal or informal district shorthand labels for missing data
