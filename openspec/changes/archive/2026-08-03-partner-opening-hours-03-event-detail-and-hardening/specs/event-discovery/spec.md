## MODIFIED Requirements

### Requirement: BDD coverage for detail layout and partner attribution

Gherkin scenarios for the two-row public detail layout and partner logo/name attribution (including opening hours when enabled) SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase.

#### Scenario: Coverage matrix lists new detail layout scenarios

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new event-discovery detail layout, partner attribution, and partner opening-hours scenarios (pass or explicit deferral)

#### Scenario: Guest sees partner attribution

- **WHEN** a guest opens a public event detail URL for a seeded partner with a logo
- **THEN** the partner name and logo are visible in the DETAILS attribution area
- **AND** the logo is not overlaid on the event hero as a floating badge

#### Scenario: Guest sees partner opening hours

- **WHEN** that partner has opening hours enabled with a valid weekly schedule
- **THEN** the DETAILS attribution area also lists the weekday hours (including closed days)

#### Scenario: Hours omitted when disabled

- **WHEN** the partner has `has_opening_hours` false
- **THEN** event detail does not show an opening-hours list

#### Scenario: Large viewport two-row layout is documented and smoke-tested

- **WHEN** a guest or member views public event detail
- **THEN** product Gherkin describes lg+ row 1 (title/location | checkout) and row 2 (hero | Markdown description)
- **AND** Playwright covers a proximity smoke for identity, checkout CTA, hero, and description without CSS-module hashes

## ADDED Requirements

### Requirement: Guest sees partner attribution with optional opening hours

Public event detail SHALL show the hosting partner’s name and logo in the DETAILS card partner attribution area (not as a floating sticker on the hero). When the partner has `has_opening_hours` true and a valid schedule, the same attribution area SHALL also list weekly opening hours (Monday–Sunday, Europe/Berlin wall times, closed days labeled). When `has_opening_hours` is false or hours are null, the hours list MUST be omitted while name/logo behavior remains unchanged. Hours visibility SHALL NOT depend on booking eligibility (guests and members see the same hours when enabled).

#### Scenario: Guest sees partner attribution

- **WHEN** a guest opens a public event detail for an event whose partner has a logo
- **THEN** they see the partner name and logo in the DETAILS attribution area
- **AND** the logo is not rendered as a floating sticker on top of the event hero image

#### Scenario: Guest sees partner opening hours

- **WHEN** that partner has opening hours enabled with a valid weekly schedule
- **THEN** the DETAILS attribution area also lists the weekday hours (including closed days)

#### Scenario: Hours omitted when disabled

- **WHEN** the partner has `has_opening_hours` false
- **THEN** event detail does not show an opening-hours list
