## ADDED Requirements

### Requirement: Subtitles scenarios covered by Playwright

Admin Subtitles checkbox/select behavior and public detail subtitles display SHALL have Playwright coverage using proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`, with `test()` titles matching Gherkin `Scenario:` titles from `docs/product/features/admin-events.feature` and/or `event-discovery.feature`, **or** a named coverage-matrix deferral (never “UI not built”). Catalog domain validation for the subtitle invariant SHALL be covered by unit tests in `@unveiled/db` (or equivalent package tests).

#### Scenario: Admin e2e covers subtitles checkbox and language

- **WHEN** this change is marked released
- **THEN** `e2e/specs/admin-events.spec.ts` (or a named deferral in `docs/product/testing/coverage-matrix.md`) covers saving an event with Subtitles checked and a language selected

#### Scenario: Public e2e or deferral for subtitles display

- **WHEN** this change is marked released
- **THEN** Playwright asserts public detail shows the subtitles row for a subtitled event (proximity selectors), or `coverage-matrix.md` records a named deferral for that scenario
