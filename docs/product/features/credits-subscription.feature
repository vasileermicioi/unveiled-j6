# Source: store.ts (activateSubscription, handleSuccessfulPayment, handleFailedPayment,
#         addLedgerEntry, adjustUserCredits, toggleUserFreeze), components/CheckoutView.tsx,
#         functions/src/index.ts (bookEventAtomic credit gate), types.ts (SubscriptionStatus, CreditLedgerEntry).
#
# DECISIONS MADE FOR THE REWRITE (the old app left all of these unresolved — see product/vision-and-domains.md):
#   - Payment is mocked in the old app (a 2-second simulated delay) despite UI copy claiming "secure
#     payment via Stripe". DECIDED: implement real Stripe Billing — Stripe Checkout for the initial
#     subscribe, the Stripe Customer Portal for payment-method updates and cancellation, and webhooks
#     for renewal/past-due/cancellation state changes. This is not optional for a production product
#     that charges real money.
#   - "Cancel Subscription" existed in the UI with no handler. DECIDED: real handler, see below.
#   - Marketing copy claimed "credits roll over" but no rollover logic existed. DECIDED: credits do
#     NOT roll over — this is the simpler, more standard membership-credit model (matches how e.g.
#     class-pass-style memberships work) and avoids unbounded credit accumulation. Unused credits are
#     forfeited at each period boundary (recorded as an EXPIRY ledger entry, not silently dropped).
#     Marketing copy must be corrected to match (see extras/content-i18n-inventory.md).
#   - PAUSED subscription status: DECIDED cut — no feature ever needed a "paused" state distinct from
#     cancellation-pending or freeze; keeping unused enum values invites bugs. CANCELLED_PENDING is kept
#     because the new real-cancellation flow actually uses it.
#   - Ledger types PURCHASE and REFERRAL_BONUS: DECIDED cut (see product/vision-and-domains.md non-goals
#     — no à la carte credit purchases, no referral program). EXPIRY is now a real, used type (monthly
#     forfeiture + cancellation forfeiture). REFUND is kept as a real, used type (admin support gesture,
#     decoupled from booking cancellation — see booking.feature).

Feature: Credits and Subscription
  As a member
  I want a monthly credit allowance tied to my subscription
  So that I can pay for event bookings

  Background:
    Given the plan is "Basic Berlin" at 29€/month for 17 credits/month

  Scenario: New signups start inactive with starter credits
    Given I just signed up
    Then my subscription status is "INACTIVE"
    And I already have 17 credits available (usable only once I activate)

  Scenario: Activating a subscription via real Stripe Checkout
    Given my subscription status is "INACTIVE"
    When I complete Stripe Checkout successfully for the Basic Berlin plan
    Then a Stripe webhook confirms the subscription
    And my subscription status becomes "ACTIVE"
    And a "SUBSCRIPTION_REFILL" ledger entry of +17 credits is recorded
    And I am routed to the events feed

  Scenario: Checkout blocked while frozen
    Given my subscription status is "UNPAID" (frozen by an admin)
    When I try to complete checkout
    Then the payment is blocked
    And I am shown a "payment stopped" message with support contact info

  Scenario: Already-active member revisits checkout
    Given my subscription status is already "ACTIVE"
    When I visit the checkout page
    Then I see a success/already-active state instead of a payment form

  Scenario: Failed payment marks the account past due
    Given I am an active subscriber
    When Stripe reports a failed renewal charge via webhook
    Then my subscription status becomes "PAST_DUE"
    And I am shown a "credits frozen, update payment" message wherever booking is attempted

  Scenario: Recovering from past due
    Given my subscription status is "PAST_DUE"
    When I successfully update my payment method via the Stripe Customer Portal and the retried charge succeeds
    Then a webhook flips my subscription status back to "ACTIVE"
    And normal monthly refills resume on my next billing cycle

  Scenario: Monthly renewal resets credits (no rollover)
    Given my subscription renews successfully via Stripe webhook
    Then any credits remaining from the previous period are forfeited
    And an "EXPIRY" ledger entry records the forfeited amount (0 if nothing was left)
    And a "SUBSCRIPTION_REFILL" ledger entry of +17 credits is recorded
    And my credit balance becomes exactly 17

  Scenario: Cancelling a subscription
    Given my subscription status is "ACTIVE"
    When I cancel my subscription (in-app handler or Stripe Customer Portal)
    Then my subscription status becomes "CANCELLED_PENDING" immediately
    And I retain full booking access and my current credit balance until the current billing period ends

  Scenario: Cancellation takes effect at period end
    Given my subscription status is "CANCELLED_PENDING" and the current billing period has ended
    When the end-of-period Stripe webhook fires
    Then my subscription status becomes "INACTIVE"
    And any remaining credits are forfeited with an "EXPIRY" ledger entry, same as a normal renewal

  Scenario: Reactivating after cancellation
    Given my subscription status is "INACTIVE" after a previous cancellation
    When I complete Stripe Checkout again
    Then this is treated exactly like a fresh activation (see "Activating a subscription via real Stripe Checkout")

  Scenario: Booking gate by subscription status
    Given my subscription status is "<status>"
    When I try to book an event
    Then booking is <outcome>

    Examples:
      | status           | outcome                                                 |
      | ACTIVE           | allowed                                                 |
      | CANCELLED_PENDING| allowed (access continues until period end)             |
      | PAST_DUE         | blocked with a "credits frozen, update payment" message |
      | INACTIVE         | blocked, redirected to checkout                         |
      | UNPAID           | blocked, redirected to checkout                         |

  Scenario: Admin manually adjusts a member's credits
    Given I am signed in as "ADMIN"
    When I adjust a member's credit balance by a non-zero amount with a description
    Then the member's credit balance is updated
    And an "ADMIN_ADJUST" ledger entry is recorded

  Scenario: Admin adjustment rejects a zero amount
    Given I am signed in as "ADMIN"
    When I attempt to adjust a member's credits by exactly 0
    Then the adjustment is rejected

  Scenario: Admin issues a manual credit refund (support gesture)
    Given I am signed in as "ADMIN"
    And a member has a legitimate service complaint not covered by normal booking cancellation
    When I issue a manual credit refund with a description
    Then the member's credit balance increases by the refunded amount
    And a "REFUND" ledger entry is recorded, decoupled from any booking-cancellation event

  Scenario: Admin freezes a member's account
    Given I am signed in as "ADMIN"
    And a member's subscription status is "ACTIVE"
    When I freeze that member
    Then their subscription status becomes "UNPAID"
    And their plan, payment method, and billing address are preserved
    And this is independent of and does not interfere with Stripe's own "PAST_DUE" status handling — the two causes/recoveries are tracked separately

  Scenario: Admin unfreezes a member's account
    Given I am signed in as "ADMIN"
    And a member's subscription status is "UNPAID"
    When I unfreeze that member
    Then their subscription status becomes "ACTIVE"

  Scenario: Admin creates a complimentary ticket
    Given I am signed in as "ADMIN"
    When I create a comp ticket for a member on a specific event
    Then a confirmed booking is created for that member through the same booking-transaction code path as a normal booking (capacity check included)
    But no credits are charged and no ledger entry is recorded for the charge
