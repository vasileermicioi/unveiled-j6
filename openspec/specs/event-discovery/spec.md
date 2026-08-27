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

### Requirement: Event feed URL query includes title

`parseEventFeedQuery`, `buildEventFeedQueryString`, and `eventFeedPageRedirectPath` SHALL support an optional `title` query parameter (trimmed; empty omitted). Member feed and map routes SHALL pass parsed `title` into the discovery list helpers. The Browse events filter UI SHALL expose a control that submits `title` via GET so members can set the param without hand-editing the URL.

#### Scenario: Parse and build title

- **WHEN** the events URL includes a non-empty `title` search param
- **THEN** `parseEventFeedQuery` returns that trimmed value
- **AND** `buildEventFeedQueryString` / page redirect helpers preserve `title` alongside other filters

#### Scenario: Empty title is omitted

- **WHEN** `title` is missing or whitespace-only
- **THEN** the parsed query omits `title` and the built query string does not include a `title` param

#### Scenario: Filter form submits title

- **WHEN** a booking-eligible member enters an event name in the feed filters and applies
- **THEN** the resulting URL includes a `title` query param
- **AND** the feed shows only matching events

### Requirement: Filter by category

The member feed and map category filter SHALL use `EVENT_CATEGORIES` keys as option values and locale labels as visible text, in the taxonomy table order. Filtering SHALL match `events.category` to the key. Legacy query values from member `INTERESTS` (`Theater`, `Kino`, `Museum`, `Ausstellung`, `Konzert`, `Talk/Lesung`, `Comedy`, `Tanz/Performance`, `Other`) SHALL be rewritten to the mapped keys from the parent guide so old URLs keep working. Unknown category query values SHALL be left unchanged and SHALL still filter by exact match (matching nothing when no row stores that string). Allowlisted keys in the query SHALL pass through unchanged.

The Browse events category `<select>` SHALL list the event-category taxonomy labels for the active locale and SHALL NOT list member onboarding interests (`Other`, `Talk/Lesung`, …) unless those strings also exist as taxonomy labels (they do not, except coincidental overlaps such as Theater / Kino / Museum). Product Gherkin SHALL keep the scenario titled `Filter by category` and SHALL include `Category filter lists venue types`. Playwright in `e2e/specs/event-discovery.spec.ts` SHALL use those titles verbatim (`test("Scenario: …")`). Playwright SHALL select the category control by locale label (`getByLabel` for Kategorie/Category) and pick a visible option by locale label (e.g. Ausstellungshalle / Exhibition hall, or Kino / Cinema). Playwright SHALL use proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); the system SHALL NOT add `data-testid` for these scenarios. Coverage-matrix rows SHALL map the Gherkin titles to Playwright (`pass` when `DATABASE_URL` is set, or a named env skip — never “UI not built”).

#### Scenario: Filter by category

- **WHEN** I select a category filter
- **THEN** only events matching that category key are shown
- **AND** the visible options are venue-category labels (e.g. Kino / Cinema), not onboarding interest chips

#### Scenario: Category filter lists venue types

- **WHEN** a booking-eligible member opens the Browse events category `<select>`
- **THEN** the options include taxonomy locale labels (e.g. Kino / Cinema, Ausstellungshalle / Exhibition hall)
- **AND** the options do not include onboarding-only interest ids (`Other`, `Talk/Lesung`, `Tanz/Performance`, exact `Ausstellung`, exact `Konzert`)

#### Scenario: Legacy category query still filters

- **WHEN** the feed URL is `?category=Theater`
- **THEN** the parsed filter is `theater`
- **AND** events stored as `theater` are shown

#### Scenario: Legacy Kino query maps to cinema

- **WHEN** the feed or map URL is `?category=Kino`
- **THEN** the parsed filter is `cinema`
- **AND** events stored as `cinema` are shown

#### Scenario: Unknown category query matches nothing

- **WHEN** the feed URL is `?category=NotARealCategory`
- **THEN** the parsed filter is `NotARealCategory`
- **AND** no events are shown unless a row stores that exact string

#### Scenario: Category options use keys and locale labels in table order

- **WHEN** a booking-eligible member opens the feed or map filter
- **THEN** each category option value is an `EVENT_CATEGORIES` key
- **AND** the visible option text is that key’s label for the active locale
- **AND** option order matches the parent taxonomy table (not alphabetical, not onboarding `INTERESTS` order)

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

### Requirement: Authenticated events feed page

The system SHALL serve `/:locale/events` as a fully server-rendered page for signed-in `USER` members with a booking-eligible subscription (`ACTIVE` or `CANCELLED_PENDING`), driven by GET query parameters `title`, `category`, `partnerId`, `from`, `to`, and `page`, with no client-side filter store required to reproduce the view. Guests SHALL be redirected to sign in. Signed-in `USER` members without a booking-eligible subscription SHALL be redirected to `/:locale/discover` and SHALL NOT receive the full feed (subscription-banner-while-listing is not the primary gate). The page SHALL render a GET filter form (including event name, category, partner, and date range), pagination that preserves active query params with a "Showing X–Y of Z" summary, and an empty/no-results state when filters match nothing. The feed page SHALL be served with `noindex` robots metadata. Date inputs on the filter form SHALL set `min` to the Europe/Berlin calendar date of request time (YYYY-MM-DD); server-side clamp remains authoritative.

#### Scenario: Guest is redirected

- **WHEN** an unauthenticated user requests `/events`
- **THEN** they are redirected to sign in with a return URL that can restore the feed after login

#### Scenario: Non-active member is redirected to Discover

- **WHEN** a signed-in USER whose subscription is not booking-eligible requests `/events`
- **THEN** they are redirected to `/:locale/discover`

#### Scenario: Default feed shows all upcoming events

- **WHEN** a booking-eligible USER views `/events` with no date filters
- **THEN** only events with start time in the future (`date_time >= now`) are shown
- **AND** events are ordered soonest first

#### Scenario: Filters and reset

- **WHEN** the member applies event name, category, partner, or date-range filters via the GET form
- **THEN** the feed shows only matching events
- **AND WHEN** they reset filters
- **THEN** the feed returns to the default all-upcoming scope with title, category, partner, and date params cleared

#### Scenario: No results

- **WHEN** applied filters match no events
- **THEN** the page shows an empty/no-results state

#### Scenario: Pagination preserves filters

- **WHEN** the member navigates to another page of results while filters are active
- **THEN** pagination links preserve `title`, `category`, `partnerId`, `from`, and `to`
- **AND** the page shows a "Showing X–Y of Z" summary for the current page

#### Scenario: Feed is not indexed

- **WHEN** a crawler or browser loads `/events`
- **THEN** the response includes robots metadata instructing not to index the page

#### Scenario: Date inputs advertise Berlin today as minimum

- **WHEN** a booking-eligible member views the events feed filter form
- **THEN** the `from` and `to` date controls expose `min` equal to Europe/Berlin today (YYYY-MM-DD)

### Requirement: Event name control on Browse events

The Browse events filter form on `/:locale/events` and `/:locale/events/map` SHALL include an event name text field submitted as `title` via GET, alongside partner and date range controls (category remains).

#### Scenario: Event name filter control

- **GIVEN** a booking-eligible member is viewing the events feed filters
- **WHEN** they view the filter form
- **THEN** they see an event name field alongside partner and date range controls

### Requirement: EventCard CTA precedence on the feed

