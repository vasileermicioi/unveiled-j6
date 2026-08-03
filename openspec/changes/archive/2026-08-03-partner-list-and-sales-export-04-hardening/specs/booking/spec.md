## ADDED Requirements

### Requirement: BDD and e2e cover sales export

The Gherkin feature file and Playwright coverage (or a named deferral) SHALL cover the sales-export page: period selection, per-event tickets-sold table, CSV download, and the ADMIN-only guard, using proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Scenarios SHALL live in `docs/product/features/admin-partners.feature` (preferred) or a dedicated `docs/product/features/admin-sales-export.feature` with a matching Playwright basename. Coverage-matrix rows SHALL exist for each new scenario with status `pass` or an explicit named deferral (owner/reason). Product sitemap and authorization docs SHALL include `/:locale/admin/partners/export`. Decision log SHALL record the tickets-sold definition (`CONFIRMED`/`USED` by `created_at` in the inclusive Europe/Berlin period).

#### Scenario: Feature file documents sales export

- **WHEN** a reader opens the sales-export feature scenarios after this step
- **THEN** they cover a valid-period table, CSV download, and admin-only access

#### Scenario: Coverage matrix lists sales export

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes a sales-export row (pass or named deferral)

#### Scenario: Playwright mirrors sales export scenarios

- **WHEN** `bun run test:e2e` runs the Playwright file that maps to the sales-export Gherkin scenarios
- **THEN** each new sales-export Scenario either passes with proximity/layout selectors or is recorded as a named env/harness deferral in the coverage matrix
