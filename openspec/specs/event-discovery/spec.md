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

The system SHALL provide navigation between `/:locale/events` and `/:locale/events/map` that preserves the active filter query parameters (`category`, `partnerId`, `from`, `to`). Feed `page` MAY be omitted on the map link.

#### Scenario: Feed to map preserves filters

- **WHEN** a member on `/events` with active filters opens the map view link
- **THEN** `/events/map` is requested with the same filter query params

#### Scenario: Map to feed preserves filters

- **WHEN** a member on `/events/map` with active filters opens the list view link
- **THEN** `/events` is requested with the same filter query params

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

### Requirement: Public event detail for guests

The system SHALL allow unauthenticated users to view public event detail pages. The system SHALL NOT display membership credit price or event date/time on that page to guests (or other non–booking-eligible viewers). Booking-eligible members SHALL continue to see credit price and date/time needed to book. Visibility SHALL be decided from the SSR session + membership eligibility used for booking CTAs (not a client-only hide). Structured data / Open Graph MAY still include `startDate` for crawlers.

#### Scenario: Guest public detail omits credits and date

- **WHEN** an unauthenticated user opens `/:locale/events/:id`
- **THEN** the page renders without credit cost and without date/time chrome
- **AND** the user can still see event identity content and an auth/unlock path toward booking

#### Scenario: Booking-eligible member sees credits and date

- **WHEN** a booking-eligible signed-in member opens the same event detail
- **THEN** credit cost and date/time remain visible

#### Scenario: Non-eligible signed-in viewer is gated like a guest

- **WHEN** a signed-in user who is not booking-eligible (for example `INACTIVE` / membership required, or `PAST_DUE`) opens public event detail
- **THEN** credit cost and date/time chrome are omitted
- **AND** membership or payment CTAs remain available as today

### Requirement: Checkout-focused detail documented

Product UI docs and Gherkin for public event detail SHALL describe: aligned identity + summary/action card on large viewports; responsive hero sizing across sm/md/lg; dense multi-column DETAILS metadata below the fold; LOCATION map with a recognizable pin marker icon (not a black square); ticket quantity affordance with guest max 3 and signed-in max from credits ∩ remaining capacity; and that membership credit totals and event date/time chrome are shown only to booking-eligible members (guests and other non–eligible viewers omit those fields). Docs SHALL continue to state that the detail page does not create bookings or ledger entries (credit charge stays on `/:locale/events/:id/book`). The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL mention these layout, qty, and gating notes. Playwright SHALL cover stable aspects (DETAILS presence without requiring guest date; guest qty cap; unlock CTA; optional marker DOM/CSS after consent) without flaky map-tile OCR.

#### Scenario: UI component map matches shipped detail page

- **WHEN** an agent reads `docs/product/ui/ui-component-map.md` Event detail entry
- **THEN** it mentions aligned checkout layout, dense DETAILS, pin marker, dynamic qty bounds, and member-only credits/date gating

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

`docs/product/features/event-discovery.feature` SHALL specify guest Discover preview, public event detail (unauthenticated access to `/:locale/events/:id`), guest path to full browse via signup/login, and authenticated member feed/filter/saved/map behaviors aligned with `docs/product/sitemap/sitemap.md`. Guests SHALL NOT be specified as having a public full upcoming-events list equivalent to `/events`. Discover-to-browse navigation (auth CTA → member `/events`) SHALL be consistent with the sitemap and with `static-pages.feature` / user journeys. Shipped Playwright titles for in-scope guest scenarios SHALL match Gherkin `Scenario:` lines verbatim.

#### Scenario: Feature file matches public detail

- **WHEN** a reader opens `event-discovery.feature` in `docs/product/features/`
- **THEN** it includes scenarios for unauthenticated event detail access and Discover-to-browse navigation consistent with the sitemap

#### Scenario: Guest preview without public full feed

- **WHEN** a reader reviews guest scenarios in `event-discovery.feature`
- **THEN** guests are specified with Discover curated preview and public detail, not a public full `/events` feed

#### Scenario: Member feed and saved/map remain gated

- **WHEN** a reader reviews member scenarios in `event-discovery.feature`
- **THEN** member feed, filters, saved list, and map behaviors are specified as authenticated USER flows under `/events`, `/saved`, and `/events/map`

#### Scenario: Guest Scenario titles are covered in Playwright

- **WHEN** Phase 5.5 step 04 completes
- **THEN** `e2e/specs/event-discovery.spec.ts` includes verbatim titles for public discovery preview, guest public detail, and guest path to full browse (or the coverage matrix lists a named deferral)
