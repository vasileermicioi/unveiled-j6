## ADDED Requirements

### Requirement: Profile entry points for GDPR
The system SHALL expose navigation from the member profile area to data export and account deletion flows that resolve to working SSR pages (not stub-only 404 paths).

#### Scenario: Access export and deletion
- **WHEN** a member opens profile settings
- **THEN** they can reach data export and account deletion

## MODIFIED Requirements

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