The system SHALL render EventCard primary CTAs on the authenticated feed with sold-out → Waitlist label, otherwise Book Now — for both ACTIVE and inactive subscriptions — without implementing booking or waitlist POST handlers on the card. The primary CTA href SHALL always be the public event detail route `/:locale/events/:id` and SHALL NOT target `/membership` or `/events/:id/book`. Bookmark controls on the feed SHALL persist save and unsave via SSR form POST and SHALL reflect whether each event is already saved for the current member.

#### Scenario: Inactive member Book Now opens detail

- **WHEN** a signed-in member with inactive subscription views a bookable event on the feed
- **THEN** the EventCard primary CTA uses the Book Now label
- **AND** following the CTA opens `/:locale/events/:id` (not `/membership`)

#### Scenario: Active member book CTA without booking POST

- **WHEN** a signed-in member with an ACTIVE subscription views a bookable event on the feed
- **THEN** the EventCard primary CTA uses the Book Now label
- **AND** activating it does not submit a booking POST (links to event detail only)

#### Scenario: Sold-out waitlist label without waitlist POST

- **WHEN** a signed-in member views a sold-out event on the feed
- **THEN** the EventCard primary CTA uses the Waitlist label
- **AND** activating it does not submit a waitlist join POST
- **AND** following the CTA opens `/:locale/events/:id`

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

The system SHALL provide an authenticated map view at `/:locale/events/map` using MapLibre GL JS and OpenStreetMap tiles (no map API key) that shows markers only for events matching the current feed filters (`title`, `category`, `partnerId`, `from`, `to` — same semantics as `listMemberFeedEvents`, including all-upcoming default when dates are omitted and future-only / Berlin today floor when a range is applied) and having non-null coordinates. The map SHALL load the full filtered set without feed page slicing, subject to a documented upper bound. Marker previews SHALL link to the public event detail page (`/:locale/events/:id`); booking POST from the popup is out of scope. Guests SHALL be redirected to sign in. The page SHALL be served with `noindex` robots metadata. Required OpenStreetMap attribution SHALL be visible when the map loads. Events missing `lat`/`lng` SHALL be omitted from markers (coordinates MUST NOT be invented). The map page SHALL render the same GET filter form contract as the list (including event name and date `min`).

#### Scenario: Map view mirrors the filtered feed

- **WHEN** a member has applied filters (including event name when set) to the events feed and opens the map view
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

### Requirement: Map markers use a recognizable pin

MapLibre event markers (member map and public event detail LOCATION map) SHALL render a recognizable location-pin icon using brand colors (dark fill / yellow accent), not a plain black rectangle or square. The pin tip SHALL mark the event’s lat/lng. Required OpenStreetMap attribution and cookie-consent gating remain unchanged.

#### Scenario: Detail map shows a pin icon

- **WHEN** a user views an event detail LOCATION map with valid coordinates and accepted cookie consent
- **THEN** the marker appears as a pin icon (not a solid black square)

#### Scenario: Member map uses the same pin treatment

- **WHEN** a signed-in member opens `/:locale/events/map` with matching filtered events that have coordinates
- **THEN** markers use the same pin icon treatment as the detail map

### Requirement: Map popup dismiss control

Event map popups SHALL provide a close control with a sufficiently large hit target for pointer and touch use (approximately 44×44 CSS pixels minimum, or an equivalent padded control). The control SHALL remain keyboard-accessible and SHALL NOT regress popup focus behavior (`focusAfterOpen` stays off; focus-visible ring on the close control remains). Activating the control SHALL dismiss the popup. Product docs (`event-discovery.feature` and/or `ui-component-map.md` map notes) SHALL mention the large close control. Playwright MAY assert close visibility/activation via proximity or stable MapLibre class selectors when a popup is already openable after consent — MUST NOT use pixel OCR.

#### Scenario: Map popup close is easy to activate

- **WHEN** a user opens an event popup on the map (member map or detail LOCATION map) with cookie consent accepted
- **THEN** a close control is visible with a large enough hit target to activate reliably
- **AND** activating it dismisses the popup

#### Scenario: Map popup close stays keyboard-accessible

- **WHEN** a keyboard user focuses the map popup close control
- **THEN** a focus-visible affordance is present
- **AND** activating the control (or Esc, where MapLibre supports it) dismisses the popup

#### Scenario: Docs and e2e mention map close without tile OCR

- **WHEN** an agent updates product discovery docs or Playwright for map popups
- **THEN** the large close hit target is documented
- **AND** e2e prefers DOM/CSS or role proximity on `.maplibregl-popup-close-button` (or equivalent), skipping when the consent gate blocks the map in CI

### Requirement: Map respects cookie consent

The system SHALL NOT load MapLibre GL JS or third-party OpenStreetMap tile requests when the user has declined non-essential cookies (or has no accepted consent decision). In that case it SHALL show a static fallback (address list and/or consent prompt) instead of the interactive map.

#### Scenario: Declining consent disables the map embed

- **WHEN** the user has declined non-essential cookies and views a page that would show the event map
- **THEN** the map embed is not loaded and a fallback is shown
- **AND** no OpenStreetMap tile requests are made

### Requirement: List and map navigation preserves filters

The system SHALL provide navigation between `/:locale/events` and `/:locale/events/map` that preserves the active filter query parameters (`title`, `category`, `partnerId`, `from`, `to`). Feed `page` MAY be omitted on the map link.

#### Scenario: Feed to map preserves filters

- **WHEN** a member on `/events` with active filters opens the map view link
- **THEN** `/events/map` is requested with the same filter query params

#### Scenario: Map to feed preserves filters

- **WHEN** a member on `/events/map` with active filters opens the list view link
- **THEN** `/events` is requested with the same filter query params

### Requirement: Discover shows curated featured events

The system SHALL render Discover (`/:locale/discover`) using admin-featured events (`listFeaturedEvents` without an upcoming-only filter), not an automatic slice of the full catalog. Featured events whose `date_time` is in the past SHALL still appear on Discover; Discover has no date-period filter. Guests and signed-in `USER` accounts without a booking-eligible subscription (`ACTIVE` or `CANCELLED_PENDING`) MAY view Discover without authentication. When a signed-in `USER` with a booking-eligible subscription requests Discover, the system SHALL redirect them with `302` to `/:locale/events`. `ADMIN` viewers SHALL retain access to Discover (no redirect to the member feed). Public event detail (`/:locale/events/:id`) remains ungated.

#### Scenario: Public discovery preview for guests

- **WHEN** a guest visits Discover
- **THEN** they see the curated featured events (no auth required), including featured events that are already past
- **AND** they do not see the full member `/events` feed

#### Scenario: Past featured event remains on Discover

- **WHEN** an admin-featured event has a `date_time` in the past
- **AND** a guest visits Discover
- **THEN** that featured event still appears on Discover

#### Scenario: Discover is for non-active membership audiences

- **WHEN** a signed-in USER without a booking-eligible subscription visits Discover
- **THEN** the featured Discover page is shown
- **WHEN** a signed-in USER with a booking-eligible subscription visits Discover
- **THEN** they are redirected to `/:locale/events`

#### Scenario: Admin can open Discover for QA

- **WHEN** an ADMIN requests `/:locale/discover`
- **THEN** Discover is rendered (or otherwise remains reachable)
- **AND** they are not redirected to `/:locale/events`

### Requirement: Discover Partner venues uses featured partners

Discover (`/:locale/discover`) SHALL render the Partner venues logo marquee from admin-curated `featured_partners` (ordered by `sort_order`, display up to 8), not from an automatic slice of all partners. When the curated list is empty, the Partner venues section SHALL be omitted. Featured events behavior on Discover is unchanged.

#### Scenario: Guest sees curated partner venues

