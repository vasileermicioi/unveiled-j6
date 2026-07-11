# Source: components/ProfileView.tsx, store.ts (updateAccountSettings, updateBillingInfo,
#         updateUserProfile).
#
# DECISIONS MADE FOR THE REWRITE:
#   - "Cancel Subscription" existed in the UI with no functional handler. DECIDED: implement it for
#     real — see credits-subscription.feature's "Cancelling a subscription" scenario for the full
#     mechanics (immediate CANCELLED_PENDING, access retained until period end).
#   - Account deletion and data export (GDPR) are new capabilities surfaced from this page — full
#     scenarios live in auth.feature since they're identity-lifecycle actions, not billing actions.

Feature: Member Profile
  As a member
  I want to manage my account identity, billing, and preferences
  So that my information stays accurate and I can control my membership

  Background:
    Given I am signed in as "USER"

  Scenario: View and edit identity
    When I update my first name, last name, or email
    Then my account is updated with the new values

  Scenario: Change password
    When I set a new password
    Then my password is updated

  Scenario: View billing information
    When I open my billing section
    Then I see my current plan, payment method, and billing address

  Scenario: Update billing information
    When I change my payment method or billing address
    Then the changes are saved

  Scenario: Cancel subscription
    When I choose to cancel my subscription
    Then my subscription is scheduled for cancellation at the end of the current period (full mechanics in credits-subscription.feature)

  Scenario: Access account deletion and data export
    When I open my account settings
    Then I can request a data export or request full account deletion (full mechanics in auth.feature)

  Scenario: Edit cultural preferences ("Vibes")
    When I update my interests, moods, districts, travel radius, timing, preferred days, languages, or accessibility needs
    Then my profile preferences are saved

  Scenario: View credit wallet
    When I view my profile
    Then I see my current credit balance

  Scenario: Refill credits
    When I choose to refill my credits
    Then I am taken to the membership checkout page
