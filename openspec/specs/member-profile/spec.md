# Member Profile

Authenticated member account home: tabbed credit wallet and personal details, cultural preferences (“Vibes”) editor, password-change entry via Neon Auth / Better Auth UI, profile billing (Customer Portal + cancel), and profile tab navigation.

## Requirements

### Requirement: Profile identity and wallet

The system SHALL provide an authenticated credit-wallet surface at `/:locale/profile` where members can view their current credit balance and refill via membership. Personal details (first name, last name, email) SHALL be editable on a dedicated account tab route `/:locale/profile/details` via SSR form POST. Identity persistence SHALL update `public.users` profile/email fields through a package-level helper (not route-only logic). Email changes SHALL remain aligned with Neon Auth / Better Auth identity (no second user store).

#### Scenario: View and edit identity

- **WHEN** a signed-in member submits updated first name, last name, or email on `/profile/details`
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

#### Scenario: Guest blocked from personal details

- **WHEN** an unauthenticated visitor requests `/:locale/profile/details`
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

The system SHALL expose account-section navigation as the profile tablist to preferences, **billing** (`/:locale/profile/billing` — implemented page, not a stub-only path), password change, **data export** (`/:locale/profile/data-export`), **account deletion** (`/:locale/profile/delete-account`), and personal details (`/:locale/profile/details`), plus membership refill from the wallet tab. The member app shell SHALL provide a Profile control linking to `/:locale/profile` for signed-in USERs. A stacked Account link card on `/profile` SHALL NOT be required once tabs ship.

#### Scenario: Profile links to preferences and billing

- **WHEN** a member views `/profile`
- **THEN** they can navigate via tabs to `/profile/preferences` and to `/profile/billing`

#### Scenario: Profile links to GDPR flows

- **WHEN** a member views `/profile`
- **THEN** they can navigate via tabs to `/profile/data-export` and to `/profile/delete-account`

#### Scenario: Profile links to personal details

- **WHEN** a member views `/profile`
- **THEN** they can navigate via tabs to `/profile/details`

#### Scenario: Navbar profile entry

- **WHEN** a signed-in USER views the app shell
- **THEN** a Profile control links to `/:locale/profile`

### Requirement: Tabbed account navigation

The member account area SHALL expose Credit wallet, Personal details, Vibes/Preferences, Billing, Change password, Export data, and Delete account as navigational tabs using the same link-tablist pattern as admin (`role="tablist"`, active tab via route). The previous stacked Account link card listing those destinations SHALL be removed once tabs ship. Each tab target SHALL remain an SSR page; identity and preference mutations SHALL continue as form POST on their dedicated routes.

#### Scenario: Account sections are tabs

- **WHEN** a signed-in member opens `/en/profile`
- **THEN** they see a horizontal tablist for account sections and can open Personal details, Vibes/Preferences, Billing, and the other account destinations from tabs instead of a stacked link card

#### Scenario: Deep links keep working

- **WHEN** a member opens `/en/profile/billing` (or another existing profile sub-route)
- **THEN** the billing tab is active and the billing page content is shown inside the account shell

#### Scenario: Billing nested routes keep billing tab active

- **WHEN** a member opens `/en/profile/billing/cancel`
- **THEN** the billing tab is active

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

### Requirement: Profile preferences use native localized controls
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same native HTML form controls and DE/EN option-label contract as onboarding preference steps. Persistence, allowlists, and SSR form POST behavior remain unchanged.

#### Scenario: Profile vibes editor shows native checkboxes
- **WHEN** a signed-in member opens `/profile/preferences`
- **THEN** multi-value preference fields render as native checkboxes with visible labels
- **AND** travel radius uses a native number input or native select
- **AND** accessibility uses a native checkbox with a short option label under a section title

#### Scenario: Profile preference options follow locale
- **WHEN** a member views `/de/profile/preferences`
- **THEN** option labels are German according to onboarding locale maps
- **AND** under `/en/profile/preferences` the same options are English

### Requirement: Profile accessibility section shares onboarding chrome
The cultural preferences editor at `/:locale/profile/preferences` SHALL present accessibility with the same section-label + options layout and shared copy keys as onboarding step 4 (locale section title + short option chip). The persisted value SHALL remain a boolean posted as `accessibility`.

#### Scenario: Profile preferences accessibility mirrors Languages
- **WHEN** a signed-in member views `/profile/preferences`
- **THEN** accessibility has a section title above its checkbox option, parallel to the Languages block
- **AND** the option label is the short locale string (not the former full-question chip alone)

### Requirement: Profile hangout labels share onboarding district maps
The cultural preferences editor at `/:locale/profile/preferences` SHALL render hangout (district) option labels via the same `getDistrictLabel` locale maps as onboarding. German UI SHALL show Berlin shorthand for `X-Berg`, `P-Berg`, and `F-Hain`; English UI SHALL show expanded district names. Stored values SHALL remain allowlist keys.

#### Scenario: Profile preferences hangout chips follow locale
- **WHEN** a member views `/en/profile/preferences`
- **THEN** hangout options use expanded labels (e.g. Kreuzberg)
- **AND** under `/de/profile/preferences` the X-Berg, P-Berg, and F-Hain options show Berlin shorthand

### Requirement: Account page section header
Member account pages under `/:locale/profile*` SHALL use the shared `PageSectionHeader` pattern (eyebrow + headline) used by other member surfaces such as Saved and My Tickets, instead of a standalone heading plus muted subtitle-only intro. Page-level muted subtitles under the title SHALL NOT be shown; essential instructional copy for destructive or GDPR flows MAY remain in card body content below the header.

#### Scenario: Profile header matches member app chrome
- **WHEN** a signed-in member opens `/en/profile`
- **THEN** the page intro uses the same eyebrow + headline header component pattern as `/en/saved`
- **AND** a muted subtitle line is not shown directly under the page title

#### Scenario: Account subpages share PageSectionHeader
- **WHEN** a signed-in member opens `/en/profile/details`, `/en/profile/preferences`, `/en/profile/billing`, `/en/profile/security`, `/en/profile/data-export`, or `/en/profile/delete-account`
- **THEN** each page intro uses `PageSectionHeader` with a localized eyebrow and headline
