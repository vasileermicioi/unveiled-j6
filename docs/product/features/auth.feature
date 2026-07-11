# Source: store.ts (login, signup, sendPasswordReset, logout, initAuthListener),
#         utils/formSchemas.ts (buildAuthSchema), firestore.rules (users/{userId}).
#
# DECISIONS MADE FOR THE REWRITE:
#   - The old app's `AuthView.tsx` (dead code) and non-distinct `SIGNUP` app-view are moot in the
#     rewrite — every auth screen is now its own real route (`/login`, `/signup`, etc. — see
#     sitemap/sitemap.md), so there's no "inline tab state vs. dead component" ambiguity to carry forward.
#   - Only email/password auth existed ("Google/Apple planned later," never built). DECIDED: add Google
#     OAuth via Neon Auth for this rewrite — low integration cost (configured directly in the Neon Auth
#     project settings), meaningfully reduces signup friction. Apple sign-in is not added (no strong
#     reason to prioritize it for a Berlin-only web product; revisit only if mobile-web Apple-ecosystem
#     signup friction becomes a measured problem).
#   - DECIDED (new scope, required for a real product, not in the old app at all): self-service account
#     deletion (GDPR right to erasure) and self-service data export (GDPR right to access/portability).
#     See the scenarios below and `extras/authorization-matrix.md`.

Feature: Authentication
  As a visitor
  I want to create an account, sign in, and recover my password
  So that I can access membership features appropriate to my role

  Background:
    Given the MVP personas are guest, member ("USER"), and admin ("ADMIN")
    And "PARTNER" accounts are post-MVP (provisioned only via portal-access flow when that ships)

  Scenario: Sign up as a new member
    Given I am not signed in
    When I submit the signup form with a valid email, a password of at least 6 characters, a first name, and a last name
    Then a new "USER" account is created
    And my account starts with 17 credits
    And my subscription status is "INACTIVE"
    And my onboarding is marked incomplete
    And I am signed in and redirected to onboarding

  Scenario Outline: Signup validation
    Given I am on the signup form
    When I submit with <field> set to "<value>"
    Then I see a validation error for <field>

    Examples:
      | field     | value            |
      | email     | not-an-email     |
      | password  | 12345            |
      | firstName |                  |
      | lastName  |                  |

  Scenario: Log in with valid credentials
    Given I have an existing account
    When I submit the login form with my correct email and password
    Then I am signed in
    And I am routed based on my role and onboarding state

  Scenario Outline: Post-login routing by role and state
    Given I have an existing account with role "<role>" and onboarding complete "<onboardingComplete>"
    When I successfully log in
    Then I am routed to "<destination>"

    Examples:
      | role  | onboardingComplete | destination      |
      | ADMIN | true                | app (admin view) |
      | USER  | false               | onboarding       |
      | USER  | true                | app (events)     |

  Scenario: Log in with invalid credentials
    Given I am on the login form
    When I submit an email/password combination that does not match any account
    Then I see an authentication error
    And I remain signed out

  Scenario: Log in without a password
    Given I am on the login form
    When I submit only an email with no password
    Then the request is rejected client-side before contacting the server

  Scenario: Request a password reset
    Given I am on the login form
    When I submit a valid email address for "forgot password"
    Then a password reset email is sent to that address

  Scenario: Request a password reset with no email
    Given I am on the "forgot password" form
    When I submit with an empty email field
    Then the request is rejected client-side

  Scenario: Log out
    Given I am signed in
    When I log out
    Then my session ends
    And I am redirected to the Discover home ("/:locale")
    And no further real-time data listeners remain active for my account

  Scenario: Route protection for authenticated-only areas
    Given I am not signed in
    When I try to visit a page that requires authentication (events feed, saved events, bookings, profile, admin)
    Then I am redirected to sign in (or Discover home with auth CTA)

  Scenario: Route protection by role
    Given I am signed in as a "USER"
    When I try to visit the admin area
    Then I am redirected away to the area appropriate for my role

  Scenario: Sign up or log in with Google
    Given I am not signed in
    When I authenticate via Google OAuth
    Then a "USER" account is created if this is my first time (same starter state as email/password signup: 17 credits, subscription "INACTIVE", onboarding incomplete), or I am signed into my existing account if the email already matches one
    And I am routed exactly as any other new/returning "USER" would be (onboarding if incomplete, events feed if complete)

  Scenario: Social login never creates a PARTNER or ADMIN account
    Given I authenticate via Google OAuth for the first time
    Then the account created is always role "USER"
    And "ADMIN" accounts remain exclusively provisioned out-of-band — never through self-service signup
    And "PARTNER" accounts remain exclusively provisioned by admin portal-access (post-MVP) — never through self-service signup

  Scenario: Request a data export
    Given I am signed in
    When I request a data export from my profile settings
    Then I receive a downloadable summary of my profile, bookings, and credit ledger history
    And the export is generated on demand (the underlying data volume is small enough not to need an asynchronous/batched job)

  Scenario: Request account deletion
    Given I am signed in
    When I request account deletion and confirm the action
    Then my personally identifiable profile data (name, email, preferences) is anonymized
    And transactional records legally required for retention (booking and credit-ledger history, for German accounting/tax retention purposes) are kept in anonymized form rather than deleted outright
    And I am signed out and can no longer log in with my previous credentials

  Scenario: Account deletion is distinct from subscription cancellation
    Given I have an active subscription
    When I request account deletion (rather than just cancelling my subscription)
    Then my subscription is also cancelled as part of the same action (see credits-subscription.feature)
    But cancelling a subscription alone does not delete or anonymize my account — these are two separate, independently available actions

  Scenario: Admin can process account deletion on a member's behalf
    Given I am signed in as "ADMIN"
    And a member has requested deletion via a support channel (e.g. email) rather than self-service
    When I process their deletion request
    Then the same anonymization behavior applies as a self-service deletion
