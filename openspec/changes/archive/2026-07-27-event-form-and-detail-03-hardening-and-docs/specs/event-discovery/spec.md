## ADDED Requirements

### Requirement: BDD coverage for detail layout and partner attribution
Gherkin scenarios for the two-row public detail layout and partner logo/name attribution SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase.

#### Scenario: Coverage matrix lists new detail layout scenarios
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new event-discovery detail layout and partner attribution scenarios (pass or explicit deferral)

#### Scenario: Guest sees partner attribution
- **WHEN** a guest opens a public event detail URL for a seeded partner with a logo
- **THEN** the partner name and logo are visible in the identity area
- **AND** the logo is not overlaid on the event hero as a floating badge

#### Scenario: Large viewport two-row layout is documented and smoke-tested
- **WHEN** a guest or member views public event detail
- **THEN** product Gherkin describes lg+ row 1 (title/location | checkout) and row 2 (hero | Markdown description)
- **AND** Playwright covers a proximity smoke for identity, checkout CTA, hero, and description without CSS-module hashes
