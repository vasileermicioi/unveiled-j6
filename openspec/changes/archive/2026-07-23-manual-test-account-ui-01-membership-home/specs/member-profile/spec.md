## RENAMED Requirements

- FROM: `### Requirement: Profile identity and wallet`
- TO: `### Requirement: Profile identity and membership home`

## MODIFIED Requirements

### Requirement: Profile identity and membership home

The system SHALL provide an authenticated membership home surface at `/:locale/profile` styled like the membership marketing card (headline/status, vertical perk list, primary CTA). The primary CTA for members with a linked Stripe customer SHALL open the Stripe Customer Portal via SSR form POST to manage the subscription. Members without a portal-eligible subscription SHALL see a CTA to `/:locale/membership` checkout. The account home SHALL NOT present a credit-wallet balance panel or a “Refill credits” control. Personal details (first name, last name, email) SHALL remain editable on `/:locale/profile/details` via SSR form POST. Identity persistence SHALL update `public.users` profile/email fields through a package-level helper (not route-only logic). Email changes SHALL remain aligned with Neon Auth / Better Auth identity (no second user store).

#### Scenario: View membership home

- **WHEN** a signed-in member opens `/profile`
- **THEN** they see a membership-style account panel (not a credit-wallet balance / refill panel)

#### Scenario: Manage subscription from profile home

- **WHEN** a signed-in member with a Stripe customer id chooses to manage their subscription from `/profile`
- **THEN** they are redirected to the Stripe Customer Portal (SSR form POST)

#### Scenario: Inactive member starts membership from profile home

- **WHEN** a signed-in member without an active portal-eligible subscription opens `/profile` and chooses to start/reactivate membership
- **THEN** they are taken to `/:locale/membership`

#### Scenario: View and edit identity

- **WHEN** a signed-in member submits updated first name, last name, or email on `/profile/details`
- **THEN** the account profile reflects the new values

#### Scenario: Guest blocked from profile

- **WHEN** an unauthenticated visitor requests `/:locale/profile`
- **THEN** they are redirected to sign in

#### Scenario: Guest blocked from personal details

- **WHEN** an unauthenticated visitor requests `/:locale/profile/details`
- **THEN** they are redirected to sign in

### Requirement: Tabbed account navigation

The member account area SHALL expose **Membership** (home at `/:locale/profile`), Personal details, Vibes/Preferences, Billing, Change password, Export data, and Delete account as navigational tabs using the same link-tablist pattern as admin (`role="tablist"`, active tab via route). The previous Credit wallet tab label and wallet panel SHALL be removed. Each tab target SHALL remain an SSR page; identity and preference mutations SHALL continue as form POST on their dedicated routes.

#### Scenario: Account sections are tabs

- **WHEN** a signed-in member opens `/en/profile`
- **THEN** they see a horizontal tablist including Membership (not Credit wallet) and can open the other account destinations from tabs

#### Scenario: Deep links keep working

- **WHEN** a member opens `/en/profile/billing` (or another existing profile sub-route)
- **THEN** the billing tab is active and the billing page content is shown inside the account shell

#### Scenario: Billing nested routes keep billing tab active

- **WHEN** a member opens `/en/profile/billing/cancel`
- **THEN** the billing tab is active

### Requirement: Profile navigation entry points

The system SHALL expose account-section navigation as the profile tablist to preferences, **billing** (`/:locale/profile/billing` — implemented page, not a stub-only path), password change, **data export** (`/:locale/profile/data-export`), **account deletion** (`/:locale/profile/delete-account`), personal details (`/:locale/profile/details`), and membership home (`/:locale/profile`). Membership refill-from-wallet SHALL NOT be required. The member app shell SHALL provide a Profile control linking to `/:locale/profile` for signed-in USERs. A stacked Account link card on `/profile` SHALL NOT be required once tabs ship.

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
