## ADDED Requirements

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
