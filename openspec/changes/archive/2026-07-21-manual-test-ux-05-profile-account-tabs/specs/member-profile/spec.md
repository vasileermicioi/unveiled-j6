## ADDED Requirements

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

## MODIFIED Requirements

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
