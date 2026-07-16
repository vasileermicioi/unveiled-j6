# Static and marketing pages for the production MVP.
#
# Aligns with docs/product/sitemap/sitemap.md: Discover IS locale home (`/:locale`);
# legacy `/discover` 301s home. Legal pages + cookie consent are required for DE ops.
# Error tracking (Sentry) is strictly necessary (no PII / no session replay) — not gated.
# Event map third-party tiles ARE gated behind consent.
#
# Scenario titles prefer shipped e2e/specs/static-pages.spec.ts where behavior matches.

Feature: Static and Marketing Pages
  As a visitor or member
  I want informational and marketing pages
  So that I can understand the product before/while using it

  Scenario: Discover is the home page
    Given I am not signed in
    When I visit the locale home ("/:locale")
    Then I see the Discover experience: hero, value proposition, and curated upcoming event preview
    And I see links to log in and sign up
    And I see navigation to "How it works", FAQ, and Membership via the footer (not the sticky header)

  Scenario: Discover preview links to public event detail
    Given I am not signed in
    And Discover shows at least one upcoming event card
    When I follow the event card CTA ("See details" / equivalent)
    Then I land on the public event detail page ("/events/:id") without being forced to log in

  Scenario: Discover CTA path to the full member events feed
    Given I am not signed in
    When I follow the primary CTA to browse all events (signup or login)
    Then I am taken to signup or login
    And after authentication (and onboarding if incomplete) I land on the member events feed ("/events")
    And guests never receive a public full upcoming-events list equivalent to "/events"

  Scenario: How it works
    When I visit the "How it works" page
    Then I see a 3-step explainer of the membership process and its value points

  Scenario: FAQ
    When I visit the FAQ page
    Then I see a support header with a contact email
    And I see an accordion of frequently asked questions (DE/EN)
    And only one question can be expanded at a time

  Scenario: Legacy /discover redirects to locale home
    When I visit "/:locale/discover"
    Then I am redirected (301) to "/:locale"
    And I see the Discover home experience

  Scenario: Bilingual content
    Given all static and marketing content exists in both German and English
    When I toggle the site language
    Then the page content switches language accordingly

  Scenario: Legal pages exist and are linked from the footer
    When I visit the Impressum, Privacy Policy, or Terms of Service page
    Then I see the corresponding legal content in my selected language
    And each is linked from the site footer on every page

  Scenario: Cookie consent banner on first visit
    Given this is my first visit (no consent decision stored yet)
    When I load any page
    Then I see a cookie consent banner offering to accept or decline non-essential cookies
    And my decision is stored and not asked again until it expires or I clear it

  Scenario: Declining consent disables the map embed
    Given I have declined non-essential cookies
    When I view a page that would normally show the event map (MapLibre GL JS + OpenStreetMap tiles)
    Then a static placeholder is shown instead, with a link to view the location externally

  Scenario: Error tracking is not gated behind consent
    Given I have declined non-essential cookies
    Then error tracking (Sentry) still operates, since it is configured to collect no PII and is treated as strictly necessary for site reliability
