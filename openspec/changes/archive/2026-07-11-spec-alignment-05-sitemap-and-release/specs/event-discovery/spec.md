## MODIFIED Requirements

### Requirement: Public event detail without authentication

The system SHALL render `/events/:id` for guests without requiring login. Booking, waitlist, and save actions remain authentication-gated. Playwright SHALL prove this with a test titled exactly `Scenario: Guest can view public event detail without authentication` in `e2e/specs/event-discovery.spec.ts`. Phase 5.5 release spot-checks SHALL reconfirm public access on staging (or document already-aligned).

#### Scenario: Guest can view public event detail without authentication

- **WHEN** a guest opens a valid upcoming event detail URL
- **THEN** event content renders without login and gated actions require authentication

### Requirement: Guest path to full browse

The system SHALL not expose a public full upcoming-events list equivalent to member `/events`. Guests reaching `/events` are redirected to sign in or signup and, after auth (and onboarding if incomplete), may use the member feed. Playwright SHALL prove the redirect path with a test titled exactly `Scenario: Guest path to full browse requires signup or login` in `e2e/specs/event-discovery.spec.ts`. Phase 5.5 release spot-checks SHALL reconfirm the guest gate on staging (or document already-aligned).

#### Scenario: Guest path to full browse requires signup or login

- **WHEN** a guest attempts to open `/events`
- **THEN** they are redirected to authentication and can use the member feed only after completing auth/onboarding as required
