## ADDED Requirements

### Requirement: Coverage matrix
The repository SHALL include a checked-in coverage matrix at `docs/product/testing/coverage-matrix.md` mapping each MVP `docs/product/features/*.feature` Scenario to its Playwright test (or explicit `skip` / `deferred` / `unshipped` status). The matrix SHALL also note post-MVP `features/post-mvp/` scenarios that remain `@skip-no-ui` in shipped e2e. `docs/product/testing/bdd-and-e2e.md` Known coverage gaps SHALL point at this matrix as the single inventory once it is accurate.

#### Scenario: Matrix is the inventory
- **WHEN** an implementer opens the coverage matrix
- **THEN** they can see status for Discover CTA scenarios, public detail, G7/skip deferrals, auth GDPR stubs, post-MVP skips, and Phase 6–8 unshipped features

#### Scenario: Matrix columns are complete
- **WHEN** a Scenario row is recorded
- **THEN** it includes feature file, Scenario title, Playwright file + test title (or `—`), status (`pass` / `skip` / `deferred` / `unshipped`), and notes (deferral target phase if any)

#### Scenario: Known gaps point at the matrix
- **WHEN** a reader opens `bdd-and-e2e.md` Known coverage gaps after Phase 5.5 step 04
- **THEN** the section references the coverage matrix instead of duplicating a stale full inventory
