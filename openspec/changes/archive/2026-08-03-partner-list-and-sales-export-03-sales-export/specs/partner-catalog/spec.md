## ADDED Requirements

### Requirement: Partner list Export action

The admin partner list (`/:locale/admin/partners`) SHALL provide an **Export** action that navigates to the sales-export page (`/:locale/admin/partners/export`). The action SHALL be available at list level (toolbar), not as a partner-row-scoped export, because the report covers all events for a chosen period.

#### Scenario: Partner list links to sales export

- **WHEN** an ADMIN views the partner list
- **THEN** an **Export** action is available that opens the sales-export page

## MODIFIED Requirements

### Requirement: Admin partner list sort controls

The admin partner list SHALL offer server-driven sorting by Name, Last created, and Most events, each in ascending or descending order, selected via query params `sort` (`name` | `created` | `events`) and `dir` (`asc` | `desc`) and preserved across pagination and filtering. When `sort` is omitted, the list SHALL keep the domain default (last-created descending). Sort and direction controls SHALL be native HTML controls or plain navigational links (not HeroUI `Select`). Page size SHALL remain 25 with offset pagination. Localized admin copy SHALL include sort/direction labels and an Export action label used by the partner-list Export control that navigates to the sales-export page.

#### Scenario: Sort by name ascending

- **WHEN** an ADMIN selects sort Name ascending (`sort=name&dir=asc`)
- **THEN** the list orders by partner name ascending

#### Scenario: Sort by most events descending

- **WHEN** an ADMIN selects sort Most events descending (`sort=events&dir=desc`)
- **THEN** the list orders by total event count descending

#### Scenario: Sort persists across pagination

- **WHEN** an ADMIN sorts the list and navigates to another page
- **THEN** the `sort` and `dir` parameters are preserved in pagination links

#### Scenario: Sort persists across name filter submit

- **WHEN** an ADMIN has an active sort/direction and submits a name search
- **THEN** the resulting URL retains `sort` and `dir` together with `q`

#### Scenario: Default sort when params omitted

- **WHEN** an ADMIN opens `/:locale/admin/partners` with no `sort` query param
- **THEN** partners are ordered by last created descending (domain default)
