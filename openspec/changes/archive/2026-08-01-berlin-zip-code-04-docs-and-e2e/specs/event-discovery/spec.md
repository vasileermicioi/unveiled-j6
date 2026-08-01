## ADDED Requirements

### Requirement: Product docs and BDD match public zip location display
`docs/product/features/event-discovery.feature`, `docs/product/ui/ui-component-map.md` (EventCard / Event detail), and Playwright coverage SHALL describe event cards and public detail presenting the event zip code instead of neighborhood/Kiez. Country/city MAY appear on detail for clarity but MUST NOT be required to dominate cards while the product is Berlin-only. Coverage-matrix rows SHALL match Scenario titles (pass or named deferral). Selectors SHALL remain proximity/layout only.

#### Scenario: Event discovery feature file describes zip display
- **WHEN** an implementer reads `docs/product/features/event-discovery.feature` after this step
- **THEN** public card and/or detail scenarios mention zip code location metadata
- **AND** neighborhood/Kiez labels are not required as current location chrome

#### Scenario: UI component map EventCard uses zip
- **WHEN** an implementer reads the EventCard entry in `docs/product/ui/ui-component-map.md`
- **THEN** it lists zip (+ MapPin) instead of neighborhood

#### Scenario: Playwright or matrix covers zip on public surfaces
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for zip-on-card and/or zip-on-detail scenarios (pass or explicit deferral with owner)
