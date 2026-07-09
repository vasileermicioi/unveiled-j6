## ADDED Requirements

### Requirement: Automated coverage for discovery scenarios

The system SHALL maintain Ladle stories for member feed filter, saved-events, and EventMap visual states described in `ui/ui-component-map.md`, and SHALL maintain Playwright tests in `e2e/specs/event-discovery.spec.ts` whose titles match each `Scenario:` line in `features/event-discovery.feature` verbatim, using proximity/layout selectors only.

#### Scenario: E2E parity with Gherkin

- **WHEN** `bun run test:e2e` runs
- **THEN** every scenario in `event-discovery.feature` has a passing Playwright test with a matching title and no unmarked skips

#### Scenario: Discovery Ladle stories render

- **WHEN** a developer opens discovery stories via `bun run stories`
- **THEN** feed filter states (default, filters applied, empty/no-results), saved-events empty and populated layouts, and EventMap states (loading, error, markers, and consent-fallback when storyable) each render without requiring a live member session or database

#### Scenario: Selector policy is preserved

- **WHEN** an implementer writes or updates `event-discovery.spec.ts`
- **THEN** tests use only `getByRole`, `getByLabel`, `getByText`, `filter({ has/hasText })`, parent walks, and `nth()`
- **AND** production markup does not gain `data-testid`, CSS-class, or `#id` selectors for tests
- **AND** inaccessible controls are fixed with real labels rather than weakening the policy

#### Scenario: Booking remains unasserted as a completed purchase

- **WHEN** a discovery E2E scenario encounters a book/unlock CTA
- **THEN** the test asserts visible label and/or href (membership or event detail) only
- **AND** the test does not require Stripe checkout or a booking POST to pass

### Requirement: Phase 5 release documentation

Staging deployment documentation SHALL describe how to demo member discovery (filter, save, map) and SHALL state that booking remains Phase 6.

#### Scenario: Operator follows Phase 5 demo script

- **WHEN** an operator reads the Phase 5 section of `apps/web/DEPLOYMENT.md`
- **THEN** routes for feed, saved, and map are listed
- **AND** the client demo script covers filter → save → map (and opening detail)
- **AND** the docs state that booking/Stripe remains Phase 6
- **AND** map consent and any CSP/tile notes needed for staging are documented or cross-linked
