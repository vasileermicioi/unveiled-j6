# NOT IN MVP — Partner portal and check-in
#
# Parked from legacy partner-portal / check-in Gherkin (now under docs/product/features/post-mvp/).
# Also includes admin portal-access + venue QR scenarios removed from MVP
# admin-partners.feature.
#
# Do not treat these scenarios as MVP "done when" criteria. Step 04's
# IMPLEMENTATION-PLAN.mvp.md must not schedule partner portal / check-in phases.
# See docs/product/CHARTER.md parking lot and product/user-journeys.md Post-MVP.

Feature: Partner Portal and Check-In (Post-MVP)
  As a partner (venue operator) or attendee
  I want portal self-service, guest lists, and door check-in
  So that venues can run their presence without depending on admin for every change

  # --- Admin provisioning (moved from MVP admin-partners) ---

  Scenario: Regenerate a partner's venue check-in QR token
    Given I am signed in as "ADMIN"
    When I regenerate a partner's venue check-in token
    Then a new unique token replaces the old one
    And any previously printed/shared QR codes for that partner stop working

  Scenario: Create partner portal login access
    Given I am signed in as "ADMIN"
    And a partner does not yet have portal access
    When I create portal access for that partner (optionally specifying an email)
    Then a new "PARTNER" account is created, linked to that partner
    And a temporary password is generated
    And the partner record stores the portal user's id and email

  Scenario: Creating portal access when it already exists
    Given I am signed in as "ADMIN"
    And a partner already has portal access
    When I attempt to create portal access again
    Then I am told access already exists and no duplicate account is created

  Scenario: Creating portal access requires a valid email
    Given I am signed in as "ADMIN"
    And the partner has no contact email and none is provided
    When I attempt to create portal access
    Then the request is rejected

  Scenario: Creating portal access with an email already in use
    Given I am signed in as "ADMIN"
    And the target email is already registered to another account
    When I attempt to create portal access
    Then the request is rejected

  # --- Partner portal ---

  Scenario: View partner dashboard summary
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I open the partner portal
    Then I see my venue's name, address, and total non-cancelled guest count

  Scenario: View my venue check-in QR link
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I open the partner portal
    Then I see a shareable venue check-in link encoding my venue's check-in token
    And I can copy it (e.g. to print as a house QR code)

  Scenario: View guest list
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I view my guest list
    Then I see all non-cancelled bookings for my venue's events
    And each entry shows a guest identifier, ticket count, redemption code, event title, and check-in status

  Scenario: Guest list is scoped to my venue only
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    And another partner has their own events and bookings
    When I view my guest list
    Then I never see bookings belonging to another partner

  Scenario: Search the guest list
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I search by booking id or redemption code
    Then the guest list filters to matches

  Scenario: Filter the guest list by event
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I filter by a specific one of my events
    Then only that event's guests are shown

  Scenario: Manually check in a guest
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    And a guest's booking is "CONFIRMED" and within the check-in window
    When I check them in
    Then their booking status becomes "USED"

  Scenario: Check-in action is disabled outside the window or after use
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    And a guest's booking is already "USED" or outside the check-in window
    Then the check-in action is unavailable for that guest

  Scenario: Export guest codes
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I export the (optionally filtered) guest list
    Then I receive a CSV of guests and their redemption codes

  Scenario: Create my own event
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I create a new event with a title, credit price, capacity, description, image, and dateTime
    Then the event is added to the catalog, automatically scoped to my own partnerId
    And it follows the exact same validation/defaults rules as admin-created events (see admin-events.feature)
    And the image can be supplied as either a direct upload or a pasted URL, processed identically to the admin flow

  Scenario: Edit my own event
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I update the title, description, image, price, capacity, or redemption configuration of one of my own events
    Then the changes are saved and reflected in the feed

  Scenario: Delete my own event
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    When I delete one of my own events
    Then it is removed from the catalog and no longer bookable

  Scenario: Cannot manage another partner's events
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    And another partner has their own events
    When I attempt to view, edit, or delete one of their events directly (e.g. by guessing an event id)
    Then the action is rejected as not authorized

  Scenario: Cannot reassign an event to another partner
    Given I am signed in as "PARTNER"
    And my account is linked to exactly one partner (venue)
    And I am editing one of my own events
    When I attempt to change its partnerId
    Then the change is rejected — an event's partnerId is immutable once created

  Scenario: Admin retains full override across all partners
    Given I am signed in as "ADMIN"
    Then I can view, create, edit, or delete events for any partner, unrestricted by partnerId

  # --- Check-in ---

  Scenario: Partner manually checks in a guest (door)
    Given the check-in window for an event opens 24 hours before its start time and closes 18 hours after
    And I am signed in as "PARTNER" for the event's venue
    And a booking is "CONFIRMED" and within the check-in window
    When I check in that booking
    Then the booking status becomes "USED"
    And a check-in timestamp is recorded

  Scenario: Admin can check in any booking
    Given I am signed in as "ADMIN"
    Then I can check in any confirmed booking within its check-in window

  Scenario: Cannot check in outside the window
    Given a booking's event is not within the check-in window
    When a partner or admin attempts to check it in
    Then the check-in is rejected

  Scenario: Cannot check in a booking that isn't confirmed
    Given a booking's status is not "CONFIRMED" (e.g. "CANCELLED" or "WAITLIST")
    When a partner or admin attempts to check it in
    Then the check-in is rejected

  Scenario: Re-checking in an already-used booking
    Given a booking's status is already "USED"
    When a partner or admin attempts to check it in again
    Then the system reports "already checked in" without changing state

  Scenario: Guest self-check-in via venue QR code
    Given a partner venue displays a QR code encoding their venue check-in token
    And I am signed in
    When I scan the QR code
    Then the system finds my confirmed booking(s) for that partner within the check-in window
    And checks in the one closest in time to now

  Scenario: Guest scans venue QR while signed out
    Given I am not signed in
    When I scan a venue check-in QR code
    Then I am prompted to sign in and the check-in is not processed automatically

  Scenario: Guest scans venue QR with no eligible booking
    Given I have no confirmed bookings for that partner within the check-in window
    When I scan the venue QR code
    Then I am shown a message that no eligible booking was found

  Scenario: Re-scanning an already-used venue QR check-in
    Given I already have a "USED" booking for that partner within the check-in window
    When I scan the venue QR code again
    Then the system reports "already checked in"

  Scenario: Venue token mismatch
    Given the venue token in the QR code does not match the partner's stored token
    When the check-in is attempted
    Then it is rejected
