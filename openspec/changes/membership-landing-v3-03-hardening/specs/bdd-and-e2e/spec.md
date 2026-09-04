## ADDED Requirements

### Requirement: V3 landing Playwright coverage

The system SHALL cover the v3 landing in `e2e/specs/static-pages.spec.ts` with Playwright tests whose titles match Gherkin `Scenario:` lines verbatim, using proximity/layout selectors only (no fragile class hooks, no bare `input[name=…]` locators). Coverage SHALL assert live rail count ≤3, no credit text in the rail, no detail hrefs, live + locked CTAs → login, and 404 for `/:locale/regular` and `/regular`. The Regular-landing scenarios SHALL be deleted and the bare `/regular` redirect scenario SHALL be replaced with a 404 assertion. `docs/product/testing/coverage-matrix.md` SHALL map the new titles to `pass` (or named env-skips only).

#### Scenario: V3 rail assertions are executable

- **WHEN** `bun run test:e2e -- e2e/specs/static-pages.spec.ts` runs against the configured test environment
- **THEN** v3 rail tests assert at most 3 live teasers, no credit figures or `/events/:id` links in the rail, login-bound live + locked CTA hrefs, and 2 locked skeleton cards — or skip only for documented env prerequisites

#### Scenario: Regular scenarios are replaced with 404

- **WHEN** an implementer searches `e2e/specs/static-pages.spec.ts` after this change
- **THEN** no test navigates to `/:locale/regular` expecting landing content or asserts a `/regular` redirect to a localized regular landing
- **AND** tests assert 404 for both `/:locale/regular` and `/regular`

#### Scenario: Selectors follow the proximity contract

- **WHEN** v3 landing e2e coverage is reviewed
- **THEN** assertions use `getByRole` / `getByText` / `getByLabel` (or equivalent layout/proximity queries) with no assertions coupled to landing CSS class names

#### Scenario: Coverage matrix reflects v3 rows

- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** `static-pages.feature` v3 and 404 rows point at the updated Playwright titles with `pass` or named env `skip` — not `unshipped` and not the removed Regular-landing titles
