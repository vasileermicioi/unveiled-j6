## ADDED Requirements

### Requirement: Automated browser coverage for static pages

Each Gherkin scenario in `docs/migration/features/static-pages.feature` SHALL have a Playwright test in `e2e/specs/static-pages.spec.ts` whose title matches the scenario line (including the `Scenario:` prefix). Tests SHALL use proximity-only selectors and default locale `de` unless the scenario requires bilingual coverage.

#### Scenario: Marketing and legal flows are E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/static-pages.spec.ts`
- **THEN** landing, how-it-works, FAQ, discover preview, bilingual toggle, legal footer links, and cookie consent behaviors are asserted in a real browser

#### Scenario: Cookie first-visit isolation

- **WHEN** a static-pages cookie scenario requires a first visit
- **THEN** the test clears the `unveiled:cookie-consent` decision before asserting the banner

#### Scenario: Map placeholder when map UI is absent

- **WHEN** no map slot exists on seeded pages yet
- **THEN** the declining-consent map scenario still exists as a named test and either asserts consent decline with a Phase 5 deferral comment or uses an explicit skip reason naming Phase 5