- **GIVEN** at least one partner is admin-featured and at least one other partner is not
- **WHEN** a guest visits Discover
- **THEN** the featured partner appears in Partner venues
- **AND** the non-featured partner does not appear solely for being in the catalog

#### Scenario: Empty featured partners hides section

- **GIVEN** no featured partners exist
- **WHEN** a guest visits Discover
- **THEN** the Partner venues section is not shown

### Requirement: Member event list requires active subscription

The system SHALL allow the member event list and map (`/:locale/events`, `/:locale/events/map`) only for signed-in `USER` accounts with a booking-eligible subscription status (`ACTIVE` or `CANCELLED_PENDING`, via `isBookingEligibleStatus`). Guests SHALL continue to receive the existing auth redirect. A signed-in `USER` without a booking-eligible subscription SHALL be redirected with `302` to `/:locale/discover` and SHALL NOT see the full upcoming catalog. `ADMIN` access to these member feed routes SHALL follow existing admin/member guard behavior without using Discover as the inactive-member landing for admins.

#### Scenario: Inactive member cannot browse the full feed

- **WHEN** a USER with a non-booking-eligible subscription (including `INACTIVE`, `PAST_DUE`, or missing subscription) opens `/events` or `/events/map`
- **THEN** they are redirected to Discover
- **AND** they do not see the full upcoming catalog

#### Scenario: Active member browses events

- **WHEN** a USER with a booking-eligible subscription opens `/events`
- **THEN** they see the filtered/paginated member feed

#### Scenario: Guest path to browse still requires auth

- **WHEN** a guest opens `/events`
- **THEN** they are redirected to sign in (existing guest auth gate)

### Requirement: Discover preview CTA

Discover EventCard CTAs SHALL use Book Now / Bin dabei for bookable events (Waitlist / Warteliste when sold out) and SHALL navigate to the public event detail page `/:locale/events/:id`. Documentation under `docs/product/` and BDD scenarios SHALL describe this path (not “See details” / “Mehr sehen” as the sole guest CTA). Playwright covering Discover preview SHALL assert the Book Now / Bin dabei (or Waitlist) label via proximity role/name selectors.

#### Scenario: Discover preview links to public event detail

- **WHEN** a guest follows the event card CTA (Book Now / Bin dabei)
- **THEN** they land on the public event detail page (`/events/:id`) without being forced to log in

#### Scenario: Product docs describe Book Now guest CTA

- **WHEN** an implementer reads `docs/product/ui/ui-component-map.md`, `static-pages-content.md`, `CHARTER.md`, and `sitemap/sitemap.md` after this change
- **THEN** guest Discover EventCard CTAs are documented as Book Now / Bin dabei (or Waitlist when sold out) linking to public `/events/:id`, not as “See details” alone

### Requirement: Public event detail without authentication

The system SHALL render `/events/:id` for guests without requiring login, using the checkout-focused public detail surface (identity + summary/action card). Booking, waitlist, and save actions remain authentication-gated. Playwright SHALL prove guest access with a test titled exactly `Scenario: Guest can view public event detail without authentication` in `e2e/specs/event-discovery.spec.ts`. Product docs SHALL mark the route as public and describe the checkout layout. Phase 5.5 release spot-checks SHALL reconfirm public access on staging (or document already-aligned).

#### Scenario: Guest can view public event detail without authentication

- **WHEN** a guest opens a valid upcoming event detail URL
- **THEN** event content and the checkout summary card render without login and gated actions require authentication

### Requirement: Public event copy follows URL locale

Public event detail, EventCards, map popups, Discover featured, saved list, waitlist join/cancel chrome, and event SEO/JSON-LD SHALL display `title_*` and `description_*` for the active `/:locale` (fallback: other locale, then canonical). Description SHALL be locale-resolved on public detail and in SEO/JSON-LD only (cards and map popups show title). `/de/events/:id` and `/en/events/:id` MAY show different title/description for the same event. Each locale URL’s HTML body, document title, meta description, and JSON-LD `name` / `description` MUST match that locale. Document title SHALL be `{resolved title} at {partner} — Unveiled Berlin`. Meta description and JSON-LD `description` SHALL remain a plain-text extract of the **resolved** Markdown description (existing truncate). `hreflang` already points at the other locale URL and SHALL NOT be used as an excuse to serve the same body copy on both URLs.

#### Scenario: Guest sees English title on /en

- **WHEN** a guest opens `/en/events/:id` for an event with `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the identity title is "Concert"

#### Scenario: Guest sees German title on /de

- **WHEN** a guest opens `/de/events/:id` for that same event
- **THEN** the identity title is "Konzert"

#### Scenario: English detail uses English description

- **WHEN** a guest opens `/en/events/:id` for an event with distinct `description_en` and `description_de`
- **THEN** the identity description is the English Markdown (GFM-rendered)
- **AND** the page meta description and JSON-LD `description` are derived from that English Markdown

#### Scenario: EventCard title follows feed locale

- **WHEN** a member opens `/en/events` (or Discover / saved) for an event with `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the EventCard title is "Concert"

#### Scenario: Map popup title follows map locale

- **WHEN** a member opens `/en/events/map` for that same event
- **THEN** the map popup title is "Concert"

#### Scenario: Document title matches page locale

- **WHEN** a guest opens `/en/events/:id` for an event titled "Concert" at partner "Venue"
- **THEN** the document title contains "Concert at Venue"

### Requirement: Public event detail for guests

The system SHALL allow unauthenticated users to view public event detail pages. The system SHALL NOT display membership credit price or event date/time on that page to guests (or other non–booking-eligible viewers). Booking-eligible members SHALL continue to see credit price and date/time needed to book. When date chrome is shown, DETAILS / summary date presentation SHALL list **all** event datetimes formatted in Europe/Berlin and SHALL emphasize the **next upcoming** datetime (denormalized primary `date_time`). Visibility SHALL be decided from the SSR session + membership eligibility used for booking CTAs (not a client-only hide). Structured data / Open Graph MAY still include a single `startDate` equal to the next upcoming datetime for crawlers.

#### Scenario: Guest public detail omits credits and date

- **WHEN** an unauthenticated user opens `/:locale/events/:id`
- **THEN** the page renders without credit cost and without date/time chrome
- **AND** the user can still see event identity content and an auth/unlock path toward booking

#### Scenario: Booking-eligible member sees credits and date

- **WHEN** a booking-eligible signed-in member opens the same event detail
- **THEN** credit cost and date/time remain visible

#### Scenario: Detail lists multiple datetimes

- **GIVEN** an upcoming event with two future datetimes
- **WHEN** a booking-eligible member opens `/events/:id`
- **THEN** both datetimes are visible in the detail date presentation
- **AND** the next upcoming datetime is emphasized

#### Scenario: Non-eligible signed-in viewer is gated like a guest

- **WHEN** a signed-in user who is not booking-eligible (for example `INACTIVE` / membership required, or `PAST_DUE`) opens public event detail
- **THEN** credit cost and date/time chrome are omitted
- **AND** membership or payment CTAs remain available as today

