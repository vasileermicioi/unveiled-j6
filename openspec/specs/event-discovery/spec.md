# Event Discovery

Phase 5 member discovery: saved-events persistence and member feed / saved-upcoming query contracts in `@unveiled/db`, the authenticated SSR `/:locale/events` feed UI, SSR save/unsave mutations, `/:locale/saved`, the USER navbar Saved affordance, and the consent-gated MapLibre + OSM map at `/:locale/events/map`.

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

The system SHALL render EventCard primary CTAs on the authenticated feed with guest-state checked first (unreachable for guests on this page), then sold-out → Waitlist label, then inactive subscription → Unlock event, then ACTIVE → Book Now — without implementing booking or waitlist POST handlers in this change. Bookmark controls on the feed SHALL persist save and unsave via SSR form POST and SHALL reflect whether each event is already saved for the current member.

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

#### Scenario: Bookmark persists from feed

- **WHEN** a signed-in member toggles the bookmark control on a feed EventCard
- **THEN** the save or unsave is persisted for that member

### Requirement: Save and unsave via SSR POST

The system SHALL add or remove a `saved_events` row for the authenticated user via form POST (no client-only mutation modal), deriving the user id from the session only. Unauthenticated save attempts SHALL redirect to sign in with a return URL. After a successful save or unsave, the system SHALL redirect to a same-origin return path (explicit `returnTo` or safe Referer fallback).

#### Scenario: Save and unsave an event

- **WHEN** a signed-in user toggles save on an event via form POST
- **THEN** the event is added to or removed from their saved events list accordingly
- **AND** the response redirects back to a same-origin member page

#### Scenario: Saving requires authentication

- **WHEN** a guest tries to save an event via form POST
- **THEN** they are redirected to sign in with a return URL

#### Scenario: User id is not client-supplied

- **WHEN** a signed-in user submits a save or unsave form
- **THEN** the system uses the session user id and ignores any client-supplied user id field

### Requirement: Saved events page

The system SHALL serve `/:locale/saved` as a fully server-rendered page for signed-in members, listing that user's saved events that are still upcoming via `listSavedUpcomingEvents`, without applying the today-only feed default. Guests SHALL be redirected to sign in. The page SHALL show an empty state when there are no upcoming saved events, render EventCards with saved state and a working unsave form, and SHALL be served with `noindex` robots metadata.

#### Scenario: Saved events view

- **WHEN** a USER with one or more upcoming saved events views My Saved Events
- **THEN** those upcoming saved events are shown
- **AND** the view is not restricted to today only

#### Scenario: Saved empty state

- **WHEN** a signed-in USER with no upcoming saved events views `/saved`
- **THEN** the page shows an empty state

#### Scenario: Guest cannot open saved page

- **WHEN** an unauthenticated user requests `/saved`
- **THEN** they are redirected to sign in with a return URL that can restore `/saved` after login

#### Scenario: Unsave from saved page

- **WHEN** a signed-in user unsaves an event from `/saved`
- **THEN** the corresponding saved row is removed
- **AND** the event no longer appears on the saved list after redirect

#### Scenario: Saved page is not indexed

- **WHEN** a crawler or browser loads `/saved`
- **THEN** the response includes robots metadata instructing not to index the page

### Requirement: Feed reflects saved state and persists bookmarks

The system SHALL load the current member's saved event ids on `/:locale/events` and pass per-card saved state into EventCards. Bookmark controls on the feed SHALL submit SSR save or unsave forms (not a disabled no-op) and SHALL expose a locale-correct `aria-label` for save and saved states (`saveThis` / `savedThis` semantics).

#### Scenario: Feed shows saved bookmark state

- **WHEN** a signed-in member views the events feed and has previously saved an event shown on the page
- **THEN** that EventCard renders in the saved bookmark state

#### Scenario: Bookmark persists from feed

- **WHEN** a signed-in member submits save or unsave from an EventCard on the feed
- **THEN** the corresponding `saved_events` row is created or deleted
- **AND** after redirect the feed reflects the updated saved state

