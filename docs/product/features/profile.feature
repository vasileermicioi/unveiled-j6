# Source: components/ProfileView.tsx, store.ts (updateAccountSettings, updateBillingInfo,
#         updateUserProfile).
#
# DECISIONS MADE FOR THE REWRITE:
#   - "Cancel Subscription" existed in the UI with no functional handler. DECIDED: implement it for
#     real — see credits-subscription.feature's "Cancelling a subscription" scenario for the full
#     mechanics (immediate CANCELLED_PENDING, access retained until period end).
#   - Account deletion and data export (GDPR) are new capabilities surfaced from this page — full
#     scenarios live in auth.feature since they're identity-lifecycle actions, not billing actions.
#   - Account IA uses admin-style navigational tabs (Membership, personal details, vibes, billing,
#     password, export, delete). Tabs render above PageSectionHeader; tablist, header rule, and
#     content card share the same column width. The previous stacked Account link card on /profile
#     is removed. Identity edits live on /profile/details; /profile is the membership manage home
#     (Stripe Customer Portal CTA when portal-eligible; membership checkout CTA when inactive).
#     There is no credit-wallet / refill account-home tab.

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

  Scenario: View membership home
    When I view my profile with a portal-eligible subscription
    Then I see a membership-style account panel with a manage-subscription control
    And I do not see a credit-wallet balance panel or refill control
    And the account tablist appears above the account page heading

  Scenario: Inactive member starts membership from profile home
    When I view my profile without an active portal-eligible subscription and choose to start membership
    Then I am taken to the membership checkout page
