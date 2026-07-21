## ADDED Requirements

### Requirement: Discover shows curated featured events

The system SHALL render Discover (`/:locale/discover`) using only admin-featured upcoming events (`listFeaturedEvents` with `upcomingOnly: true`), not an automatic slice of the full upcoming catalog. Guests and signed-in `USER` accounts without a booking-eligible subscription (`ACTIVE` or `CANCELLED_PENDING`) MAY view Discover without authentication. When a signed-in `USER` with a booking-eligible subscription requests Discover, the system SHALL redirect them with `302` to `/:locale/events`. `ADMIN` viewers SHALL retain access to Discover (no redirect to the member feed). Public event detail (`/:locale/events/:id`) remains ungated.

#### Scenario: Public discovery preview for guests

- **WHEN** a guest visits Discover
- **THEN** they see the curated featured upcoming events (no auth required)
- **AND** they do not see the full member `/events` feed

#### Scenario: Discover is for non-active membership audiences

- **WHEN** a signed-in USER without a booking-eligible subscription visits Discover
- **THEN** the featured Discover page is shown
- **WHEN** a signed-in USER with a booking-eligible subscription visits Discover
- **THEN** they are redirected to `/:locale/events`

#### Scenario: Admin can open Discover for QA

- **WHEN** an ADMIN requests `/:locale/discover`
- **THEN** Discover is rendered (or otherwise remains reachable)
- **AND** they are not redirected to `/:locale/events`

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

## MODIFIED Requirements

### Requirement: Authenticated events feed page

The system SHALL serve `/:locale/events` as a fully server-rendered page for signed-in `USER` members with a booking-eligible subscription (`ACTIVE` or `CANCELLED_PENDING`), driven by GET query parameters `category`, `partnerId`, `from`, `to`, and `page`, with no client-side filter store required to reproduce the view. Guests SHALL be redirected to sign in. Signed-in `USER` members without a booking-eligible subscription SHALL be redirected to `/:locale/discover` and SHALL NOT receive the full feed (subscription-banner-while-listing is not the primary gate). The page SHALL render a GET filter form, pagination that preserves active query params with a "Showing X–Y of Z" summary, and an empty/no-results state when filters match nothing. The feed page SHALL be served with `noindex` robots metadata.

#### Scenario: Guest is redirected

- **WHEN** an unauthenticated user requests `/events`
- **THEN** they are redirected to sign in with a return URL that can restore the feed after login

#### Scenario: Non-active member is redirected to Discover

- **WHEN** a signed-in USER whose subscription is not booking-eligible requests `/events`
- **THEN** they are redirected to `/:locale/discover`

#### Scenario: Default feed shows today's events only

- **WHEN** a booking-eligible USER views `/events` with no date filters
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

#### Scenario: Feed is not indexed

- **WHEN** a crawler or browser loads `/events`
- **THEN** the response includes robots metadata instructing not to index the page
