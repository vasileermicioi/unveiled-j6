## ADDED Requirements

### Requirement: Admin events Playwright covers clone not series
Playwright in `e2e/specs/admin-events.spec.ts` SHALL cover the clone-event happy path using proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`, with `test()` titles matching Gherkin `Scenario:` titles verbatim. Voucher inventory requirement on clone SHALL be covered when practical, or listed as a named coverage-matrix deferral with owner/reason (never “UI not built”). Series manual-slot and date-range scenarios SHALL be removed from the suite and from `docs/product/testing/coverage-matrix.md` (or marked removed — not skipped as “UI not built”).

#### Scenario: Clone happy path is executable or named-skipped
- **WHEN** admin-events e2e coverage is evaluated after this change
- **THEN** a Playwright test exists for the clone happy-path Scenario title
- **AND** it passes when admin credentials / DB allow, or is listed as a named env skip with assertions committed

#### Scenario: Series create tests are gone
- **WHEN** an implementer searches `e2e/specs/admin-events.spec.ts` after this change
- **THEN** there are no tests that navigate to `/admin/events/series/new` or assert series create builders as current MVP UI
- **AND** coverage-matrix rows for series create are absent or marked removed — not `skip` because “UI not built”

#### Scenario: Coverage matrix lists clone scenarios
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** clone scenarios from `admin-events.feature` map to Playwright titles with `pass` or named env `skip`