### Requirement: Event detail checkout datetime dropdown
On public event detail, when the viewer is booking-eligible and the event has two or more future datetimes, the checkout card SHALL show a native select of those datetimes (Europe/Berlin, active locale). Changing the selection SHALL update the one-ticket credit total from that slot’s price. The book CTA SHALL include the selected instant as `dateTime` (ISO) when that hour is not already held. When the selected hour is already held as `CONFIRMED` or `USED`, the checkout card SHALL show the already-booked message and My Tickets link instead of a book CTA (and instead of a waitlist CTA), while keeping the datetime select so another unbooked hour can restore the book CTA. Guests and other non–booking-eligible viewers SHALL NOT see the dropdown, quantity controls, or credit totals (existing chrome). When only one future datetime exists, the checkout card SHALL NOT show the dropdown and SHALL use that slot’s credits — or the already-booked message if that sole hour is already held. Compact EventCards and map popups SHALL continue to show the next upcoming datetime and denormalized `credit_price`. DETAILS MAY continue to list all datetimes. Ticket-quantity steppers SHALL NOT appear. `docs/product/features/event-discovery.feature` SHALL include scenarios titled `Dropdown changes credits`, `Guest checkout omits slot picker`, and `Booking-eligible member sees credits and date on event detail`. Canonical already-booked Gherkin titles SHALL live in `docs/product/features/booking.feature` (not a second copy here).

#### Scenario: Dropdown changes credits
- **GIVEN** an upcoming event with a morning slot priced 1 and an evening slot priced 4
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open `/events/:id` and choose the evening datetime
- **THEN** the checkout total uses 4 credits for one ticket

#### Scenario: Guest checkout omits slot picker
- **WHEN** a guest opens the same event
- **THEN** the checkout card does not show a datetime dropdown or credit totals

#### Scenario: Single future occurrence has no dropdown
- **WHEN** a booking-eligible member opens an event with exactly one future datetime they have not booked
- **THEN** the checkout card does not show a datetime dropdown
- **AND** the credit total uses that future slot’s price

#### Scenario: Booking-eligible member sees credits and date on event detail
- **WHEN** I am signed in as a booking-eligible member
- **AND** I open a valid upcoming event detail URL I have not booked
- **THEN** the summary card shows the credit total for one ticket (no quantity stepper)

#### Scenario: Already booked hour replaces book CTA
- **WHEN** I am signed in as a booking-eligible member
- **AND** I open an upcoming event whose selected occurrence I already booked
- **THEN** the summary card shows the already-booked message and My Tickets link instead of a book CTA
- **AND** Playwright coverage for that behavior lives under `booking.feature` titles

### Requirement: Discovery feature documents checkout dropdown
`docs/product/features/event-discovery.feature` SHALL include a booking-eligible checkout dropdown scenario and SHALL keep guest omit-credits behavior. Compact cards SHALL continue to show next upcoming datetime and denormalized `credit_price` (no price range). Playwright in `e2e/specs/event-discovery.spec.ts` SHALL include tests titled exactly `Scenario: Dropdown changes credits`, `Scenario: Guest checkout omits slot picker`, and `Scenario: Booking-eligible member sees credits and date on event detail`. The checkout datetime control SHALL be a native `<select>` asserted with `getByLabel` (`Datum und Uhrzeit` / `Date and time`). Guests SHALL NOT see the dropdown or credit totals. Eligible checkout SHALL NOT assert an “increase tickets” control. `docs/product/ui/ui-component-map.md` Event detail entry SHALL mention the eligible-member datetime select, one-ticket credit total, and already-booked overlay (no qty stepper). DETAILS MAY continue to list all datetimes in a separate scenario.

#### Scenario: Coverage traces checkout dropdown
- **WHEN** the coverage matrix is updated for this feature
- **THEN** it includes a row for the dropdown changing displayed credits (pass or explicit environment skip)
- **AND** it includes a row for guest checkout omitting the slot picker
- **AND** it includes a row for eligible checkout credits without a quantity stepper
- **AND** none of those rows uses `@skip-no-ui`

#### Scenario: Dropdown changes credits
- **GIVEN** an upcoming event with a morning slot priced 1 and an evening slot priced 4
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open `/events/:id` and choose the evening datetime
- **THEN** the checkout total uses 4 credits for one ticket

#### Scenario: Guest checkout omits slot picker
- **WHEN** a guest opens the same event
- **THEN** the checkout card does not show a datetime dropdown or credit totals

### Requirement: Discovery e2e tracks checkout without quantity
`docs/product/features/event-discovery.feature` and `e2e/specs/event-discovery.spec.ts` SHALL assert credit total for one ticket and MUST NOT require an “increase tickets” control. The already-booked hour scenario SHALL be covered in booking e2e (detail is the same checkout card), with verbatim Gherkin titles in `booking.feature`. `event-discovery.feature` SHALL own “no quantity stepper on eligible checkout” via the scenario titled `Booking-eligible member sees credits and date on event detail`. Playwright SHALL use that title verbatim. Coverage-matrix SHALL map it (`pass` when `DATABASE_URL` is set).

#### Scenario: Booking-eligible member sees credits and date on event detail
- **WHEN** I am signed in as a booking-eligible member
- **AND** I open a valid upcoming event detail URL I have not booked
- **THEN** the summary card shows the credit total for one ticket (no quantity stepper)

#### Scenario: Discovery specs have no increase-tickets control
- **WHEN** an implementer greps `e2e/specs/event-discovery.spec.ts` and `event-discovery.feature`
- **THEN** there is no remaining “increase tickets” / guest cap of 3 requirement
- **AND** guest checkout still omits quantity and credit totals

### Requirement: Public event detail gallery

The public event detail page SHALL show an image gallery at the end of the page when the event has one or more gallery images. Activating a gallery photo SHALL open a slider that allows previous/next navigation through the gallery. When the event has zero gallery images, the public detail page SHALL omit the gallery section (no empty-state block). The gallery SHALL be visible without authentication on the same public `/:locale/events/:id` surface as the rest of the detail content. Gallery display SHALL NOT require Discover-featured membership when gallery images exist. Expanding Event JSON-LD / Open Graph to include all gallery images is out of scope for this requirement unless a later SEO change mandates it. Product Gherkin in `docs/product/features/event-discovery.feature` and the Event detail entry in `docs/product/ui/ui-component-map.md` SHALL describe the end-of-page gallery and slider. After demo seed has run, at least one upcoming featured event SHALL have multiple gallery images visible on its public detail page.

#### Scenario: Guest views gallery on event detail

- **WHEN** a guest opens a public event detail URL for an event that has gallery images
- **THEN** they see a gallery section after the main detail content
- **AND** they can open a photo slider with previous and next navigation

#### Scenario: No gallery images

- **WHEN** an event has zero gallery images
- **THEN** the public detail page omits the gallery section

#### Scenario: Featured demo event includes gallery

- **WHEN** demo seed has run
- **THEN** at least one upcoming featured event has multiple gallery images visible on its public detail page

#### Scenario: Product docs describe public gallery

- **WHEN** an agent reads `docs/product/features/event-discovery.feature` and the Event detail entry in `ui/ui-component-map.md`
- **THEN** they describe the end-of-page gallery thumbnails and prev/next slider for non-empty galleries

### Requirement: Detail LOCATION shows address and optional map

The public event detail LOCATION section SHALL show the event's composed display `address` whenever the event has an address. When derived coordinates exist, the section SHALL also show the map with a pin marker (existing pin/popup behavior). When coordinates are missing, the composed address SHALL still be shown and the map MAY be omitted. The LOCATION section MUST NOT require coordinates in order to present the address. Public surfaces SHALL NOT require reading structured street/house columns separately when composed `address` is present.

#### Scenario: Detail LOCATION shows address with map

- **WHEN** a visitor opens a valid upcoming event detail URL with a composed address and coordinates
- **THEN** the LOCATION section shows the address text
- **AND** the map shows a recognizable pin marker

#### Scenario: Detail LOCATION shows address without coordinates

- **WHEN** a visitor opens a valid upcoming event detail URL that has a composed address but no coordinates
- **THEN** the LOCATION section shows the address text
- **AND** the page does not require a map to present the location

