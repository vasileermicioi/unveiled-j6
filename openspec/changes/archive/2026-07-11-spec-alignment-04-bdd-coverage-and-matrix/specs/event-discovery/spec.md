## ADDED Requirements

### Requirement: Public event detail without authentication
The system SHALL render `/events/:id` for guests without requiring login. Booking, waitlist, and save actions remain authentication-gated. Playwright SHALL prove this with a test titled exactly `Scenario: Guest can view public event detail without authentication` in `e2e/specs/event-discovery.spec.ts`.

#### Scenario: Guest can view public event detail without authentication
- **WHEN** a guest opens a valid upcoming event detail URL
- **THEN** event content renders without login and gated actions require authentication

### Requirement: Guest path to full browse
The system SHALL not expose a public full upcoming-events list equivalent to member `/events`. Guests reaching `/events` are redirected to sign in or signup and, after auth (and onboarding if incomplete), may use the member feed. Playwright SHALL prove the redirect path with a test titled exactly `Scenario: Guest path to full browse requires signup or login` in `e2e/specs/event-discovery.spec.ts`.

#### Scenario: Guest path to full browse requires signup or login
- **WHEN** a guest attempts to open `/events`
- **THEN** they are redirected to authentication and can use the member feed only after completing auth/onboarding as required

## MODIFIED Requirements

### Requirement: Guest and member discovery behaviors are specified in Gherkin
`docs/product/features/event-discovery.feature` SHALL specify guest Discover preview, public event detail (unauthenticated access to `/:locale/events/:id`), guest path to full browse via signup/login, and authenticated member feed/filter/saved/map behaviors aligned with `docs/product/sitemap/sitemap.md`. Guests SHALL NOT be specified as having a public full upcoming-events list equivalent to `/events`. Discover-to-browse navigation (auth CTA → member `/events`) SHALL be consistent with the sitemap and with `static-pages.feature` / user journeys. Shipped Playwright titles for in-scope guest scenarios SHALL match Gherkin `Scenario:` lines verbatim.

#### Scenario: Feature file matches public detail
- **WHEN** a reader opens `event-discovery.feature` in `docs/product/features/`
- **THEN** it includes scenarios for unauthenticated event detail access and Discover-to-browse navigation consistent with the sitemap

#### Scenario: Guest preview without public full feed
- **WHEN** a reader reviews guest scenarios in `event-discovery.feature`
- **THEN** guests are specified with Discover curated preview and public detail, not a public full `/events` feed

#### Scenario: Member feed and saved/map remain gated
- **WHEN** a reader reviews member scenarios in `event-discovery.feature`
- **THEN** member feed, filters, saved list, and map behaviors are specified as authenticated USER flows under `/events`, `/saved`, and `/events/map`

#### Scenario: Guest Scenario titles are covered in Playwright
- **WHEN** Phase 5.5 step 04 completes
- **THEN** `e2e/specs/event-discovery.spec.ts` includes verbatim titles for public discovery preview, guest public detail, and guest path to full browse (or the coverage matrix lists a named deferral)