#### Scenario: Bookmark aria-label

- **WHEN** a member views an EventCard bookmark control in either locale
- **THEN** the control exposes an `aria-label` matching the save or saved copy for that locale

### Requirement: Navbar Saved affordance

The system SHALL show signed-in USER navigation a Saved link (`mySaves`: Gemerkt/Saved) to `/:locale/saved`, with a numeric badge when the user's saved-event count is greater than zero. The count SHALL be derived from live saved-events data for that user (not a client-supplied value).

#### Scenario: Saved nav with badge

- **WHEN** a signed-in USER has one or more saved events
- **THEN** the navbar includes a Saved link to `/saved`
- **AND** a badge shows the saved count

#### Scenario: Saved nav without badge when empty

- **WHEN** a signed-in USER has zero saved events
- **THEN** the navbar still includes a Saved link to `/saved`
- **AND** no numeric badge is shown

### Requirement: Filtered map view

The system SHALL provide an authenticated map view at `/:locale/events/map` using MapLibre GL JS and OpenStreetMap tiles (no map API key) that shows markers only for events matching the current feed filters (`category`, `partnerId`, `from`, `to` — same semantics as `listMemberFeedEvents`, including the today default when dates are omitted) and having non-null coordinates. The map SHALL load the full filtered set without feed page slicing, subject to a documented upper bound. Marker previews SHALL link to the public event detail page (`/:locale/events/:id`); booking POST from the popup is out of scope. Guests SHALL be redirected to sign in. The page SHALL be served with `noindex` robots metadata. Required OpenStreetMap attribution SHALL be visible when the map loads. Events missing `lat`/`lng` SHALL be omitted from markers (coordinates MUST NOT be invented).

#### Scenario: Map view mirrors the filtered feed

- **WHEN** a member has applied filters to the events feed and opens the map view
- **THEN** the map shows markers only for the currently filtered events that have coordinates
- **AND** selecting a marker opens a preview with a link to the event detail page

#### Scenario: Guest is redirected from map

- **WHEN** an unauthenticated user requests `/events/map`
- **THEN** they are redirected to sign in with a return URL that can restore the map (including filter query) after login

#### Scenario: Map ignores feed pagination

- **WHEN** a member opens `/events/map` with the same filters as a multi-page feed
- **THEN** markers reflect the full filtered set (up to the documented cap), not only the current feed page

#### Scenario: Events without coordinates are omitted

- **WHEN** a filtered event has no `lat` or `lng`
- **THEN** that event does not appear as a map marker

#### Scenario: Map is not indexed

- **WHEN** a crawler or browser loads `/events/map`
- **THEN** the response includes robots metadata instructing not to index the page

#### Scenario: OSM attribution is visible

- **WHEN** the map has loaded with consent accepted
- **THEN** OpenStreetMap attribution is visible on the page

### Requirement: Map respects cookie consent

The system SHALL NOT load MapLibre GL JS or third-party OpenStreetMap tile requests when the user has declined non-essential cookies (or has no accepted consent decision). In that case it SHALL show a static fallback (address list and/or consent prompt) instead of the interactive map.

#### Scenario: Declining consent disables the map embed

- **WHEN** the user has declined non-essential cookies and views a page that would show the event map
- **THEN** the map embed is not loaded and a fallback is shown
- **AND** no OpenStreetMap tile requests are made

### Requirement: List and map navigation preserves filters

The system SHALL provide navigation between `/:locale/events` and `/:locale/events/map` that preserves the active filter query parameters (`category`, `partnerId`, `from`, `to`). Feed `page` MAY be omitted on the map link.

#### Scenario: Feed to map preserves filters

- **WHEN** a member on `/events` with active filters opens the map view link
- **THEN** `/events/map` is requested with the same filter query params

#### Scenario: Map to feed preserves filters

- **WHEN** a member on `/events/map` with active filters opens the list view link
- **THEN** `/events` is requested with the same filter query params
