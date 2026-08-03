# Event discovery for the production MVP.
#
# Charter locks:
#   - Discover = /:locale/discover with admin-featured preview (includes past featured; not a public full feed)
#   - /events/:id is public (no auth); book/save/waitlist remain gated
#   - Member feed /events, /events/map, /saved require USER; browse/map also require booking-eligible subscription
#   - No algorithmic ranking — explicit filters only (event name / category / partner / date; single-select partner)
#   - Default feed scope = all upcoming (any date_times element >= now / denormalized date_time >= now), soonest first by next upcoming; custom date range available
#   - Date range lower bound is never before Berlin today; ranged results still exclude already-started events
#   - Cards/map popups show next upcoming datetime; booking-eligible detail lists all datetimes (emphasize next)
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
    Then I see a curated featured preview of events (no auth required)
    And featured events that are already past still appear
    And I see membership framing in the section header (eyebrow)
    And I do not see a public full upcoming-events list equivalent to the member "/events" feed

  Scenario: Guest sees featured Discover
    Given I am not signed in
    And at least one event is admin-featured
    And at least one other upcoming catalog event is not featured
    When I visit Discover ("/:locale/discover")
    Then the featured event appears
    And the non-featured upcoming catalog event does not appear solely for being soon

  Scenario: Guest sees featured partners only
    Given I am not signed in
    And at least one partner is admin-featured
    And at least one other catalog partner is not featured
    When I visit Discover ("/:locale/discover")
    Then the featured partner appears in Partner venues
    And the non-featured partner does not appear solely for existing in the catalog

  Scenario: Empty featured partners hides Partner venues
    Given I am not signed in
    And no featured partners exist
    When I visit Discover ("/:locale/discover")
    Then the Partner venues section is not shown

  Scenario: Past featured event remains on Discover
    Given I am not signed in
    And an admin-featured event has a date/time in the past
    When I visit Discover ("/:locale/discover")
    Then that featured event still appears

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

  Scenario: Large viewport uses two primary rows
    Given I am not signed in
    When I open a valid upcoming event detail URL ("/events/:id")
    Then on large viewports row 1 places title and location beside the checkout/summary card
    And row 2 places the primary event image beside the Markdown description
    And DETAILS, LOCATION (composed address when present; map when lat/lng exist), and gallery remain below those rows

  Scenario: Guest sees partner attribution
    Given I am not signed in
    And a seeded partner with a logo hosts an upcoming event
    When I open that event's public detail URL ("/events/:id")
    Then I see the partner name and logo in the identity area
    And the logo is not rendered as a floating sticker on top of the event hero image

  Scenario: Guest views gallery on event detail
    Given I am not signed in
    And an event has two or more gallery images
    When I open that event's public detail URL ("/events/:id")
    Then I see a gallery section after the main detail content (heading "Galerie" / "Gallery")
    And I can open a photo slider and navigate with previous and next controls

  Scenario: No gallery images
    Given an event has zero gallery images
    When I open that event's public detail URL ("/events/:id")
    Then the public detail page omits the gallery section

  Scenario: Featured demo event includes gallery
    Given demo seed has run
    When I open the public detail URL for an upcoming featured demo event that was seeded with a gallery
    Then I see multiple gallery images on the detail page

  Scenario: Booking-eligible member sees tickets, credits and date on event detail
    Given I am signed in as a booking-eligible member
    When I open the same valid upcoming event detail URL ("/events/:id")
    Then the summary card shows ticket quantity controls and total credits
    And DETAILS includes date/time chrome

  Scenario: Detail lists multiple datetimes
    Given an upcoming event with two future datetimes
    And I am signed in as a booking-eligible member
    When I open "/events/:id"
    Then both datetimes are visible in the detail date presentation
    And the next upcoming datetime is emphasized

  Scenario: Event card shows next upcoming datetime
    Given a multi-datetime event with one past and one future occurrence
    And I am signed in as a booking-eligible member
    When the event appears on Discover or the member feed
    Then the card date line shows the future (next upcoming) datetime

  Scenario: Map popup shows next upcoming datetime
    Given I am signed in as a booking-eligible member
    And I have accepted non-essential cookie consent
    When I open a map marker popup for an upcoming multi-datetime event
    Then the popup includes the next upcoming datetime
    And a link to the public event detail remains available

  Scenario: Detail LOCATION shows composed address with map
    Given I am not signed in
    And I have accepted non-essential cookie consent
    When I open a valid upcoming event detail URL with a composed address and coordinates ("/events/:id")
    Then the LOCATION section shows the composed address text
    And the LOCATION map shows a recognizable pin marker icon (not a black square)
    And selecting the marker opens a popup whose close control has a large enough hit target
    And activating the close control dismisses the popup

  Scenario: Guest does not see zip or age groups in DETAILS
    Given I am not signed in
    When I open a valid upcoming event detail URL ("/events/:id")
    Then the DETAILS section does not show Zip code / PLZ
    And the DETAILS section does not show Target age groups / Zielgruppe metadata rows
    And location still uses the composed address in LOCATION (not a neighborhood / Kiez label)

  Scenario: Event card shows zip
    Given I am viewing Discover or the member events feed
    When I see an event card
    Then the card shows the event zip code
    And the card does not show a neighborhood / Kiez label

  Scenario: Detail LOCATION shows composed address without coordinates
    Given I am not signed in
    When I open a valid upcoming event detail URL that has a composed address but no lat/lng ("/events/:id")
    Then the LOCATION section shows the composed address text
    And the page does not require a map to present the location

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

  Scenario: Language-independent events match any language filter
    # Forward-compatible: member feed filters today are category/partner/date only.
    # Query/helper layer treats language_independent = true as matching every language value.
    When a booking-eligible member applies a language filter (if present) or a query filters by language
    Then language-independent events remain in the result set alongside events that list that language

  Scenario: Detail shows language-independent clearly
    When a guest or member opens a language-independent event detail page
    Then the details metadata does not imply a specific spoken language list
    And it indicates the event is language-independent (or omits languages rather than showing an empty list)

  Scenario: Detail shows subtitles when present
    When a guest or member opens an event detail page with has_subtitles true and a subtitle language
    Then the DETAILS metadata includes a subtitles row that indicates subtitles are available
    And the subtitle language is shown

  Scenario: Detail omits subtitles when absent
    When a guest or member opens an event detail page with has_subtitles false
    Then the DETAILS metadata does not include a subtitles row

  Scenario: Event name filter control
    Given I am viewing the events feed as a booking-eligible member
    When I view the filters
    Then I see an event name field alongside partner and date range controls

  Scenario: Filter by event name
    Given I am viewing the events feed as a booking-eligible member
    When I enter an event name filter and apply
    Then only events whose title matches the filter are shown

  Scenario: Filter by partner (venue)
    Given I am viewing the events feed as a booking-eligible member
    When I select a specific partner/venue filter
    Then only events hosted by that partner are shown

  Scenario: Filter by custom date range
    Given I am viewing the events feed as a booking-eligible member
    When I set a start date and an end date
    Then only events within that date range (inclusive, full days) that have not already started are shown
    And the all-upcoming default no longer applies
    And a start date before Berlin today is treated as today

  Scenario: Reset filters
    Given I have applied one or more filters as a booking-eligible member
    When I reset the filters
    Then the feed returns to the default all-upcoming scope
    And event name, category, partner, and date filters are cleared

  Scenario: No results
    Given my applied filters match no events
    When I view the feed as a booking-eligible member
    Then I see an empty/no-results state

  Scenario: Map view mirrors the filtered feed
    Given I have applied filters to the events feed as a booking-eligible member
    When I open the map view
    Then the map shows markers only for the currently filtered events
    And the same title, category, partner, and date filters apply
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
