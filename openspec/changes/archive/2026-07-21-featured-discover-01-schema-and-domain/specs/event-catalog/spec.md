## ADDED Requirements

### Requirement: Featured events curation store

The system SHALL persist an admin-curated featured event list in a dedicated `featured_events` table keyed by existing `events.id`, without duplicating event payload columns. Each row SHALL store `event_id` (PK, FK → `events.id` ON DELETE CASCADE), `sort_order` (integer, not null), and `created_at` (timestamptz, not null, default now). The `@unveiled/db` catalog domain SHALL expose helpers to list featured events (optional upcoming-only filter using UTC `now` against `events.date_time`), list featured event ids, search catalog events excluding already-featured rows (title/partner search consistent with `listEvents`), add a featured row with append `sort_order` (reject missing or already-featured events), and remove a featured row without deleting the underlying `events` row.

#### Scenario: Featured row references catalog event

- **WHEN** an event is added to the featured list
- **THEN** a `featured_events` row is stored for that `event_id` with a `sort_order`
- **AND** the underlying `events` row remains unchanged

#### Scenario: Remove from featured does not delete event

- **WHEN** an event is removed from the featured list
- **THEN** only the `featured_events` row is deleted
- **AND** the `events` row still exists

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
