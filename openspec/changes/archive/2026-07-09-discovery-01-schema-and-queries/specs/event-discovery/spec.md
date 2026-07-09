## ADDED Requirements

### Requirement: Saved events persistence

The system SHALL store member bookmarks in a `saved_events` join table keyed by `(user_id, event_id)` with `created_at`, referential integrity to `users` and `events`, and an index on `user_id`. The `@unveiled/db` package SHALL expose idempotent `saveEvent` / `unsaveEvent` helpers plus `isEventSaved` and `listSavedEventIds`.

#### Scenario: Migration creates saved_events

- **WHEN** `bun run db:migrate` runs against a database with Phase 4 catalog tables
- **THEN** `saved_events` exists with composite primary key `(user_id, event_id)`, foreign keys to `users` and `events`, and an index on `user_id`

#### Scenario: Save is idempotent

- **WHEN** a signed-in user saves an event that is already saved
- **THEN** the system keeps a single row and does not error

#### Scenario: Unsave removes the row

- **WHEN** a signed-in user unsaves an event
- **THEN** the corresponding `saved_events` row is deleted

#### Scenario: Unsave is idempotent when absent

- **WHEN** a user unsaves an event that is not saved
- **THEN** the operation completes without error and no row exists

### Requirement: Member feed query contract

The system SHALL list discoverable events for the member feed using Europe/Berlin day boundaries, excluding events whose start time is in the past, and SHALL support filters `category`, `partnerId`, `from`, `to`, and `page` (fixed page size 24) with stable ordering by `date_time` then `id`, returning both the page of items and a total count matching the same filters.

#### Scenario: Default scope is today

- **WHEN** `from` and `to` are omitted
- **THEN** only events happening today (Europe/Berlin) that have not already started are returned

#### Scenario: Custom date range overrides today

- **WHEN** `from` and/or `to` are provided
- **THEN** only events within that inclusive full-day Europe/Berlin range are returned and the today-only default does not apply

#### Scenario: Filter by category

- **WHEN** a `category` filter is applied
- **THEN** only events matching that category are included in items and total

#### Scenario: Filter by partner

- **WHEN** a `partnerId` filter is applied
- **THEN** only events hosted by that partner are included in items and total

#### Scenario: Past events are excluded

- **WHEN** an event has a start time in the past relative to `now`
- **THEN** that event does not appear in the member feed result

#### Scenario: Empty result

- **WHEN** applied filters match no events
- **THEN** the query returns an empty items list and total `0`

#### Scenario: Stable pagination

- **WHEN** the feed is requested with `page` greater than 1
- **THEN** results use `LIMIT 24` and `OFFSET (page - 1) * 24` with `ORDER BY date_time ASC, id ASC`

### Requirement: Saved upcoming list query

The system SHALL list a user's saved events that are still upcoming (`date_time >= now`), ordered by `date_time` then `id`, without applying the today-only default.

#### Scenario: Saved upcoming ignores today default

- **WHEN** a user has saved events on multiple future days
- **THEN** `listSavedUpcomingEvents` returns all still-upcoming saved events, not only those happening today

#### Scenario: Past saved events are omitted

- **WHEN** a saved event's start time is in the past
- **THEN** it does not appear in the saved upcoming list
