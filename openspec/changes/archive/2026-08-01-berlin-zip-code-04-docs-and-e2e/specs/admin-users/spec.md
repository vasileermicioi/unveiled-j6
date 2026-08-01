## ADDED Requirements

### Requirement: Product Gherkin and e2e match zip preference intel
`docs/product/features/admin-users.feature` and `e2e/specs/admin-users.spec.ts` SHALL describe Membership HQ member detail preference intel using location as stored `country` / `city` / `zip_code` (Germany/Berlin + Berlin PLZ for this release), not a districts multi-select list. Scenarios MAY note that null `max_distance` means no active travel-distance row. Playwright titles SHALL match Gherkin verbatim; selectors SHALL remain proximity/layout only. Coverage-matrix rows SHALL be updated (pass or named skip).

#### Scenario: Admin-users feature file describes zip intel
- **WHEN** an implementer reads the expand-detail / intel scenario in `docs/product/features/admin-users.feature`
- **THEN** preferences include zip/location (and country/city when shown) instead of districts
- **AND** the scenario does not require an active travel-radius preference when `max_distance` is null

#### Scenario: Admin-users e2e asserts zip preference row
- **WHEN** Playwright runs the expand-detail / intel scenario against a member with a Berlin zip
- **THEN** the detail preferences section shows the zip (and does not present a districts multi-select list as location)