### Requirement: Public event detail layout

The public event detail page SHALL present a checkout-focused layout without requiring authentication. On large viewports it SHALL use two primary rows: (1) title and location on the left with the summary/checkout card on the right; (2) the primary event image on the left with the Markdown description on the right. Below those rows, DETAILS metadata, LOCATION (address whenever present, with map when coordinates exist), and optional gallery behavior remain available. Booking, waitlist, and save mutations remain on authenticated routes; the detail page SHALL NOT create bookings or ledger entries.

#### Scenario: Guest can view public event detail without authentication

- **WHEN** a guest opens a valid upcoming event detail URL ("/events/:id")
- **THEN** the page renders checkout-focused event content (title/location + summary card, then image + description) without requiring login
- **AND** the summary card shows a login (or unlock) CTA without ticket quantity, credit cost, or date chrome
- **AND** DETAILS shows scannable metadata fields without date/time chrome (dense multi-column layout on md+)
- **AND** booking, waitlist, and save mutations remain on authenticated routes
- **AND** the detail page does not create bookings or ledger entries

#### Scenario: Large viewport uses two primary rows

- **WHEN** a guest or member views public event detail on a large viewport
- **THEN** row 1 places title and location beside the checkout/summary card
- **AND** row 2 places the primary event image beside the Markdown description
- **AND** DETAILS, LOCATION (address when present; map when coordinates exist), and gallery remain below those rows

### Requirement: Partner attribution on event detail

The public event detail page SHALL show the hosting partner's name together with the partner logo image (from `partners.logo_image_id` variants) in a premium, non-floating attribution near the title. The attribution SHALL NOT overlay the event hero as a detached badge.

#### Scenario: Partner name and logo on detail

- **WHEN** a guest or member opens a public event detail page for an event whose partner has a logo
- **THEN** they see the partner name and logo in the identity area of the page
- **AND** the logo is not rendered as a floating sticker on top of the event hero image

#### Scenario: Partner attribution without logo URL falls back gracefully

- **WHEN** partner attribution data has a name but no resolvable logo URL
- **THEN** the page still shows the partner name near the title
- **AND** it does not render a broken image in the attribution strip

### Requirement: Checkout-focused detail documented

Product UI docs and Gherkin for public event detail SHALL describe: on large viewports, two primary rows (title + location | summary/action card; primary event image | Markdown description); partner name + logo attribution in the identity area (not overlaid on the hero); responsive media sizing across sm/md/lg; dense multi-column DETAILS metadata below the fold; LOCATION map with a recognizable pin marker icon (not a black square); ticket quantity affordance with guest max 3 and signed-in max from credits ∩ remaining capacity; and that membership credit totals and event date/time chrome are shown only to booking-eligible members (guests and other non–eligible viewers omit those fields). Docs SHALL continue to state that the detail page does not create bookings or ledger entries (credit charge stays on `/:locale/events/:id/book`). The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL mention these layout, partner attribution, qty, and gating notes. Playwright SHALL cover stable aspects (DETAILS presence without requiring guest date; guest qty cap; unlock CTA; optional marker DOM/CSS after consent) without flaky map-tile OCR.

#### Scenario: UI component map matches shipped detail page

- **WHEN** an agent reads `docs/product/ui/ui-component-map.md` Event detail entry
- **THEN** it mentions the two-row checkout layout, partner logo + name attribution, dense DETAILS, pin marker, dynamic qty bounds, and member-only credits/date gating

#### Scenario: Guest sees checkout card on public detail

- **WHEN** a guest opens a bookable upcoming event detail page
- **THEN** Playwright (or an equivalent proximity assertion) can find the unlock/login CTA without requiring authentication to view the page
- **AND** the guest assertion MUST NOT require a visible credit total or date/time chrome

#### Scenario: DETAILS grid is documented and assertable

- **WHEN** a user views a public event detail page with multiple metadata fields
- **THEN** product docs describe a dense multi-column DETAILS layout on md+
- **AND** Playwright can assert DETAILS/metadata content via proximity (not CSS-module hashes)
- **AND** guest coverage MUST NOT require the date MetaCell to be present

#### Scenario: Map pin documented with stable e2e preference

- **WHEN** product docs and e2e describe the LOCATION map marker
- **THEN** they refer to a pin marker icon treatment
- **AND** e2e prefers DOM/CSS or aria on the marker element after consent, skipping when the consent gate blocks the map in CI

### Requirement: Guest path to full browse

The system SHALL not expose a public full upcoming-events list equivalent to member `/events`. Guests reaching `/events` are redirected to sign in or signup and, after auth (and onboarding if incomplete), may use the member feed. Playwright SHALL prove the redirect path with a test titled exactly `Scenario: Guest path to full browse requires signup or login` in `e2e/specs/event-discovery.spec.ts`. Phase 5.5 release spot-checks SHALL reconfirm the guest gate on staging (or document already-aligned).

#### Scenario: Guest path to full browse requires signup or login

- **WHEN** a guest attempts to open `/events`
- **THEN** they are redirected to authentication and can use the member feed only after completing auth/onboarding as required

### Requirement: Guest and member discovery behaviors are specified in Gherkin

`docs/product/features/event-discovery.feature` SHALL specify guest Discover as a curated **featured** upcoming preview (not an automatic catalog slice), public event detail (unauthenticated access to `/:locale/events/:id`), guest path to full browse via signup/login **and** booking-eligible subscription, non-booking-eligible USER Discover access with redirect away from `/events`, booking-eligible USER Browse events → `/events`, and authenticated member feed/filter/saved/map behaviors aligned with `docs/product/sitemap/sitemap.md`. Guests SHALL NOT be specified as having a public full upcoming-events list equivalent to `/events`. Discover-to-browse navigation SHALL be consistent with the sitemap and with `static-pages.feature` / user journeys. Shipped Playwright titles for in-scope guest and featured/browse-gate scenarios SHALL match Gherkin `Scenario:` lines verbatim where the BDD contract requires it. The feature file SHALL also specify the booking-eligible checkout datetime dropdown (two or more future occurrences) and that guests omit that dropdown and credit totals. Compact EventCard / map popup scenarios SHALL keep next upcoming datetime + denormalized `credit_price`.

#### Scenario: Feature file matches public detail

- **WHEN** a reader opens `event-discovery.feature` in `docs/product/features/`
- **THEN** it includes scenarios for unauthenticated event detail access and Discover-to-browse navigation consistent with the sitemap

#### Scenario: Guest preview without public full feed

- **WHEN** a reader reviews guest scenarios in `event-discovery.feature`
- **THEN** guests are specified with Discover curated **featured** preview and public detail, not a public full `/events` feed

#### Scenario: Member feed and saved/map remain gated

- **WHEN** a reader reviews member scenarios in `event-discovery.feature`
- **THEN** member feed, filters, saved list, and map behaviors are specified as authenticated USER flows under `/events`, `/saved`, and `/events/map`
- **AND** non-booking-eligible USER access to `/events` / `/events/map` is specified as redirect to Discover

#### Scenario: Guest Scenario titles are covered in Playwright

- **WHEN** featured-discover step 04 completes
- **THEN** `e2e/specs/event-discovery.spec.ts` (and related specs) includes coverage for public discovery preview, guest public detail, guest path to full browse, featured-only Discover, and browse/nav gate scenarios (or the coverage matrix lists a named deferral with owner)

