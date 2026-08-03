## MODIFIED Requirements

### Requirement: Member feed query contract

The system SHALL list discoverable events for the member feed using Europe/Berlin day boundaries, excluding events whose start time is in the past (`date_time >= now`), and SHALL support filters `title`, `category`, `partnerId`, `from`, `to`, and `page` (fixed page size 24) with stable ordering by `date_time` then `id`, returning both the page of items and a total count matching the same filters. When `from` and/or `to` are provided, the inclusive Europe/Berlin calendar range SHALL still exclude already-started events, and the effective range start SHALL NOT be before Berlin today (a requested `from` earlier than today is treated as today).

#### Scenario: Default scope is all upcoming

- **WHEN** `from` and `to` are omitted
- **THEN** only events with `date_time >= now` are returned
- **AND** results are ordered by `date_time` ascending then `id` ascending (soonest first)

#### Scenario: Custom date range intersects upcoming

- **WHEN** `from` and/or `to` are provided
- **THEN** only events within that inclusive full-day Europe/Berlin range that have not already started are returned
- **AND** the all-upcoming default no longer applies as the sole window (the range narrows results)

#### Scenario: Date range lower bound is not before Berlin today

- **WHEN** a requested `from` is earlier than the Europe/Berlin calendar date of `now`
- **THEN** the feed behaves as if `from` were Berlin today
- **AND** no past events appear

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

- **WHEN** an event has a start time in the past relative to `now`
- **THEN** that event does not appear in the member feed result, including when a custom date range is applied

#### Scenario: Empty result

- **WHEN** applied filters match no events
- **THEN** the query returns an empty items list and total `0`

#### Scenario: Stable pagination

- **WHEN** the feed is requested with `page` greater than 1
- **THEN** results use `LIMIT 24` and `OFFSET (page - 1) * 24` with `ORDER BY date_time ASC, id ASC`

## ADDED Requirements

### Requirement: Event feed URL query includes title

`parseEventFeedQuery`, `buildEventFeedQueryString`, and `eventFeedPageRedirectPath` SHALL support an optional `title` query parameter (trimmed; empty omitted). Member feed and map routes SHALL pass parsed `title` into the discovery list helpers so a `title` URL param affects results without requiring filter UI chrome.

#### Scenario: Parse and build title

- **WHEN** the events URL includes a non-empty `title` search param
- **THEN** `parseEventFeedQuery` returns that trimmed value
- **AND** `buildEventFeedQueryString` / page redirect helpers preserve `title` alongside other filters

#### Scenario: Empty title is omitted

- **WHEN** `title` is missing or whitespace-only
- **THEN** the parsed query omits `title` and the built query string does not include a `title` param
