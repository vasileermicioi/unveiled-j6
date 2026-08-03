## ADDED Requirements

### Requirement: Admin partners list domain returns event counts and honors sort

The system SHALL support server-side sorting of the admin partner list in `@unveiled/db` (`listPartners`) and SHALL return, per partner, a count of events (`eventCount`) and a count of active events (`activeEventCount`) as part of the list result, computed from `events` via aggregate, without new schema columns. `PartnerSort` SHALL be `"name" | "created" | "events"` (URL-stable identifiers). `ListPartnersOptions` SHALL accept optional `sort`, `desc`, and `now` (active reference instant). When `sort` is omitted, ordering SHALL remain `created_at` descending then `id` descending. An event SHALL count as **active** when `date_time >= now` and `remaining_capacity > 0`. Name search SHALL remain name-only via the existing partner name filter. `countPartners` SHALL count partner rows matched by that same name filter so pagination totals stay correct. Default page size SHALL remain 25 with offset pagination.

#### Scenario: Partner list sort by name

- **WHEN** an ADMIN requests the partner list with `sort=name` and ascending direction
- **THEN** partners are ordered alphabetically by name ascending

#### Scenario: Partner list sort by last created

- **WHEN** an ADMIN requests the partner list with `sort=created` and descending direction
- **THEN** partners are ordered by `created_at` descending
- **AND** `id` descending is used as the tiebreak

#### Scenario: Partner list sort by most events

- **WHEN** an ADMIN requests the partner list with `sort=events` and descending direction
- **THEN** partners are ordered by their total event count descending
- **AND** `id` descending is used as the tiebreak

#### Scenario: Partner list returns active-event counts

- **WHEN** an ADMIN lists partners
- **THEN** each partner includes `eventCount` (all events for that partner) and `activeEventCount` using the active predicate (`date_time >= now` and `remaining_capacity > 0`)

#### Scenario: Default sort unchanged when sort omitted

- **WHEN** `listPartners` is called without a `sort` option
- **THEN** partners are ordered by `created_at` descending then `id` descending

#### Scenario: Partner count honors the name filter

- **WHEN** an ADMIN filters the partner list by a name query
- **THEN** the count used for pagination matches the number of filtered partner rows
