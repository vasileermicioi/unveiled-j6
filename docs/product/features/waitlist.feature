# Source: store.ts (joinWaitlist), types.ts (WaitlistEntry, status: WAITING|PROMOTED|CANCELLED).
#
# DECISIONS MADE FOR THE REWRITE (this entire feature was a known gap in the old app — joining a
# waitlist worked, but PROMOTION and CANCELLATION were never implemented, there was no duplicate-join
# prevention, and no notification system):
#   - DECIDED: build real, automatic waitlist promotion. Design chosen for simplicity while staying
#     fully functional: no separate "claim window"/offer state — when capacity frees up, the system
#     immediately attempts to promote the earliest eligible WAITING entry through the *same* atomic
#     booking transaction used for a normal booking (see booking.feature), re-checking subscription and
#     credits at promotion time (since time has passed since they joined). This avoids a second parallel
#     state machine (no new "OFFERED" status, no expiry-timer infrastructure) while still delivering the
#     real value: a member on the waitlist gets an automatic, real booking when a spot opens up.
#   - DECIDED: add duplicate-waitlist prevention (one active WAITING entry per user per event).
#   - DECIDED: add user-initiated waitlist cancellation (a real gap — only admins could touch entries
#     before).
#   - DECIDED: promotion is triggered by two events, both from booking.feature/admin-events.feature:
#     an admin cancelling a **single** confirmed booking (frees capacity, no refund), or an admin
#     increasing an event's total capacity. Event-level **cancel-all** is the exception: it restores
#     capacity but sets every WAITING entry for that event to CANCELLED in the same transaction and
#     MUST NOT promote (see admin-event-bookings.feature). There is no user-initiated way to free
#     capacity (no self-cancel — see booking.feature).
#   - Unpublished events are not waitlistable (`joinWaitlist` fails as not found). Existing WAITING
#     rows stay if the event is later unpublished.

Feature: Event Waitlist
  As a member
  I want to join a waitlist when an event is sold out, and be automatically promoted if a spot opens up
  So that I have a real chance at a spot without having to keep checking manually

  Background:
    Given I am signed in as a "USER"
    And an event's remaining capacity is 0

  Scenario: Join the waitlist
    When I choose to join the waitlist
    Then a waitlist entry is created for me with status "WAITING" and requested_qty 1
    And I see a waitlist confirmation
    And the join form has no ticket-quantity control

  Scenario: Joining the waitlist requires authentication
    Given I am not signed in
    When I try to join a waitlist
    Then I am redirected to sign in

  Scenario: Duplicate waitlist join is prevented
    Given I already have a "WAITING" entry for this event
    When I try to join the waitlist for the same event again
    Then no duplicate entry is created
    And I am shown my existing waitlist position/status instead

  Scenario: I can cancel my own waitlist entry
    Given I have a "WAITING" entry for an event
    When I cancel my waitlist entry
    Then its status becomes "CANCELLED"
    And it is excluded from future promotion attempts for that event

  Scenario: Automatic promotion when capacity frees up
    Given I am on the waitlist for an event with status "WAITING"
    And I am the earliest-queued "WAITING" entry whose one-ticket request fits the newly freed capacity
    And a confirmed booking for that event is cancelled by an admin via single-booking cancel, or an admin increases the event's total capacity
    When the system processes the freed capacity
    Then the system attempts to book one ticket on my behalf, through the same transaction as a normal booking (re-checking my subscription status and credit balance at this moment)
    And on success my waitlist entry becomes "PROMOTED" and a "CONFIRMED" booking is created for me with tickets_count 1 and the same redemption info a normal booking would produce
    And I am notified by email that I've been promoted, with my redemption details

  Scenario: Cancel-all does not promote the waitlist
    Given I am on the waitlist for an event with status "WAITING"
    And the event is sold out
    When an admin cancels all confirmed bookings for that event
    Then my waitlist entry becomes "CANCELLED"
    And no waitlist entry becomes "PROMOTED" as a result of cancel-all
    And restored capacity is not consumed by promotion

  Scenario: Waitlist member receives waitlist-closed email
    Given I was WAITING on an event
    When an admin completes cancel-all for that event
    Then I receive an email that the waitlist is closed
    And that email does not state that credits were returned

  Scenario: Promotion is skipped if I'm no longer eligible
    Given I am the earliest-queued "WAITING" entry for a newly freed spot
    But my subscription is no longer "ACTIVE" or I no longer have enough credits at the moment of promotion
    When the system attempts to promote me
    Then I am skipped (my entry remains "WAITING", flagged as having been skipped once)
    And the system attempts the next-earliest eligible "WAITING" entry for the same freed capacity

  Scenario: Promotion respects queue order and partial capacity
    Given multiple "WAITING" entries exist for the same event, queued by join time
    And the newly freed capacity is only enough for some of them
    When the system processes the freed capacity
    Then entries are attempted strictly in join-time order
    And promotion stops once the freed capacity is exhausted, leaving remaining entries "WAITING"

  Scenario: Admin can manually trigger promotion for a specific entry
    Given I am signed in as "ADMIN"
    And a "WAITING" entry exists with enough currently-available capacity to fit it
    When I manually trigger promotion for that entry (support use case — e.g. a member called in)
    Then the same promotion transaction runs immediately for that entry, out of normal queue order

  Scenario: Admin visibility
    Given I am signed in as "ADMIN"
    When I view waitlist data
    Then I can see all waitlist entries across all events, including their status and any skip history

  Scenario: User visibility is scoped to their own entries
    Given I am signed in as "USER"
    When I view my waitlist entries
    Then I only see my own entries, not other users'

  Scenario: Join unpublished fails
    When I join the waitlist for an unpublished event
    Then no waitlist row is written
