## ADDED Requirements

### Requirement: Admin location e2e covers structured fields

Playwright in `e2e/specs/admin-events.spec.ts` (and partner coverage where applicable) SHALL assert structured street/house/zip prefill and save using proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`, with `test()` titles matching Gherkin `Scenario:` titles from `docs/product/features/admin-events.feature` (and `admin-partners.feature` when partner structured location is covered). Live Nominatim map-pin success SHALL remain optional in CI; soft-fail paths MAY be covered by unit tests (`geocode-berlin.test.ts` or equivalent). Coverage-matrix rows SHALL reflect pass or named env deferral — never “UI not built.”

#### Scenario: Admin events e2e asserts structured prefill

- **WHEN** an admin on the new-event form selects a partner with structured location
- **THEN** Playwright asserts street, house number, and zip fields are filled from that partner
- **AND** live Nominatim pin success is not required for the scenario to pass

#### Scenario: Coverage matrix documents structured location e2e

- **WHEN** this change is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for structured location prefill/save scenarios (pass or named deferral)
