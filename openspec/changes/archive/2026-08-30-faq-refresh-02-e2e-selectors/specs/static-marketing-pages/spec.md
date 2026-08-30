## MODIFIED Requirements

### Requirement: Automated browser coverage for static pages

Each Gherkin scenario in `docs/product/features/static-pages.feature` SHALL have a Playwright test in `e2e/specs/static-pages.spec.ts` whose title matches the scenario line (including the `Scenario:` prefix). Tests SHALL use proximity-only selectors and default locale `de` unless the scenario requires bilingual coverage. Coverage SHALL include Discover preview→public detail and Discover CTA→auth→member `/events` in addition to home, how-it-works, FAQ, legacy `/discover`, bilingual, legal, and cookie scenarios. The declining-consent map scenario SHALL assert against a real map surface (consent fallback shown, no OpenStreetMap tile requests) on a public event detail page that mounts `EventMap`. The FAQ scenario SHALL additionally verify, against the refreshed Q&A copy and in both locales, the support header (eyebrow, H1, support-email link), two representative questions from the refreshed item set, the second item's answer text, and single-expand accordion behavior (opening item 2 collapses item 1) — using role/proximity selectors only, with no assertions coupling to the pre-refresh copy.

#### Scenario: Marketing and legal flows are E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/static-pages.spec.ts`
- **THEN** discover home, Discover preview→detail, Discover CTA→auth→`/events`, how-it-works, FAQ, legacy `/discover` redirect, bilingual toggle, legal footer links, and cookie consent behaviors are asserted in a real browser (or listed as named deferrals in the coverage matrix)

#### Scenario: Cookie first-visit isolation

- **WHEN** a static-pages cookie scenario requires a first visit
- **THEN** the test clears the `unveiled:cookie-consent` decision before asserting the banner

#### Scenario: Declining consent disables map embed

- **WHEN** the user has declined non-essential cookies and views a public event detail page with coordinates
- **THEN** the map embed is not loaded, a static fallback (including an external OpenStreetMap link) is shown, and no OpenStreetMap tile requests are made

#### Scenario: FAQ scenario passes on refreshed copy

- **WHEN** the Playwright `Scenario: FAQ` test runs against the refreshed FAQ content (de locale run with bilingual assertions covering en copy)
- **THEN** it passes, asserting item 1 ("Wie funktioniert die unveiled Mitgliedschaft?" / "How does the unveiled membership work?") and item 2 ("Wofür kann ich meine Credits nutzen?" / "What can I use my Credits for?") as expandable buttons, item 2's answer visible after clicking it, and item 1's answer no longer visible (single-expand)
