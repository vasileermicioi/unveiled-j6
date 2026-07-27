## ADDED Requirements

### Requirement: BDD coverage for form control and prefill UX
Gherkin scenarios for checkbox multi-select languages/age groups (and series weekdays) and add-only partner address/map prefill SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Address prefill on add (and non-overwrite on edit) MUST be covered; live Nominatim map-pin success MAY be deferred when CI cannot reach Nominatim reliably.

#### Scenario: Coverage matrix lists new admin form scenarios
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new admin-events scenarios (pass or explicit deferral)

#### Scenario: Admin languages and age groups use checkbox multi-selects
- **WHEN** an admin opens create or edit event
- **THEN** Playwright can assert languages and target age groups are chosen with checkboxes (languages expose a search filter; age groups do not)
- **AND** selectors remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`

#### Scenario: Add event prefills partner address
- **WHEN** an admin on the new-event (or series-create) form selects a partner that has a stored address
- **THEN** Playwright asserts the address field is set to that partner's address
- **AND** live map-pin geocode success is not required for the scenario to pass (soft-fail leaves map unchanged)

#### Scenario: Edit event does not overwrite location when partner changes
- **WHEN** an admin on the edit-event form changes the partner
- **THEN** Playwright asserts the existing address remains unchanged