#### Scenario: Feature file documents checkout dropdown
- **WHEN** a reader opens `event-discovery.feature`
- **THEN** it includes `Dropdown changes credits` and `Guest checkout omits slot picker`
- **AND** card/map scenarios still specify next upcoming datetime rather than a credit price range

### Requirement: Automated coverage for featured Discover and browse gate

The system’s BDD/e2e suite SHALL cover featured-only Discover, non-active Discover access, active-only `/events`, and the Discover vs Browse events nav labels. Playwright SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Demo seed SHALL create a small set of `featured_events` rows for upcoming catalog events so Discover is non-empty after `seed:demo`. When the featured upcoming list is empty, Discover SHALL show a clear empty state (DE/EN) that does not imply the full catalog is empty solely because nothing is featured.

#### Scenario: Guest sees featured Discover

- **WHEN** a guest visits Discover with at least one featured upcoming event
- **THEN** that featured event appears
- **AND** a non-featured upcoming catalog event does not appear solely for being soon

#### Scenario: Inactive member is redirected from browse

- **WHEN** a USER without a booking-eligible subscription opens `/events`
- **THEN** they are redirected to Discover

#### Scenario: Active member nav shows Browse events

- **WHEN** an active member views the app shell
- **THEN** the primary nav shows Browse events linking to `/events`

#### Scenario: Empty featured Discover state

- **WHEN** a guest visits Discover and no featured upcoming events exist
- **THEN** the page shows a clear empty state (localized)
- **AND** it does not present the full member `/events` feed

### Requirement: Product docs match featured Discover and browse split

`docs/product/` SHALL document Discover as admin-featured upcoming events only; Discover audience as guests and non-booking-eligible members; `/events` and `/events/map` as booking-eligible USER only (with redirects from step 03); and public `/events/:id` as ungated. Sitemap, static Discover copy, component map, i18n inventory, and gaps-and-decisions SHALL be updated to match shipped behavior (including ADMIN Discover QA access and footer Discover → `/discover` unless product later chooses parity).

#### Scenario: Feature file documents featured and access rules

- **WHEN** a reader opens `docs/product/features/event-discovery.feature`
- **THEN** it includes scenarios for featured-only Discover, non-active Discover access, and active-only member browse

#### Scenario: Sitemap and static docs match redirects

- **WHEN** a reader opens sitemap, app-shell, and static Discover copy docs
- **THEN** they describe the Discover ↔ Browse events split and redirects consistent with the parent guide step 03 table

### Requirement: Product docs match featured partners on Discover

`docs/product/` SHALL document Discover Partner venues as admin-curated `featured_partners` (up to 8 by `sort_order`), not an automatic catalog slice. Empty curated list hides the section. Sitemap, static Discover copy, component map, schema overview, i18n inventory, gaps-and-decisions, and coverage matrix SHALL match shipped behavior including the **Featured events** admin tab label and **Featured partners** admin routes.

#### Scenario: Feature files document featured partners

- **WHEN** product Gherkin and sitemap are read after this step
- **THEN** they include Featured partners admin list/add/remove and Discover curated partner venues behavior
- **AND** the admin tab for `/admin/featured` is named Featured events

### Requirement: Automated coverage for featured partners

The BDD/e2e suite SHALL cover (or matrix-defer with owner): Featured events tab label/navigation still works; Featured partners add/remove keeps the venue; Discover shows curated partners only and hides Partner venues when none are featured. Playwright SHALL use proximity/layout selectors only. Demo seed SHALL create a small set of `featured_partners` rows so Discover Partner venues can be non-empty after `seed:demo`.

#### Scenario: Guest sees featured partners only

- **WHEN** a guest visits Discover with a mixed featured/non-featured partner set
- **THEN** featured partners appear in Partner venues
- **AND** non-featured partners do not appear solely for existing in the catalog

### Requirement: BDD coverage for detail layout and partner attribution

Gherkin scenarios for the two-row public detail layout and partner logo/name attribution (including **working-day** opening hours when enabled) SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Eligible-member DETAILS Date scenarios SHALL assert date-only lines when partner hours are visible and date+time lines when hours are omitted. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim. Environment skips (`DATABASE_URL`) MAY remain as named `test.skip` reasons. The system SHALL NOT add `data-testid` for these scenarios.

#### Scenario: Coverage matrix lists new detail layout scenarios

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new event-discovery detail layout, partner attribution, partner opening-hours, and eligible-member Date scenarios (pass or explicit deferral)

#### Scenario: Guest sees partner attribution

- **WHEN** a guest opens a public event detail URL for a seeded partner with a logo
- **THEN** the partner name and logo are visible in the DETAILS attribution area
- **AND** the logo is not overlaid on the event hero as a floating badge

#### Scenario: Guest sees partner opening hours

- **WHEN** that partner has opening hours enabled with a valid weekly schedule
- **THEN** the DETAILS attribution area lists the open weekday hours
- **AND** closed weekdays are not listed

#### Scenario: Hours omitted when disabled

- **WHEN** the partner has `has_opening_hours` false
- **THEN** event detail does not show an opening-hours list

#### Scenario: Eligible member Date is date-only when partner has hours

- **GIVEN** the hosting partner has opening hours enabled with at least one open weekday
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists occurrence dates without clock times
- **AND** partner working-day hours remain visible in the attribution area

#### Scenario: Eligible member Date keeps time when partner has no hours

- **GIVEN** the hosting partner has `has_opening_hours` false
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists date and time
- **AND** no opening-hours list is shown

#### Scenario: Large viewport two-row layout is documented and smoke-tested

- **WHEN** a guest or member views public event detail
- **THEN** product Gherkin describes lg+ row 1 (title/location | checkout) and row 2 (hero | Markdown description)
- **AND** Playwright covers a proximity smoke for identity, checkout CTA, hero, and description without CSS-module hashes

#### Scenario: Docs and e2e titles align

- **WHEN** event-detail-hours-display hardening completes
- **THEN** shipped Playwright titles for in-scope hours and Date scenarios match Gherkin `Scenario:` lines
- **OR** the coverage matrix lists a named deferral with owner

### Requirement: Public event detail shows partner barrier-free

Public event detail DETAILS SHALL show an Accessibility / Barrierefreiheit row whose value comes from the hosting partner's `barrier_free` (`true` → Barrier-free / Barrierefrei; `NULL` → Not specified / Keine Angabe). Guests and members see the same ungated row (like partner hours). The page SHALL NOT read `events.barrier_free`. The unused display branch for stored `false` MAY remain for defensive reads. `docs/product/features/event-discovery.feature` SHALL include scenarios titled `Event detail shows partner barrier-free` and `Event detail when partner barrier-free is unset`. Playwright SHALL use those titles verbatim. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL note that Accessibility is partner-sourced.

#### Scenario: Event detail shows partner barrier-free

- **WHEN** I open a public event whose partner has barrier_free true
- **THEN** DETAILS shows Barrier-free / Barrierefrei

#### Scenario: Event detail when partner barrier-free is unset

- **WHEN** I open a public event whose partner has barrier_free null
- **THEN** DETAILS shows Not specified / Keine Angabe

#### Scenario: Accessibility row is ungated

- **WHEN** a guest or a booking-eligible member opens the same event
- **THEN** both see the Accessibility / Barrierefreiheit row with the partner value

### Requirement: Guest sees partner attribution with optional opening hours

