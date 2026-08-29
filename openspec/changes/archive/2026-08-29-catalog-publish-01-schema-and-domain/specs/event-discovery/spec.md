## ADDED Requirements

### Requirement: Discover lists only published featured rows
Discover (`/:locale/discover`) SHALL load featured events and featured partners with `publishedOnly: true`. A featured event SHALL appear only when both `featured_events.published` and `events.published` are true. A featured partner SHALL appear only when `featured_partners.published` is true. Past featured events that are published SHALL still appear (Discover’s include-past rule is unchanged). Admin featured pages SHALL keep using the unfiltered lists.

#### Scenario: Discover omits unpublished featured
- **WHEN** a guest visits Discover
- **AND** a featured event or featured partner is unpublished (or the featured event’s catalog event is unpublished)
- **THEN** that row does not appear on Discover
- **AND** published featured siblings still appear, including past published featured events

## MODIFIED Requirements

### Requirement: Member feed query contract
The system SHALL list discoverable events for the member feed using Europe/Berlin day boundaries, including an event when **any** of its `date_times` is still upcoming (`>= now`) — equivalently, when the denormalized primary `date_time >= now` after write-time sync — and SHALL include only events with `published = true`. Filters `title`, `category`, `partnerId`, `from`, `to`, and `page` (fixed page size 24) and ordering by denormalized `date_time` then `id` remain as today. The query SHALL return both the page of items and a total count matching the same filters. When `from` and/or `to` are provided, the inclusive Europe/Berlin calendar range SHALL match events that have **at least one** `date_times` element inside that window, SHALL still exclude events with no upcoming occurrence, and the effective range start SHALL NOT be before Berlin today (a requested `from` earlier than today is treated as today). The same published and date gates SHALL apply to `listMemberFeedEvents` and `listMemberFeedMapEvents`.

#### Scenario: Default scope is all upcoming

- **WHEN** `from` and `to` are omitted
- **THEN** only events with at least one upcoming datetime (`date_time >= now` under denormalized sync) are returned
- **AND** results are ordered by next upcoming `date_time` ascending then `id` ascending (soonest first)

#### Scenario: Multi-datetime event with a later upcoming slot remains discoverable

- **WHEN** an event has one past and one future element in `date_times`
- **THEN** it appears in the default upcoming feed
- **AND** it is ordered by its next upcoming instant

#### Scenario: All-past multi-datetime event is excluded

- **WHEN** every element of an event’s `date_times` is in the past relative to `now`
- **THEN** that event does not appear in the member feed result

#### Scenario: Custom date range intersects any occurrence

- **WHEN** `from` and/or `to` are provided
- **THEN** only events with at least one `date_times` element within that inclusive full-day Europe/Berlin range that still have an upcoming occurrence are returned
- **AND** the all-upcoming default no longer applies as the sole window (the range narrows results)

#### Scenario: Date range lower bound is not before Berlin today

- **WHEN** a requested `from` is earlier than the Europe/Berlin calendar date of `now`
- **THEN** the feed behaves as if `from` were Berlin today
- **AND** no fully past events appear

#### Scenario: Filter by title

- **WHEN** a non-empty `title` filter is applied
- **THEN** only events whose title contains the filter string (case-insensitive) are included in items and total

#### Scenario: Filter by category

- **WHEN** a `category` filter is applied
- **THEN** only events matching that category are included in items and total

#### Scenario: Filter by partner

- **WHEN** a `partnerId` filter is applied
- **THEN** only events hosted by that partner are included in items and total

#### Scenario: Past events are excluded

- **WHEN** an event has no start time in the future relative to `now`
- **THEN** that event does not appear in the member feed result, including when a custom date range is applied

#### Scenario: Empty result

- **WHEN** applied filters match no events
- **THEN** the query returns an empty items list and total `0`

#### Scenario: Stable pagination

- **WHEN** the feed is requested with `page` greater than 1
- **THEN** results use `LIMIT 24` and `OFFSET (page - 1) * 24` with `ORDER BY date_time ASC, id ASC`

#### Scenario: Unpublished events are excluded from the member feed
- **WHEN** an upcoming event has `published = false`
- **THEN** it does not appear in `listMemberFeedEvents` or `listMemberFeedMapEvents`
- **AND** a published sibling with the same dates still appears

### Requirement: Saved events persistence
The system SHALL store member bookmarks in a `saved_events` join table keyed by `(user_id, event_id)` with `created_at`, referential integrity to `users` and `events`, and an index on `user_id`. The `@unveiled/db` package SHALL expose idempotent `saveEvent` / `unsaveEvent` helpers plus `isEventSaved` and `listSavedEventIds`. `saveEvent` SHALL reject an unpublished event and SHALL NOT create a `saved_events` row. `unsaveEvent` SHALL remain unchanged (including for unpublished events). Existing save rows SHALL remain if the event is later unpublished.

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

#### Scenario: Save rejects unpublished
- **WHEN** a member saves an unpublished event
- **THEN** no `saved_events` row is created

### Requirement: Saved upcoming list query
The system SHALL list a user's saved events that are still upcoming (any `date_times` element `>= now`, equivalently denormalized `date_time >= now`) and `published = true`, ordered by next upcoming `date_time` then `id`, without applying the today-only default. Existing save rows for an event that is later unpublished SHALL remain in `saved_events` but SHALL be omitted from this list until the event is republished.

#### Scenario: Saved upcoming ignores today default

- **WHEN** a user has saved events on multiple future days
- **THEN** `listSavedUpcomingEvents` returns all still-upcoming saved events, not only those happening today

#### Scenario: Past saved events are omitted

- **WHEN** a saved event has no upcoming datetime relative to `now`
- **THEN** it does not appear in the saved upcoming list

#### Scenario: Saved multi-datetime with later slot remains

- **WHEN** a saved event’s earliest `date_times` element is past but a later element is still upcoming
- **THEN** it appears in the saved upcoming list ordered by its next upcoming instant

#### Scenario: Saved list hides unpublished
- **WHEN** a member has a save row for an event that is now unpublished
- **THEN** `listSavedUpcomingEvents` omits that event
