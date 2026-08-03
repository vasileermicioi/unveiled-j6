## ADDED Requirements

### Requirement: Admin partner list Name filter and active-events column

The admin partner list (`/:locale/admin/partners`) SHALL label its search filter **Name** (DE: **Name**), consistent with the table's Name column, and SHALL display an **Active events** column per partner using the `activeEventCount` from the list domain. The shared admin search placeholder used by the events list ("Search title or partner" / "Titel oder Partner suchen") SHALL NOT be used on the partner list. `AdminSearchForm` SHALL accept an optional placeholder/label override so only the partner call site changes.

#### Scenario: Partner search filter is labeled Name

- **WHEN** an ADMIN opens the partner list
- **THEN** the search field placeholder/label reads **Name**
- **AND** it does not read "Search title or partner" or "Titel oder Partner suchen"

#### Scenario: Partner list shows active events

- **WHEN** an ADMIN views the partner list with at least one partner row
- **THEN** each partner row shows an **Active events** count from `activeEventCount`

#### Scenario: Events list search placeholder unchanged

- **WHEN** an ADMIN opens the events list
- **THEN** the search field still uses the existing title-or-partner placeholder copy

### Requirement: Admin partner list sort controls

The admin partner list SHALL offer server-driven sorting by Name, Last created, and Most events, each in ascending or descending order, selected via query params `sort` (`name` | `created` | `events`) and `dir` (`asc` | `desc`) and preserved across pagination and filtering. When `sort` is omitted, the list SHALL keep the domain default (last-created descending). Sort and direction controls SHALL be native HTML controls or plain navigational links (not HeroUI `Select`). Page size SHALL remain 25 with offset pagination. Localized admin copy SHALL include sort/direction labels and an Export action label string for the subsequent sales-export step (the Export destination route MAY ship later).

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
