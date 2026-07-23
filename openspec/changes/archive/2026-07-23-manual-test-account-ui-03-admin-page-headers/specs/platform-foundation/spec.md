## ADDED Requirements

### Requirement: Shared on-yellow page header includes admin

Admin authenticated pages that use `AdminPageShell` SHALL render their primary page title through the shared `PageSectionHeader` pattern (muted uppercase eyebrow, bold headline, horizontal rule), consistent with member and marketing on-yellow headers. Optional admin subtitle and action toolbar MAY appear below the header. Admin tab navigation SHALL remain above the page header. Admin pages SHALL NOT use a one-off bare heading stack that diverges from `PageSectionHeader` without an explicit product exception.

#### Scenario: Admin list page uses PageSectionHeader

- **WHEN** an ADMIN opens `/en/admin/partners` (or another AdminPageShell list page)
- **THEN** the page title is rendered with the shared PageSectionHeader treatment (eyebrow + headline + rule)
- **AND** the admin tablist remains above that header

#### Scenario: Admin nested page keeps breadcrumbs and header pattern

- **WHEN** an ADMIN opens a nested admin page that shows breadcrumbs
- **THEN** breadcrumbs remain available
- **AND** the page title still uses the shared PageSectionHeader pattern
