## ADDED Requirements

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

The system SHALL expose navigation from `/profile` to preferences, membership refill, billing (stub path for a later step), and password change. The system MAY expose entry links to GDPR data-export and delete-account paths without implementing those handlers in this change. The member app shell SHALL provide a Profile control linking to `/:locale/profile` for signed-in USERs.

#### Scenario: Profile links to preferences and billing stub

- **WHEN** a member views `/profile`
- **THEN** they can navigate to `/profile/preferences` and to `/profile/billing`

#### Scenario: Navbar profile entry

- **WHEN** a signed-in USER views the app shell
- **THEN** a Profile control links to `/:locale/profile`
