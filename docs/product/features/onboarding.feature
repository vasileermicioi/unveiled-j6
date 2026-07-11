# Source: components/Onboarding.tsx, store.ts (completeOnboarding, setView guards).
#
# DECISIONS MADE FOR THE REWRITE:
#   - Preferences collected here are stored but not used to rank/filter the feed today. DECIDED: keep
#     onboarding as profile capture for v1 (see event-discovery.feature and product/vision-and-domains.md
#     non-goals) — the data is valuable for future personalization and for admin's member "intel" view
#     (admin-users.feature), so it's still worth collecting even without ranking built yet.
#   - Onboarding completion routes to checkout (paywall), not to the app. DECIDED: keep this — it
#     matches the business model (preferences are captured before asking for payment, which is a
#     reasonable order: invest the user in their profile before the ask).

Feature: Onboarding
  As a newly signed-up member
  I want to set my cultural preferences
  So that the platform can (eventually) tailor recommendations to me

  Background:
    Given I am signed in as a "USER"
    And my onboarding is not yet complete

  Scenario: Onboarding is required before using the app
    When I try to access the events feed
    Then I am redirected to the onboarding wizard

  Scenario: Non-USER roles skip onboarding
    Given I am signed in as "ADMIN" (or a post-MVP "PARTNER" account)
    When the app loads
    Then I am never shown the onboarding wizard

  Scenario: Already-onboarded users skip onboarding
    Given my onboarding is already marked complete
    When I try to access the onboarding wizard directly
    Then I am redirected to the events feed instead

  Scenario: Step 1 — age group (skippable)
    Given I am on onboarding step 1
    When I choose one age group via Select from "18-25", "26-35", "36-50", or "50+"
    Then my selection is stored
    But I may also skip this step without selecting an age group

  Scenario: Step 2 — interests and moods
    Given I am on onboarding step 2
    Then I can multi-select interests via Select from: Theater, Kino, Museum, Ausstellung, Konzert, Talk/Lesung, Comedy, Tanz/Performance
    And I can multi-select moods via Select from: Leicht, Experimentell, Klassisch, Politisch, Fam

  Scenario: Step 3 — districts and travel radius
    Given I am on onboarding step 3
    Then I can multi-select districts via Select from: Mitte, X-Berg, P-Berg, Charlottenburg, Wedding, F-Hain, Schöneberg
    And I can set a maximum travel distance between 1 and 25 km

  Scenario: Step 4 — timing, days, languages, accessibility
    Given I am on onboarding step 4
    Then I can choose preferred timing via Select from: After Work, Weekend, Day
    And I can multi-select preferred days Monday through Sunday via Select
    And I can choose preferred languages via Select from: DE, EN, Non-Verbal
    And I can choose an accessibility requirement via Select

  Scenario: Completing onboarding
    Given I have completed all onboarding steps
    When I finish the wizard
    Then my profile preferences are saved
    And my onboarding is marked complete
    And I am routed to the membership checkout page
