## MODIFIED Requirements

### Requirement: Product Gherkin and e2e match zip preference intel

`docs/product/features/admin-users.feature` and `e2e/specs/admin-users.spec.ts` SHALL describe Membership HQ member detail preference intel using location as stored `country` / `city` / `zip_code` (Germany/Berlin + Berlin PLZ for this release), not a districts multi-select list, and travel distance when `max_distance` is non-null. Scenarios SHALL note that null `max_distance` means no active travel-distance row (omit or unset — MUST NOT invent a value). Product docs and coverage-matrix notes MUST NOT claim travel radius is never collected. Playwright titles SHALL match Gherkin verbatim; selectors SHALL remain proximity/layout only. Coverage-matrix rows SHALL be updated (pass or named skip).

#### Scenario: Admin-users feature file describes zip and optional travel-distance intel

- **WHEN** an implementer reads the expand-detail / intel scenario in `docs/product/features/admin-users.feature`
- **THEN** preferences include zip/location (and country/city when shown) instead of districts
- **AND** the scenario states that when `max_distance` is null there is no active travel-distance / radius preference row
- **AND** the scenario does not claim travel distance is never collected or legacy-only

#### Scenario: Admin-users e2e asserts zip preference row

- **WHEN** Playwright runs the expand-detail / intel scenario against a member with a Berlin zip
- **THEN** the detail preferences section shows the zip (and does not present a districts multi-select list as location)

#### Scenario: Admin-users docs allow travel distance when set

- **WHEN** an implementer reads admin-users product Gherkin and coverage-matrix notes after this step
- **THEN** showing travel distance in km for non-null `max_distance` remains consistent with shipped Membership HQ intel
- **AND** no row claims radius is unavailable for newly saved preferences
