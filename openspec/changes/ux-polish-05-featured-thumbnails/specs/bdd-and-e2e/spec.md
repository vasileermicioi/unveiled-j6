## ADDED Requirements

### Requirement: Featured thumbnail e2e coverage

Playwright SHALL assert that a thumbnail (or placeholder) is associated with featured event rows using proximity/layout selectors only, per `docs/product/testing/bdd-and-e2e.md`. Coverage MAY extend the existing “List featured events” and/or “Admin remove from featured…” scenarios (or add a dedicated scenario) with `test()` titles matching Gherkin `Scenario:` titles from `docs/product/features/admin-events.feature`, **or** record a named coverage-matrix deferral (never “UI not built”). Existing R2/env skip patterns for featured e2e SHALL remain unchanged.

#### Scenario: Featured list e2e asserts thumbnail proximity

- **WHEN** this change is marked released
- **THEN** `e2e/specs/admin-events.spec.ts` asserts a thumbnail (img) or placeholder associated with a featured event row via proximity selectors, or `coverage-matrix.md` records a named deferral for that scenario

#### Scenario: Add-results thumb coverage or deferral

- **WHEN** this change is marked released
- **THEN** Playwright covers add-results thumbnail proximity for featured search results, or `coverage-matrix.md` records a named deferral for that scenario
