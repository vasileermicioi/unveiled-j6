# Member Profile

Authenticated member account home: identity and credit wallet, cultural preferences (“Vibes”) editor, password-change entry via Neon Auth / Better Auth UI, profile billing (Customer Portal + cancel), and profile navigation entry points.

## Requirements

### Requirement: Profile identity and wallet

The system SHALL provide an authenticated `/:locale/profile` page where members can view their current credit balance and update first name, last name, and email via SSR form POST. Identity persistence SHALL update `public.users` profile/email fields through a package-level helper (not route-only logic). Email changes SHALL remain aligned with Neon Auth / Better Auth identity (no second user store).

#### Scenario: View and edit identity

- **WHEN** a signed-in member submits updated first name, last name, or email on `/profile`
- **THEN** the account profile reflects the new values

#### Scenario: View credit wallet

- **WHEN** a signed-in member opens `/profile`
- **THEN** their current credit balance is shown

#### Scenario: Refill credits

- **WHEN** a signed-in member chooses to refill credits from `/profile`
- **THEN** they are taken to the membership checkout page (`/:locale/membership`)

#### Scenario: Guest blocked from profile

- **WHEN** an unauthenticated visitor requests `/:locale/profile`
- **THEN** they are redirected to sign in

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests, moods, districts, travel radius (`max_distance`), timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists. Persistence SHALL merge into `users.profile`, set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates preference fields and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile

#### Scenario: Preference save preserves onboarding state

- **WHEN** an onboarded member saves cultural preferences
- **THEN** `behavior.onboarding_step` and `profile.onboarding_complete` are unchanged
- **AND** `behavior.preferences_updated_at` is updated

#### Scenario: Invalid preference values rejected

- **WHEN** a preference payload contains a value outside the onboarding allowlists or an out-of-range travel radius
- **THEN** the update fails validation without mutating preference fields

### Requirement: Password change entry

The system SHALL allow members to change their password through the Neon Auth / Better Auth UI flow reachable from profile (for example `/:locale/profile/security`), not via a custom application password database.

#### Scenario: Change password

- **WHEN** a member completes the auth password-change flow from the profile entry point
- **THEN** their password is updated by the auth provider

### Requirement: Profile navigation entry points

The system SHALL expose navigation from `/profile` to preferences, membership refill, **billing** (`/:locale/profile/billing` — implemented page, not a stub-only path), password change, **data export** (`/:locale/profile/data-export`), and **account deletion** (`/:locale/profile/delete-account`). The member app shell SHALL provide a Profile control linking to `/:locale/profile` for signed-in USERs.

#### Scenario: Profile links to preferences and billing

- **WHEN** a member views `/profile`
- **THEN** they can navigate to `/profile/preferences` and to `/profile/billing`

#### Scenario: Profile links to GDPR flows

- **WHEN** a member views `/profile`
- **THEN** they can navigate to `/profile/data-export` and to `/profile/delete-account`

#### Scenario: Navbar profile entry

- **WHEN** a signed-in USER views the app shell
- **THEN** a Profile control links to `/:locale/profile`

### Requirement: Profile entry points for GDPR

The system SHALL expose navigation from the member profile area to data export and account deletion flows that resolve to working SSR pages (not stub-only 404 paths).

#### Scenario: Access export and deletion

- **WHEN** a member opens profile settings
- **THEN** they can reach data export and account deletion

### Requirement: Profile billing page

The system SHALL provide authenticated `/:locale/profile/billing` showing current plan (Basic Berlin / `BASIC_BERLIN`), subscription status, period end when known, and payment method / billing address summary when available on the subscription row, with CTAs for Stripe Customer Portal and cancel subscription. PAST_DUE members SHALL see recovery messaging plus the portal CTA. INACTIVE members SHALL see a reactivation CTA to membership Checkout. Mutations (open portal, cancel) SHALL be SSR form POSTs. Business logic for Stripe session creation and cancel-at-period-end SHALL live in `@unveiled/billing`, not only in route files.

#### Scenario: View billing information

- **WHEN** a member opens `/profile/billing`
- **THEN** they see plan and billing summary for their subscription

#### Scenario: Cancel subscription

- **WHEN** a member chooses cancel on the billing flow
- **THEN** cancellation is scheduled for period end per credits-subscription mechanics

#### Scenario: Guest blocked from billing

- **WHEN** an unauthenticated visitor requests `/:locale/profile/billing`
- **THEN** they are redirected to sign in

#### Scenario: Past due recovery CTA

- **WHEN** a member with `PAST_DUE` status opens `/profile/billing`
- **THEN** they see messaging to update payment and a Customer Portal CTA

#### Scenario: Inactive reactivation CTA

- **WHEN** a member with `INACTIVE` status opens `/profile/billing`
- **THEN** they can navigate to `/:locale/membership` to reactivate via Checkout

### Requirement: Phase 7 profile Playwright and Ladle coverage

The system SHALL ship Playwright coverage at `e2e/specs/profile.spec.ts` for in-scope `profile.feature` scenarios (identity, password-change entry, preferences, wallet, refill, billing view/update/cancel entry points, and GDPR entry points) using verbatim Scenario titles and proximity selectors. Ladle SHALL include stories for profile billing, preferences, and GDPR export/delete confirm compositions (and related profile pages as needed). `Scenario: Access account deletion and data export` SHALL pass by asserting reachable export/delete entry points (and MAY assert page headings after navigation). Full export download and deletion mechanics MAY remain covered primarily in `auth.spec.ts`. Customer Portal deep hosted flows MAY assert SSR redirect / opt-in policy documented in `e2e/README.md` rather than requiring full Stripe Portal automation in default CI.

#### Scenario: Profile spec covers shipped surfaces

- **WHEN** `bun run test:e2e` executes `e2e/specs/profile.spec.ts`
- **THEN** identity, preferences, wallet, refill, billing entry, and GDPR entry scenarios pass or record named env skips only

#### Scenario: Profile Ladle includes GDPR compositions

- **WHEN** Ladle stories for profile are reviewed after gdpr-rights step 03
- **THEN** export/delete confirm states are present alongside billing/preferences stories

#### Scenario: GDPR entry is not Phase-8 deferred

- **WHEN** coverage matrix lists `Access account deletion and data export` after this change
- **THEN** status is `pass` (or env skip) — not deferred for missing GDPR UI

#### Scenario: Coverage matrix profile rows leave unshipped

- **WHEN** Phase 7 closes
- **THEN** `profile.feature` rows are `pass`, `skip`, or `deferred` — not `unshipped`

### Requirement: GDPR profile Ladle coverage

The system SHALL provide Ladle stories for member GDPR compositions `DataExportPage` and `DeleteAccountPage` (confirm + error where applicable) under `apps/web/app/components/profile/`, and for `AdminDeleteAccountForm` confirm/error under `apps/web/app/components/admin/`.

#### Scenario: Export and delete confirm stories exist

- **WHEN** an implementer opens Ladle after this change
- **THEN** DataExport, DeleteAccount confirm/error, and AdminDeleteAccount confirm/error stories load
