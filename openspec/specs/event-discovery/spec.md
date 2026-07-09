# Event Discovery

Phase 5 member discovery: saved-events persistence and member feed / saved-upcoming query contracts in `@unveiled/db`, plus the authenticated SSR `/:locale/events` feed UI.

## Requirements

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

### Requirement: Authenticated events feed page

The system SHALL serve `/:locale/events` as a fully server-rendered page for signed-in members, driven by GET query parameters `category`, `partnerId`, `from`, `to`, and `page`, with no client-side filter store required to reproduce the view. Guests SHALL be redirected to sign in. The page SHALL render a GET filter form, pagination that preserves active query params with a "Showing X–Y of Z" summary, an empty/no-results state when filters match nothing, and a subscription-gate banner when the member's subscription is not `ACTIVE`. The feed page SHALL be served with `noindex` robots metadata.

#### Scenario: Guest is redirected

- **WHEN** an unauthenticated user requests `/events`
- **THEN** they are redirected to sign in with a return URL that can restore the feed after login

#### Scenario: Default feed shows today's events only

- **WHEN** a signed-in USER views `/events` with no date filters
- **THEN** only events happening today (Europe/Berlin) that have not already started are shown

#### Scenario: Filters and reset

- **WHEN** the member applies category, partner, or date-range filters via the GET form
- **THEN** the feed shows only matching events
- **AND WHEN** they reset filters
- **THEN** the feed returns to the default today scope

#### Scenario: No results

- **WHEN** applied filters match no events
- **THEN** the page shows an empty/no-results state

#### Scenario: Pagination preserves filters

- **WHEN** the member navigates to another page of results while filters are active
- **THEN** pagination links preserve `category`, `partnerId`, `from`, and `to`
- **AND** the page shows a "Showing X–Y of Z" summary for the current page

#### Scenario: Inactive subscription banner

- **WHEN** a signed-in member whose subscription is not `ACTIVE` views `/events`
- **THEN** the page shows a subscription-gate banner

#### Scenario: Feed is not indexed

- **WHEN** a crawler or browser loads `/events`
- **THEN** the response includes robots metadata instructing not to index the page

### Requirement: EventCard CTA precedence on the feed

The system SHALL render EventCard primary CTAs on the authenticated feed with guest-state checked first (unreachable for guests on this page), then sold-out → Waitlist label, then inactive subscription → Unlock event, then ACTIVE → Book Now — without implementing booking or waitlist POST handlers in this change. Bookmark controls SHALL remain non-functional (disabled or without a save handler) until the saved-events step.

#### Scenario: Inactive member unlock CTA

- **WHEN** a signed-in member with inactive subscription views a bookable event on the feed
- **THEN** the EventCard primary CTA uses the Unlock event label and links toward membership

#### Scenario: Active member book CTA without booking POST

- **WHEN** a signed-in member with an ACTIVE subscription views a bookable event on the feed
- **THEN** the EventCard primary CTA uses the Book Now label
- **AND** activating it does not submit a booking POST (links to event detail or membership messaging only)

#### Scenario: Sold-out waitlist label without waitlist POST

- **WHEN** a signed-in member views a sold-out event on the feed
- **THEN** the EventCard primary CTA uses the Waitlist label
- **AND** activating it does not submit a waitlist join POST

#### Scenario: Bookmark not persisted from feed

- **WHEN** a signed-in member views EventCards on the feed in this change
- **THEN** the bookmark control does not persist a save or unsave
