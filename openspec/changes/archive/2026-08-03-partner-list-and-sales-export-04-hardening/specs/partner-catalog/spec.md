## ADDED Requirements

### Requirement: BDD and e2e cover partner list sorting and active events

The Gherkin feature file and Playwright coverage (or a named deferral) SHALL cover the partner list **Name** filter label, the three sort modes with both directions, the **Active events** column, and the **Export** action, using proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Product scenarios SHALL live in `docs/product/features/admin-partners.feature` (or a dedicated admin sales-export feature file only if split during apply). Coverage-matrix rows SHALL exist for each new scenario with status `pass` or an explicit named deferral (owner/reason). Sitemap and related product docs SHALL describe the list query params and the Export entry to the sales-export route.

#### Scenario: Feature file documents partner list enhancements

- **WHEN** a reader opens `docs/product/features/admin-partners.feature` after this step
- **THEN** it includes scenarios for the Name filter, sorting (all three modes, asc/desc), the Active events column, and the Export action

#### Scenario: Coverage matrix lists partner list scenarios

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for sorting, active column, and export (pass or named deferral)

#### Scenario: Playwright mirrors partner list scenarios

- **WHEN** `bun run test:e2e` runs the admin-partners Playwright file against a configured environment
- **THEN** each new partner-list Scenario either passes with proximity/layout selectors or is recorded as a named env/harness deferral in the coverage matrix
