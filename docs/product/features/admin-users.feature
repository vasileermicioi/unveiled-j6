# Source: components/AdminPanel.tsx (Users / "Membership HQ" tab), store.ts (listUsers,
#         adjustUserCredits, toggleUserFreeze, createAdminTicket).
#
# DECIDED (unchanged from earlier project guidance): no `/admin/users/new` — member accounts remain
# exclusively self-service via signup (email/password or Google, see auth.feature); admin never
# creates a member account directly. Admin DOES gain a real account-deletion capability as part of the
# GDPR work in auth.feature ("Admin can process account deletion on a member's behalf") — this is a
# support-assisted version of the member's own self-service deletion, not a general-purpose delete.

Feature: Admin — Member Management ("Membership HQ")
  As an admin
  I want to search, inspect, and manage member accounts
  So that I can support members and keep the business running smoothly

  Background:
    Given I am signed in as "ADMIN"

  Scenario: List all members
    When I open the members list
    Then I see all member accounts sorted by name, then email

  Scenario: Search members
    When I search by name, email, or role
    Then the list filters to matching members

  Scenario: View a member's collapsed summary
    Given I am viewing the member list
    Then each row shows role, subscription status, credit balance, booking count, and event-open count

  Scenario: Expand a member's detail / "intel" panel
    When I expand a member's row
    Then I see their preferences (interests, moods, districts, timing, days, languages, age group, radius, accessibility)
    And I see their history (bookings, waitlist entries, saved events, session count)
    And I see behavior analytics (event opens, filter applies, saves/unsaves, last view, last seen, last booked/waitlisted event, recently viewed events)

  Scenario: Adjust a member's credits from their detail panel
    When I adjust a member's credit balance with a reason
    Then the change is applied and recorded in the ledger

  Scenario: Freeze or unfreeze a member from their detail panel
    When I toggle a member's frozen status
    Then their subscription status updates accordingly

  Scenario: Issue a complimentary ticket to a member
    When I create a comp ticket for a member on a chosen event
    Then a confirmed booking is created for them at no credit cost
