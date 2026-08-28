# Admin Bookings tab, per-event lists, and event-level cancel-all confirm.
#
# Two cancel paths (locked in booking.feature):
#   - Single `/admin/bookings/:id/cancel` — CONFIRMED only, no credit refund, then waitlist promotion.
#   - Event cancel-all `/admin/events/:id/bookings/cancel-all` — refunds charged credits, restocks
#     vouchers, restores capacity by cancelled tickets, closes WAITING (does not promote).
# Members cannot self-cancel. Guests and USER members cannot open these admin routes.

Feature: Admin event bookings
  As an admin
  I want to inspect bookings per event and cancel every confirmed booking on that event
  So that I can unwind an event without cancelling members one by one

  Scenario: Admin opens the Bookings tab
    Given I am signed in as "ADMIN"
    When I open the Bookings tab
    Then I see events with booking and waitlist counts
    And I can open an event's booking list

  Scenario: Admin views bookings for one event
    Given I am signed in as "ADMIN"
    And an event has confirmed tickets
    When I open bookings for that event
    Then I see each booking's member, status, occurrence, tickets, and credits charged
    And I can open single-booking cancel
    And I see Cancel all confirmed bookings

  Scenario: Empty event bookings
    Given I am signed in as "ADMIN"
    When I open bookings for an event with no bookings
    Then I see the empty copy "No bookings for this event" / "Keine Buchungen für dieses Event"
    And I do not see a working cancel-all submit

  Scenario: Admin cancels all bookings from the confirm page
    Given I am signed in as "ADMIN"
    And an event has confirmed bookings
    When I confirm cancel-all with a reason
    Then I return to the event bookings list
    And confirmed bookings show as cancelled
    And I see success copy that credits and vouchers were returned

  Scenario: Cancel-all confirm rejects an empty reason
    Given I am signed in as "ADMIN"
    And an event has confirmed bookings
    When I submit cancel-all without a reason
    Then no bookings change
    And the confirm page shows an error

  Scenario: Member cannot open the Bookings tab
    Given I am signed in as "USER"
    When I request /:locale/admin/bookings
    Then I do not see the admin Bookings list