Public event detail SHALL show the hosting partner’s name and logo in the DETAILS card partner attribution area (not as a floating sticker on the hero). When the partner has `has_opening_hours` true and a valid schedule with at least one open weekday, the same attribution area SHALL list **working days only** (weekdays that are not marked closed), Monday→Sunday among remaining days, Europe/Berlin wall times as `HH:MM – HH:MM`. Closed weekdays SHALL be omitted (no Closed / Geschlossen rows). When `has_opening_hours` is false, hours are null, the week is malformed, or every weekday is closed, the hours list MUST be omitted while name/logo behavior remains unchanged. Hours visibility SHALL NOT depend on booking eligibility (guests and members see the same hours when enabled).

`docs/product/features/event-discovery.feature` SHALL state open days only and closed weekdays absent for `Guest sees partner opening hours`. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL state working-day hours (closed days omitted). `docs/product/extras/content-i18n-inventory.md` SHALL still document Closed / Geschlossen for other surfaces (admin partner form) and SHALL state that the public detail hours list no longer shows that label.

#### Scenario: Guest sees partner attribution

- **WHEN** a guest opens a public event detail for an event whose partner has a logo
- **THEN** they see the partner name and logo in the DETAILS attribution area
- **AND** the logo is not rendered as a floating sticker on top of the event hero image

#### Scenario: Guest sees partner opening hours

- **WHEN** that partner has opening hours enabled with a valid weekly schedule that includes open and closed days
- **THEN** the DETAILS attribution area lists the open weekday hours
- **AND** closed weekdays are not listed

#### Scenario: Hours omitted when disabled

- **WHEN** the partner has `has_opening_hours` false
- **THEN** event detail does not show an opening-hours list

### Requirement: DETAILS Date omits time when partner has opening hours

When DETAILS shows Date chrome (booking-eligible members only), and the hosting partner’s opening-hours list is visible on that page, each Date line SHALL be the Europe/Berlin calendar date (weekday, day, month, year) **without** clock time. Multiple occurrences on the same Berlin calendar day SHALL collapse to one line. The next upcoming occurrence’s date SHALL remain emphasized. When the hours list is omitted, Date lines SHALL keep date **and** time (current formatter). Guests and other non-eligible viewers SHALL continue to omit Date chrome entirely. The checkout card datetime `<select>` (when two or more future slots exist) SHALL still show full slot date+time so members can pick an occurrence.

`docs/product/features/event-discovery.feature` SHALL include scenarios titled `Eligible member Date is date-only when partner has hours` and `Eligible member Date keeps time when partner has no hours`. Playwright titles SHALL match those `Scenario:` lines verbatim. Playwright SHALL assert Date/Datum lines omit clock time when hours are visible and include clock time when hours are omitted, using proximity to DETAILS Date chrome (not the hours list and not the checkout datetime select). `Booking-eligible member sees tickets, credits and date on event detail` SHALL NOT assume Date chrome includes clock time when partner hours are visible. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL state Date = date-only when hours are visible, date+time otherwise, and that checkout select still uses full datetime. Same-day collapse MAY remain unit-tested without a dedicated Playwright title. Environment skips (`DATABASE_URL`) MAY remain as named `test.skip` reasons. The system SHALL NOT add `data-testid` for these scenarios.

#### Scenario: Eligible member Date is date-only when partner has hours

- **GIVEN** the hosting partner has opening hours enabled with at least one open weekday
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists occurrence dates without clock times
- **AND** partner working-day hours remain visible in the attribution area

#### Scenario: Eligible member Date keeps time when partner has no hours

- **GIVEN** the hosting partner has `has_opening_hours` false
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists date and time
- **AND** no opening-hours list is shown

#### Scenario: Same-day slots collapse when time is omitted

- **GIVEN** two occurrences on the same Europe/Berlin calendar day at different times
- **AND** the hosting partner has published opening hours
- **AND** I am a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date shows that calendar day once

### Requirement: Language-independent events match any language filter
When event results are filtered or searched by language, events with `language_independent = true` SHALL be included for every language value (equivalent to matching all languages). Events that are not language-independent SHALL match only when their `languages` list intersects the selected language(s). Absence of a language filter UI does not remove this matching rule from the query/helper layer: the system SHALL expose a reusable predicate or helper that implements this rule and SHALL cover it with a unit or integration test.

#### Scenario: Language filter includes language-independent events
- **WHEN** a booking-eligible member applies a language filter (if present) or a query/helper filters by language
- **THEN** language-independent events remain in the result set alongside events that list that language

#### Scenario: Non-independent events require language intersection
- **WHEN** a language filter selects a language code
- **AND** an event is not language-independent and does not list that code
- **THEN** that event is excluded from the filtered result set

### Requirement: Detail shows language-independent clearly
When a guest or member opens a public event detail page for a language-independent event, the DETAILS metadata SHALL NOT imply a specific spoken language list. The page SHALL indicate the event is language-independent (using the Language-independent / Sprachunabhängig label) or omit the languages row rather than showing an empty language list.

#### Scenario: Detail shows language-independent clearly
- **WHEN** a guest or member opens a language-independent event detail page
- **THEN** the details metadata does not imply a specific spoken language list
- **AND** it indicates the event is language-independent (or omits languages rather than showing an empty list)

#### Scenario: Language-specific detail still lists languages
- **WHEN** a guest or member opens an event that is not language-independent and has one or more languages
- **THEN** the details metadata shows those languages as today

### Requirement: Public event location display

Event cards and public detail SHALL present the event's zip code in place of neighborhood/Kiez. Public detail LOCATION SHALL show the composed display `address` whenever present; map rules remain gated on lat/lng. Country/city MAY appear on detail for clarity but MUST NOT dominate cards while the product is Berlin-only. Public surfaces MUST NOT reintroduce Bezirk/neighborhood labels for event location metadata.

#### Scenario: Guest sees zip on event detail

- **WHEN** a guest opens a public event detail page
- **THEN** location metadata shows the event zip code (not neighborhood)

#### Scenario: Event card shows zip

- **WHEN** a guest or member views an event card in the feed or listing
- **THEN** the card shows the event zip code
- **AND** the card does not show a neighborhood/Kiez label

#### Scenario: Detail LOCATION uses composed address

- **WHEN** a guest opens a public event detail page for an event with a composed address
- **THEN** the LOCATION section shows that composed address text

### Requirement: Product docs and BDD match public zip location display
`docs/product/features/event-discovery.feature`, `docs/product/ui/ui-component-map.md` (EventCard / Event detail), and Playwright coverage SHALL describe event cards and public detail presenting the event zip code instead of neighborhood/Kiez. Country/city MAY appear on detail for clarity but MUST NOT be required to dominate cards while the product is Berlin-only. Coverage-matrix rows SHALL match Scenario titles (pass or named deferral). Selectors SHALL remain proximity/layout only.

#### Scenario: Event discovery feature file describes zip display
- **WHEN** an implementer reads `docs/product/features/event-discovery.feature` after this step
- **THEN** public card and/or detail scenarios mention zip code location metadata
- **AND** neighborhood/Kiez labels are not required as current location chrome

#### Scenario: UI component map EventCard uses zip
- **WHEN** an implementer reads the EventCard entry in `docs/product/ui/ui-component-map.md`
- **THEN** it lists zip (+ MapPin) instead of neighborhood

#### Scenario: Playwright or matrix covers zip on public surfaces
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for zip-on-card and/or zip-on-detail scenarios (pass or explicit deferral with owner)

### Requirement: Event detail primary hero framing

Public event detail SHALL present the primary image in a full-width rectangular hero frame, horizontally centered, not stretched to fill the frame. `max-width: 100%` downscale to avoid overflow is allowed. The primary hero remains `events.image_id` (gallery images MUST NOT replace it). Product UI docs (`docs/product/ui/ui-component-map.md` Event detail entry) SHALL describe this framing contract.

