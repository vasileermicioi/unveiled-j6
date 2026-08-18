## MODIFIED Requirements

### Requirement: Featured events curation store

The system SHALL persist an admin-curated featured event list in a dedicated `featured_events` table keyed by existing `events.id`, without duplicating event payload columns. Each row SHALL store `event_id` (PK, FK → `events.id` ON DELETE CASCADE), `sort_order` (integer, not null), and `created_at` (timestamptz, not null, default now). The `@unveiled/db` catalog domain SHALL expose helpers to list featured events (optional upcoming-only filter using UTC `now` against `events.date_time`), list featured event ids, search catalog events excluding already-featured rows (title/partner search consistent with `listEvents`), add a featured row with append `sort_order` (reject missing or already-featured events), remove one or many featured rows without deleting the underlying `events` rows, and reorder the current featured set.

Reorder SHALL accept an ordered list of event ids that is a permutation of the current featured membership (same ids, same length, no duplicates). The domain SHALL persist `sort_order` as `0..n-1` in that order. A list that is missing, extra, or duplicated relative to the current set SHALL fail with a catalog validation error and SHALL NOT leave a partial order. Removing from featured SHALL delete only `featured_events` rows.

#### Scenario: Featured row references catalog event

- **WHEN** an event is added to the featured list
- **THEN** a `featured_events` row is stored for that `event_id` with a `sort_order`
- **AND** the underlying `events` row remains unchanged

#### Scenario: Remove from featured does not delete event

- **WHEN** one or more events are removed from the featured list
- **THEN** only those `featured_events` rows are deleted
- **AND** the `events` rows still exist

#### Scenario: Reorder featured events

- **WHEN** `reorderFeaturedEvents` is called with a permutation of the current featured event ids
- **THEN** `listFeaturedEvents` returns those events in the submitted order with `sort_order` `0..n-1`

#### Scenario: Invalid featured events reorder rejected

- **WHEN** `reorderFeaturedEvents` is called with a list that is not a permutation of the current featured set
- **THEN** the operation fails with a catalog validation error
- **AND** existing `sort_order` values are unchanged

#### Scenario: Deleting an event clears featured membership

- **WHEN** a catalog event is deleted
- **THEN** any `featured_events` row for that event is removed via FK cascade

#### Scenario: Duplicate feature rejected

- **WHEN** `addFeaturedEvent` is called for an `event_id` that is already featured
- **THEN** the operation fails without inserting a second row

#### Scenario: Upcoming filter on featured list

- **WHEN** `listFeaturedEvents` is called with upcoming-only enabled and a fixed `now`
- **THEN** only featured events with `date_time >= now` are returned
- **AND** results are ordered by `sort_order` then `date_time`
