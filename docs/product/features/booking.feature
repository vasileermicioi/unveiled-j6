# Source: components/BookingModal.tsx, store.ts (bookEvent), functions/src/index.ts (bookEventAtomic).
#
# This is the most business-critical flow — capacity, credits, and idempotency must remain
# transactionally consistent in the Postgres/Drizzle rewrite (see database/schema-overview.md).
#
# DECISIONS MADE FOR THE REWRITE:
#   - Insufficient-credits was only checked client-side as a warning in the old app; the server was
#     always the real gate. DECIDED: keep server as the sole source of truth, remove the false sense of
#     a client-side "check" — client-side validation is UX-only (early feedback), never authoritative.
#   - The old app had genuinely no cancellation of any kind ("SECURE RSVP // NO REFUNDS" policy, which
#     is kept as the member-facing policy — members cannot self-cancel or self-refund). DECIDED: add an
#     admin-initiated cancellation capability, because without it there is no way to free up capacity
#     for waitlist promotion to have anything to promote into (see waitlist.feature) — this was a real
#     gap, not a deliberate policy, since capacity could otherwise only ever go down, never recover.
#     Cancellation and refunding are DECIDED to be decoupled: cancelling a booking frees capacity but
#     never auto-refunds credits (preserves the no-refund policy); a refund, if warranted, is a separate
#     explicit admin action (see credits-subscription.feature's "Admin issues a manual credit refund").
#   - The old app never emailed a booking confirmation — redemption info only ever appeared in-app
#     (BookingModal's success step). DECIDED: send a real confirmation email on every successful booking
#     (normal, comp ticket, and waitlist-promotion path alike), containing the same redemption info shown
#     in-app plus the .ics attachment — this was a real gap, not a deliberate choice: waitlist.feature
#     already committed to emailing promoted members ("I am notified by email that I've been promoted"),
#     and it would be a strange, inconsistent product if a normal same-day booking got no email at all
#     while a waitlist promotion did. Uses the same Resend integration already used for daily partner
#     codes (see extras/integrations-and-config.md).

Feature: Event Booking
  As an active member
  I want to book tickets to an event using my credits
  So that I can attend

  Background:
    Given I am viewing an event's booking panel
    And guests may preview a ticket count from 1 through 3
    And signed-in members may select up to min(floor(credits ÷ creditPrice), remainingCapacity) tickets (creditPrice ≤ 0 → capacity-only)
    And a successful booking is not limited by a universal hard max of 3 when credits and capacity allow a higher count

  Scenario: Booking requires authentication
    Given I am not signed in
    When I try to book an event
    Then I am redirected to sign in

  Scenario: Booking requires an active subscription
    Given I am signed in with subscription status other than "ACTIVE"
    When I try to book an event
    Then I am redirected to the membership checkout page

  Scenario: Member ticket quantity follows credits and capacity
    Given I am signed in with an "ACTIVE" subscription
    And I have enough credits and the event has remaining capacity for more than 3 tickets
    When I view the event detail checkout panel
    Then I may select a ticket count greater than 3

  Scenario: Successful booking
    Given I am signed in with an "ACTIVE" subscription
    And the event has enough remaining capacity for my requested ticket count
    And I have enough credits to cover creditPrice × ticket count
    When I confirm the booking
    Then a confirmed booking is created for me
    And my credits are decremented by creditPrice × ticket count
    And the event's remaining capacity is decremented by the ticket count
    And a negative-amount ledger entry of type "BOOKING" is recorded
    And I receive redemption info appropriate to the event's ticket type

  Scenario Outline: Redemption info by ticket type and secret code mode
    Given the event's ticket type is "<ticketType>" with secret code mode "<mode>"
    When my booking is confirmed
    Then I receive "<redemption>"

    Examples:
      | ticketType  | mode               | redemption                                            |
      | SECRET_CODE | MANUAL             | the event's admin-configured secret code              |
      | SECRET_CODE | SHARED_GENERATED   | one shared generated code, created on first booking and reused for all bookings of that event |
      | SECRET_CODE | UNIQUE_PER_BOOKING | a freshly generated code unique to this booking       |
      | VOUCHER     | (n/a)              | the event's promo code plus a link to the partner's event website |

  Scenario: Sold out — automatic waitlist offer
    Given the event's remaining capacity is less than my requested ticket count
    When I try to book
    Then I am offered to join the waitlist instead of booking

  Scenario: Booking fails — insufficient credits
    Given I do not have enough credits to cover creditPrice × ticket count
    When I attempt to confirm the booking
    Then the booking is rejected with an "insufficient credits" error
    And no credits, capacity, or ledger changes occur

  Scenario: Booking fails — subscription frozen (past due)
    Given my subscription status is "PAST_DUE"
    When I attempt to confirm a booking
    Then the booking is rejected with a "credits frozen, update payment" message

  Scenario: Idempotent retry
    Given I have already successfully booked with a given idempotency key
    When I resubmit the exact same booking request with that same idempotency key
    Then no duplicate booking, credit deduction, or capacity change occurs
    And I receive the same redemption info as the original booking

  Scenario: Post-booking actions
    Given I have a confirmed booking
    Then I can copy my redemption code
    And I can download an .ics calendar file for the event
    And I can see a support email for help

  Scenario: Booking confirmation email
    Given my booking is confirmed (normal booking, comp ticket, or waitlist promotion alike)
    Then I receive a confirmation email with my redemption info and an .ics calendar attachment
    And this is the same email regardless of which of the three paths created the booking

  Scenario: Admin cancels a confirmed booking
    Given I am signed in as "ADMIN"
    And a booking is "CONFIRMED"
    When I cancel that booking with a reason
    Then the booking's status becomes "CANCELLED"
    And the event's remaining capacity is increased by the booking's ticket count
    And no credits are refunded to the member as part of cancellation itself
    And waitlist processing is triggered for that event (see waitlist.feature)

  Scenario: Cannot cancel a booking that is not confirmed
    Given a booking's status is "WAITLIST", "CANCELLED", or "USED"
    When an admin attempts to cancel it
    Then the cancellation is rejected

  Scenario: Members cannot self-cancel or self-refund
    Given I am signed in as a "USER"
    Then no member-facing action exists to cancel a booking or request a refund myself
    And the "SECURE RSVP // NO REFUNDS" policy is communicated at the point of booking