#### Scenario: Primary hero is centered without stretch-to-fill

- **WHEN** a guest or member opens a public event detail page that has a primary image
- **THEN** the primary image appears inside a full-width rectangular hero band
- **AND** the image is horizontally centered and not stretched to fill the band
- **AND** wide images may downscale with `max-width: 100%` (or equivalent) so they do not overflow

#### Scenario: UI component map documents hero framing

- **WHEN** an agent reads the Event detail entry in `docs/product/ui/ui-component-map.md`
- **THEN** it states that the primary hero uses a full-width frame with a centered, non-stretch-to-fill image (`max-width: 100%` downscale allowed)

### Requirement: Public detail shows subtitles metadata

When `has_subtitles` is true, the public event detail DETAILS metadata SHALL show subtitles availability and every code in `subtitle_languages` (same presentation as spoken-language codes on the same page). When `has_subtitles` is false, the page SHALL omit subtitles chrome (no “no subtitles” row). Subtitles display SHALL NOT replace or alter the spoken-languages / language-independent DETAILS row.

#### Scenario: Subtitled event shows language on detail

- **WHEN** a guest or member opens a public event detail page for an event with `has_subtitles` = true and `subtitle_languages` containing one or more ISO 639-1 codes
- **THEN** the DETAILS metadata includes a subtitles row that indicates subtitles are available
- **AND** each stored subtitle language is shown

#### Scenario: Detail shows subtitles when present

- **WHEN** a guest or member opens a public event detail page for an event with `has_subtitles` = true and `subtitle_languages` containing one or more ISO 639-1 codes
- **THEN** the DETAILS metadata includes a subtitles row
- **AND** each stored subtitle language is shown

#### Scenario: Non-subtitled event omits subtitles chrome

- **WHEN** a guest or member opens a public event detail page for an event with `has_subtitles` = false
- **THEN** the DETAILS metadata does not include a subtitles row

### Requirement: Guest DETAILS omits target age groups

The public event DETAILS section SHALL NOT show a Target age groups / Zielgruppe metadata row. Because events no longer store target age groups, no public or member surface SHALL display event age-group audience metadata. (Zip / PLZ omission in DETAILS remains as already specified in product discovery features.)

#### Scenario: Guest does not see age groups in DETAILS

- **WHEN** a guest opens a valid upcoming event detail URL
- **THEN** the DETAILS section does not show Target age groups / Zielgruppe

#### Scenario: Product discovery feature omits event age-group metadata

- **WHEN** an implementer reads `docs/product/features/event-discovery.feature`
- **THEN** guest DETAILS scenarios do not require events to expose target age groups
- **AND** any remaining absence assertion is regression-only (field is not collected)

### Requirement: Compact discovery surfaces show next upcoming datetime

Event cards on Discover / member feed / saved surfaces and map marker popups SHALL display the event’s **next upcoming** datetime (denormalized `date_time`), formatted in Europe/Berlin for the active locale. They SHALL NOT show an arbitrary past slot when a later upcoming datetime exists. Map popups MAY continue to omit booking actions and SHALL link to public event detail.

#### Scenario: Event card shows next upcoming

- **WHEN** a multi-datetime event with one past and one future occurrence appears on a card surface
- **THEN** the card date line shows the future (next upcoming) datetime

#### Scenario: Map popup shows next upcoming

- **WHEN** a member opens a map marker popup for an upcoming multi-datetime event
- **THEN** the popup includes the next upcoming datetime
- **AND** a link to the public event detail remains available

### Requirement: Public captions for image credit
Public event detail SHALL show `images.credit` as a caption under the primary hero when non-empty, and in the gallery lightbox for that photo when non-empty. The caption SHALL be the stored string as-is (no automatic `Foto:` / `Photo:` prefix). Compact EventCards and map popups SHALL NOT show credit. When the partner logo has credit, DETAILS SHALL show it as a muted caption under the logo; when empty, no caption. Guests and members see the same ungated captions. `docs/product/features/event-discovery.feature` SHALL include scenarios titled `Hero shows credit`, `Gallery photo credit in lightbox`, `Empty credit omitted`, and `Cards omit credit`. Playwright SHALL use those titles verbatim. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL note hero, lightbox, and optional partner-logo captions.

#### Scenario: Hero shows credit
- **WHEN** I open a public event whose primary image has credit
- **THEN** I see that credit under the primary image

#### Scenario: Gallery photo credit in lightbox
- **WHEN** a gallery image has credit "Photo: Ada"
- **AND** I open that photo in the public gallery lightbox
- **THEN** I see the credit caption

#### Scenario: Empty credit omitted
- **WHEN** an image has NULL credit
- **THEN** public event detail does not show a credit caption for that image

#### Scenario: Cards omit credit
- **WHEN** I view Discover or the member feed
- **THEN** event cards do not show image credit

### Requirement: Docs and e2e cover locale event copy

`docs/product/features/event-discovery.feature` SHALL include scenarios titled `Guest sees English title on /en` and `Guest sees German title on /de`. Playwright in `e2e/specs/event-discovery.spec.ts` SHALL use those titles verbatim (`test("Scenario: …")`). Those scenarios SHALL assert the public identity heading shows the English title on `/en/events/:id` and the German title on `/de/events/:id` for the same event with distinct `title_en` and `title_de`. Playwright SHALL use proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); the system SHALL NOT add `data-testid` for these scenarios.

`docs/product/extras/seo-and-metadata.md` SHALL state that event document `<title>`, meta description, and JSON-LD `name` / `description` follow the page locale (resolved copy for that URL). `docs/product/ui/ui-component-map.md` SHALL state that Event detail identity title + Markdown description and EventCard title are locale-resolved for `/:locale`. `docs/product/database/schema-overview.md` SHALL document `title_de` / `title_en` / `description_de` / `description_en` plus canonical DE sync and title-search OR. Coverage-matrix rows SHALL map the new Gherkin titles to Playwright (`pass` when `DATABASE_URL` is set, or a named env skip — never “UI not built”).

Seed/demo data SHALL include at least one upcoming event whose German and English titles are **distinct non-empty** strings so these scenarios can assert locale without colliding with `DEMO_DISCOVERY_TITLES.tonight` (and other identical-string demo titles that existing tests still look up on both locales).

#### Scenario: Guest sees English title on /en

- **WHEN** I open `/en/events/:id` as a guest
- **THEN** I see the event's English title

#### Scenario: Guest sees German title on /de

- **WHEN** I open `/de/events/:id` as a guest
- **THEN** I see the event's German title

#### Scenario: SEO docs state locale-resolved event meta

- **WHEN** a reader opens `docs/product/extras/seo-and-metadata.md`
- **THEN** event `<title>` and meta description are specified as following the page locale

#### Scenario: Schema overview documents four locale columns

- **WHEN** a reader opens `docs/product/database/schema-overview.md`
- **THEN** `title_de` / `title_en` / `description_de` / `description_en` are documented as required text
- **AND** canonical `title` / `description` are documented as DE write-time copies
- **AND** title search is documented as matching either locale column

### Requirement: Feed title filter matches either locale

Product Gherkin MAY include a scenario that a booking-eligible member on `/de/events` filtering `title=` by a substring unique to `title_en` still sees that event. If included, Playwright SHALL use the Gherkin title verbatim. Domain title ILIKE already ORs both locale columns (step 01); this requirement is documentation and e2e only.

#### Scenario: Filter by English title on /de

- **WHEN** a booking-eligible member on `/de/events` applies an event-name filter that matches only `title_en`
- **THEN** the event is included in the feed
- **AND** the EventCard title shown is the German title

