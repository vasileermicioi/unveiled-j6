## ADDED Requirements

### Requirement: Admin partners feature documents opening hours

`docs/product/features/admin-partners.feature` SHALL include scenarios for enabling weekly opening hours on create/edit, validating incomplete/invalid ranges, and disabling hours so they no longer appear on public event detail. Playwright coverage SHALL follow the BDD contract (proximity selectors; R2 skip only when logo upload is required for the scenario setup).

#### Scenario: Feature file covers enable validate and disable

- **WHEN** a reader follows `admin-partners.feature` after this step
- **THEN** scenarios cover enabling a full week, rejecting invalid/incomplete ranges, and disabling hours

#### Scenario: Playwright covers admin hours and public omit

- **WHEN** admin partner and event-discovery e2e run with required env
- **THEN** coverage includes saving enabled hours and asserting public detail shows or omits hours per `has_opening_hours`
- **AND** selectors remain proximity/layout only
