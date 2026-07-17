# Event discovery for the production MVP.
#
# Charter locks:
#   - Discover = locale home with curated guest preview (not a public full feed)
#   - /events/:id is public (no auth); book/save/waitlist remain gated
#   - Member feed /events, /events/map, /saved require USER
#   - No algorithmic ranking — explicit filters only (category / partner / date)
#   - Default feed scope = today (Europe/Berlin); custom date range available
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
    When I visit the Discover home ("/:locale")
    Then I see a curated preview of upcoming events (no auth required)
    And I see membership framing in the section header (eyebrow)
    And I do not see a public full upcoming-events list equivalent to the member "/events" feed

  Scenario: Guest can view public event detail without authentication
    Given I am not signed in
    When I open a valid upcoming event detail URL ("/events/:id")
    Then the page renders checkout-focused event content (identity + summary card) without requiring login
    And the summary card shows total credits and a login (or unlock) CTA
    And booking, waitlist, and save mutations remain on authenticated routes

  Scenario: Guest path to full browse requires signup or login
    Given I am not signed in
    When I attempt to open the member events feed ("/events")
    Then I am redirected to sign in (or signup)
    And after authentication (and onboarding if incomplete) I can use the member feed

  Scenario: Default feed shows today's events only
    Given I am signed in as a "USER" with an active or inactive subscription
    And I have not applied any date filters
    When I view the events feed
    Then I see only events happening today that have not already started

  Scenario: Events with invalid or past dates are hidden
    Given an event has a missing/invalid date or a start time in the past
    When any user views the events feed or map
    Then that event does not appear

  Scenario: Filter by category
    Given I am viewing the events feed
    When I select a category filter
    Then only events matching that category are shown

  Scenario: Filter by partner (venue)
    Given I am viewing the events feed
    When I select a specific partner/venue filter
    Then only events hosted by that partner are shown

  Scenario: Filter by custom date range
    Given I am viewing the events feed
    When I set a start date and an end date
    Then only events within that date range (inclusive, full days) are shown
    And the "today only" default no longer applies

  Scenario: Reset filters
    Given I have applied one or more filters
    When I reset the filters
    Then the feed returns to the default "today" scope

  Scenario: No results
    Given my applied filters match no events
    When I view the feed
    Then I see an empty/no-results state

  Scenario: Map view mirrors the filtered feed
    Given I have applied filters to the events feed
    When I open the map view
    Then the map shows markers only for the currently filtered events
    And selecting a marker opens a preview with a link to book

  Scenario: Saved events view
    Given I am signed in as a "USER"
    And I have saved one or more upcoming events
    When I view "My Saved Events"
    Then I see all my saved events that are still upcoming
    And this view is not restricted to "today only"

  Scenario: Save and unsave an event
    Given I am signed in
    When I toggle "save" on an event
    Then the event is added to or removed from my saved events list accordingly

  Scenario: Saving requires authentication
    Given I am not signed in
    Then the EventCard save control is not shown
    When I POST to a save endpoint without a session
    Then I am redirected to sign in
