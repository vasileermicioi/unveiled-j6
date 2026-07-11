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
#     an admin cancelling a confirmed booking (frees capacity), or an admin increasing an event's total
#     capacity. There is no user-initiated way to free capacity (no self-cancel — see booking.feature).

Feature: Event Waitlist
  As a member
  I want to join a waitlist when an event is sold out, and be automatically promoted if a spot opens up
  So that I have a real chance at a spot without having to keep checking manually

  Background:
    Given I am signed in as a "USER"
    And an event's remaining capacity is less than my requested ticket count

  Scenario: Join the waitlist
    When I choose to join the waitlist with a requested ticket count
    Then a waitlist entry is created for me with status "WAITING"
    And I see a waitlist confirmation

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
    And I am the earliest-queued "WAITING" entry whose requested ticket count fits the newly freed capacity
    And a confirmed booking for that event is cancelled by an admin, or an admin increases the event's total capacity
    When the system processes the freed capacity
    Then the system attempts to book my requested ticket count on my behalf, through the same transaction as a normal booking (re-checking my subscription status and credit balance at this moment)
    And on success my waitlist entry becomes "PROMOTED" and a "CONFIRMED" booking is created for me with the same redemption info a normal booking would produce
    And I am notified by email that I've been promoted, with my redemption details

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
