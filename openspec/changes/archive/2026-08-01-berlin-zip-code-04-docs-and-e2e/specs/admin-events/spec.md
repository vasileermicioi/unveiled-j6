## ADDED Requirements

### Requirement: Product docs and BDD match Berlin zip authoring
`docs/product/features/admin-events.feature`, `e2e/specs/admin-events.spec.ts`, and `docs/product/testing/coverage-matrix.md` SHALL describe admin event create/edit (and series shared base fields while series exists) collecting Berlin `zip_code` under prefilled Germany/Berlin (`DE` / `berlin`), with no neighborhood/Kiez field and no city/country picker. Playwright SHALL cover at least admin create smoke with a valid Berlin PLZ using proximity selectors, or record a named coverage-matrix deferral with owner and reason. Invalid-zip browser coverage MAY rely on unit tests with a named matrix deferral.

#### Scenario: Admin-events feature file describes zip fields
- **WHEN** an implementer reads `docs/product/features/admin-events.feature` after this step
- **THEN** create/edit scenarios mention zip under Germany/Berlin
- **AND** neighborhood/Kiez authoring is absent

#### Scenario: Admin create smoke uses Berlin PLZ
- **WHEN** `e2e/specs/admin-events.spec.ts` runs an admin create (or equivalent smoke) scenario
- **THEN** the form is filled with a valid Berlin PLZ (e.g. `10115`) under fixed Germany/Berlin
- **AND** selectors remain proximity/layout only

#### Scenario: Coverage matrix lists zip authoring
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for admin zip authoring scenarios (pass or explicit deferral)
