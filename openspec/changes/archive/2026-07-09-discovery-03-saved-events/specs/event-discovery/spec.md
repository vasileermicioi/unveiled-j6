## ADDED Requirements

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

## MODIFIED Requirements

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
