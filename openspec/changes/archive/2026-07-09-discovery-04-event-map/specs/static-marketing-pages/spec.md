## MODIFIED Requirements

### Requirement: Cookie consent banner

The application SHALL display a cookie consent banner on first visit offering accept or decline for non-essential cookies, persist the decision, and not re-prompt until the decision expires or storage is cleared. Accepting consent SHALL allow the event map island to load MapLibre GL JS and OpenStreetMap tiles. Declining (or lacking an accepted decision) SHALL replace the map with a static fallback and MUST NOT load MapLibre or third-party map tiles. Error tracking remains ungated (unchanged).

#### Scenario: Banner on first visit

- **WHEN** a guest loads any page with no prior consent decision stored
- **THEN** a cookie consent banner is visible with accept and decline actions

#### Scenario: Decision persisted

- **WHEN** a guest accepts or declines cookies
- **THEN** the banner is hidden on subsequent page loads until storage is cleared or expires

#### Scenario: Declining consent disables map tiles

- **WHEN** a user declines non-essential cookies and views a page that would show the event map
- **THEN** no MapLibre GL JS map island or OpenStreetMap tile requests are loaded
- **AND** a static fallback is shown instead
- **AND** the site remains fully usable

### Requirement: Automated browser coverage for static pages

Each Gherkin scenario in `docs/migration/features/static-pages.feature` SHALL have a Playwright test in `e2e/specs/static-pages.spec.ts` whose title matches the scenario line (including the `Scenario:` prefix). Tests SHALL use proximity-only selectors and default locale `de` unless the scenario requires bilingual coverage. Once the Phase 5 event map exists, the declining-consent map scenario SHALL assert against a real map surface (fallback shown, no tile requests) rather than a permanent Phase 5 skip — full assertion may land in `discovery-05-stories-e2e-release`.

#### Scenario: Marketing and legal flows are E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/static-pages.spec.ts`
- **THEN** discover home, how-it-works, FAQ, legacy `/discover` redirect, bilingual toggle, legal footer links, and cookie consent behaviors are asserted in a real browser

#### Scenario: Cookie first-visit isolation

- **WHEN** a static-pages cookie scenario requires a first visit
- **THEN** the test clears the `unveiled:cookie-consent` decision before asserting the banner

#### Scenario: Declining consent disables map embed (Phase 5)

- **WHEN** the event map UI exists and the user has declined non-essential cookies
- **THEN** the declining-consent map scenario asserts that the map embed is not loaded and a fallback is shown (implemented or updated in discovery step 05 E2E)
