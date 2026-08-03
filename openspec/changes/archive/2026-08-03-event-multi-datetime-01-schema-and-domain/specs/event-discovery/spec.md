## MODIFIED Requirements

### Requirement: Member feed query contract

The system SHALL list discoverable events for the member feed using Europe/Berlin day boundaries, including an event when **any** of its `date_times` is still upcoming (`>= now`) — equivalently, when the denormalized primary `date_time >= now` after write-time sync — and SHALL support filters `title`, `category`, `partnerId`, `from`, `to`, and `page` (fixed page size 24) with stable ordering by denormalized `date_time` (next upcoming) then `id`, returning both the page of items and a total count matching the same filters. When `from` and/or `to` are provided, the inclusive Europe/Berlin calendar range SHALL match events that have **at least one** `date_times` element inside that window, SHALL still exclude events with no upcoming occurrence, and the effective range start SHALL NOT be before Berlin today (a requested `from` earlier than today is treated as today).

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

### Requirement: Saved upcoming list query

The system SHALL list a user's saved events that are still upcoming (any `date_times` element `>= now`, equivalently denormalized `date_time >= now`), ordered by next upcoming `date_time` then `id`, without applying the today-only default.

#### Scenario: Saved upcoming ignores today default

- **WHEN** a user has saved events on multiple future days
- **THEN** `listSavedUpcomingEvents` returns all still-upcoming saved events, not only those happening today

#### Scenario: Past saved events are omitted

- **WHEN** a saved event has no upcoming datetime relative to `now`
- **THEN** it does not appear in the saved upcoming list

#### Scenario: Saved multi-datetime with later slot remains

- **WHEN** a saved event’s earliest `date_times` element is past but a later element is still upcoming
- **THEN** it appears in the saved upcoming list ordered by its next upcoming instant
