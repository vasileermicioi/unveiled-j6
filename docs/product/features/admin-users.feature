# Source: components/AdminPanel.tsx (Users / "Membership HQ" tab), store.ts (listUsers,
#         adjustUserCredits, toggleUserFreeze, createAdminTicket).
#
# DECIDED (unchanged from earlier project guidance): no `/admin/users/new` — member accounts remain
# exclusively self-service via signup (email/password, see auth.feature); admin never
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
    Then I see one Member column (display name linked to member detail plus email), role, subscription status, credit balance, booking count, event-open count, and Created registration date sorted by name, then email by default

  Scenario: Search members
    When I search by name, email, role, or subscription status (including no-subscription) via the filter bar, or by credits/bookings/event-opens min/max and/or created from/to range via URL query params
    Then the list filters to matching members and preserves filters across sort and pagination

  Scenario: View a member's collapsed summary
    Given I am viewing the member list
    Then each row shows one Member cell (name link plus email line), role, subscription status, credit balance, booking count, event-open count, and Created date

  Scenario: Member rows show combined name and email
    Given I am viewing the member list
    Then each row shows one Member cell with the display-name link on line one and the email on line two

  Scenario: Created column shows registration date
    Given I am viewing the member list
    Then each row shows the Created registration date as a Europe/Berlin calendar day

  Scenario: Sort members via header links
    When I activate a data-column header sort link
    Then rows reorder by that column and direction (same column toggles direction; a new column uses member/role/subscription to asc and credits/bookings/event-opens/created to desc) with active filters preserved

  Scenario: Filter members by subscription
    When I filter by subscription status (including no-subscription)
    Then the list shows only matching members

  Scenario: Filter members by numeric range
    When I list members with credits, booking-count, or event-open-count min/max URL query params
    Then only members whose value falls inside the inclusive range are returned

  Scenario: Filter members by created date range
    When I list members with created from/to registration date URL query params
    Then only members registered within the Europe/Berlin calendar-day bounds are returned

  Scenario: Sort and filter compose through pagination
    When I filter by subscription and sort by Created desc, then move to page 2
    Then page 2 keeps the same filter and sort with correctly clamped results

  Scenario: Reset filters
    When I activate the reset-filters link
    Then the list returns to the unfiltered default sort with page reset

  Scenario: Expand a member's detail / "intel" panel
    When I expand a member's row
    Then I see their preferences (interests, moods, location as country/city/zip, timing, days, languages, age group, accessibility)
    And when legacy max_distance is set I see travel distance in km (remnant intel; not actively collected)
    And when max_distance is null I do not see travel distance / radius as a preference row
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
