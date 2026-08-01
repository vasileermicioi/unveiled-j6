## RENAMED Requirements

- FROM: `### Requirement: Featured Event Gallery Playwright coverage`
- TO: `### Requirement: Event Gallery Playwright coverage`

## MODIFIED Requirements

### Requirement: Event Gallery Playwright coverage

The system SHALL cover Event Gallery happy paths in Playwright with verbatim Gherkin `Scenario:` titles from `docs/product/features/admin-events.feature` and `docs/product/features/event-discovery.feature`, using proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`. Coverage SHALL include (1) ADMIN manage entry from the Events list and/or event edit page (not Featured-only), plus multi-upload add and SSR remove confirm for gallery photos when R2 + admin credentials allow, and (2) public guest view of gallery + slider navigation on a seeded or fixture-backed event with ≥2 gallery images (seed host MAY remain featured). Scenarios that cannot run SHALL be `test.skip`ped with an explicit env/harness reason (never “UI not built”) and documented in `docs/product/testing/coverage-matrix.md` and/or `apps/web/DEPLOYMENT.md` with a manual demo script that still exercises admin add/remove and public slider.

#### Scenario: Admin gallery manage entry is from Events

- **WHEN** admin gallery entry e2e coverage is evaluated
- **THEN** Playwright asserts a path from Events list or edit to gallery manage for a catalog event that need not be featured
- **AND** it does not require Featured membership as the sole entry

#### Scenario: Admin gallery happy path is executable or named-skipped

- **WHEN** gallery admin e2e coverage is evaluated
- **THEN** multi-upload add and remove-confirm scenarios have Playwright tests that pass when env allows, or are listed as named env skips with a documented manual demo script

#### Scenario: Public gallery slider is executable or named-skipped

- **WHEN** public gallery e2e coverage is evaluated
- **THEN** guest gallery + slider navigation has a Playwright test that passes when seed/fixture data is available, or is listed as a named skip with a documented manual demo script

#### Scenario: Coverage matrix lists gallery scenarios

- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** gallery scenarios from admin-events and event-discovery map to Playwright titles (or named skips) instead of remaining undocumented
- **AND** admin gallery entry rows reflect Events/edit entry, not Featured-exclusive manage
