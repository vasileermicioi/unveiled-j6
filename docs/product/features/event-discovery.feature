# Event discovery for the production MVP.
#
# Charter locks:
#   - Discover = /:locale/discover with admin-featured upcoming preview (not a public full feed)
#   - /events/:id is public (no auth); book/save/waitlist remain gated
#   - Member feed /events, /events/map, /saved require USER; browse/map also require booking-eligible subscription
#   - No algorithmic ranking — explicit filters only (category / partner / date; single-select)
#   - Default feed scope = all upcoming (date_time >= now), soonest first; custom date range available
#   - List and map share the same filters + pagination; view switch is tabs (admin-style)
#
# Prefer Scenario titles that match shipped e2e/specs/event-discovery.spec.ts when
# behavior is unchanged.

Feature: Event Discovery
  As a guest or member
  I want to preview and browse upcoming events
  So that I can find something to book

  Background:
    Given there are published events with valid future date/times

  Scenario: Public discovery preview for guests
    Given I am not signed in
    When I visit Discover ("/:locale/discover")
    Then I see a curated featured preview of upcoming events (no auth required)
    And I see membership framing in the section header (eyebrow)
    And I do not see a public full upcoming-events list equivalent to the member "/events" feed

  Scenario: Guest sees featured Discover
    Given I am not signed in
    And at least one upcoming event is admin-featured
    And at least one other upcoming catalog event is not featured
    When I visit Discover ("/:locale/discover")
    Then the featured event appears
    And the non-featured upcoming catalog event does not appear solely for being soon

  Scenario: Discover is for non-active membership audiences
    Given I am signed in as a "USER" without a booking-eligible subscription
    When I visit Discover ("/:locale/discover")
    Then I see the featured Discover page
    When I am signed in as a "USER" with a booking-eligible subscription ("ACTIVE" or "CANCELLED_PENDING")
    And I visit Discover ("/:locale/discover")
    Then I am redirected to "/:locale/events"

  Scenario: Inactive member cannot browse the full feed
    Given I am signed in as a "USER" without a booking-eligible subscription
    When I attempt to open the member events feed ("/events") or map ("/events/map")
    Then I am redirected to Discover
    And I do not see the full upcoming catalog

  Scenario: Active member nav shows Browse events
    Given I am signed in as a "USER" with a booking-eligible subscription
    When I view the app shell (sticky header or mobile drawer)
    Then the primary nav shows Browse events (localized) linking to "/events"

  Scenario: Guest can view public event detail without authentication
    Given I am not signed in
    When I open a valid upcoming event detail URL ("/events/:id")
    Then the page renders checkout-focused event content (identity + summary card) without requiring login
    And the summary card shows a login (or unlock) CTA without ticket quantity, credit cost, or date chrome
    And DETAILS shows scannable metadata fields without date/time chrome (dense multi-column layout on md+)
    And booking, waitlist, and save mutations remain on authenticated routes
    And the detail page does not create bookings or ledger entries

  Scenario: Booking-eligible member sees tickets, credits and date on event detail
    Given I am signed in as a booking-eligible member
    When I open the same valid upcoming event detail URL ("/events/:id")
    Then the summary card shows ticket quantity controls and total credits
    And DETAILS includes date/time chrome

  Scenario: Detail LOCATION map shows a pin marker
    Given I am not signed in
    And I have accepted non-essential cookie consent
    When I open a valid upcoming event detail URL with coordinates ("/events/:id")
    Then the LOCATION map shows a recognizable pin marker icon (not a black square)
    And selecting the marker opens a popup whose close control has a large enough hit target
    And activating the close control dismisses the popup

  Scenario: Guest path to full browse requires signup or login
    Given I am not signed in
    When I attempt to open the member events feed ("/events")
    Then I am redirected to sign in (or signup)
    And after authentication (and onboarding if incomplete) and an active subscription I can use the member feed

  Scenario: Default feed shows all upcoming events soonest first
    Given I am signed in as a "USER" with a booking-eligible subscription
    And I have not applied any date filters
    When I view the events feed
    Then I see all upcoming events that have not already started
    And events are ordered by start time ascending (soonest first)

  Scenario: Events with invalid or past dates are hidden
    Given an event has a missing/invalid date or a start time in the past
    When any booking-eligible user views the events feed or map
    Then that event does not appear

  Scenario: Filter by category
    Given I am viewing the events feed as a booking-eligible member
    When I select a category filter
    Then only events matching that category are shown

  Scenario: Filter by partner (venue)
    Given I am viewing the events feed as a booking-eligible member
    When I select a specific partner/venue filter
    Then only events hosted by that partner are shown

  Scenario: Filter by custom date range
    Given I am viewing the events feed as a booking-eligible member
    When I set a start date and an end date
    Then only events within that date range (inclusive, full days) are shown
    And the all-upcoming default no longer applies

  Scenario: Reset filters
    Given I have applied one or more filters as a booking-eligible member
    When I reset the filters
    Then the feed returns to the default all-upcoming scope

  Scenario: No results
    Given my applied filters match no events
    When I view the feed as a booking-eligible member
    Then I see an empty/no-results state

  Scenario: Map view mirrors the filtered feed
    Given I have applied filters to the events feed as a booking-eligible member
    When I open the map view
    Then the map shows markers only for the currently filtered events
    And selecting a marker opens a preview with a link to book
    And the popup close control has a large enough hit target to activate reliably
    And activating the close control dismisses the popup

  Scenario: Saved events view
    Given I am signed in as a "USER"
    And I have saved one or more upcoming events
    When I view "My Saved Events"
    Then I see all my saved events that are still upcoming

  Scenario: Save and unsave an event
    Given I am signed in
    When I toggle "save" on an event
    Then the event is added to or removed from my saved events list accordingly

  Scenario: Saving requires authentication
    Given I am not signed in
    Then the EventCard save control is not shown
    When I POST to a save endpoint without a session
    Then I am redirected to sign in
