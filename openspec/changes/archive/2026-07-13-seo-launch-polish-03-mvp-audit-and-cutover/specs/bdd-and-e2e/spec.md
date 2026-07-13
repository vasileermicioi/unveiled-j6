## ADDED Requirements

### Requirement: MVP feature coverage audit
The system SHALL map every top-level `docs/product/features/*.feature` file (excluding `features/post-mvp/`) to Playwright coverage that either passes or is explicitly named-deferred with reason. Phase 8 release MUST NOT leave silent skips for MVP scenarios. The coverage matrix at `docs/product/testing/coverage-matrix.md` and `e2e/README.md` skip inventory SHALL agree on pass vs named deferral for each MVP feature file.

#### Scenario: Coverage matrix complete
- **WHEN** Phase 8 launch polish completes
- **THEN** the coverage matrix lists pass or named deferral (`skip` / `deferred` with notes) for each MVP feature file and does not leave MVP-required scenarios as undocumented or silent skips

#### Scenario: Named deferrals are explicit
- **WHEN** an MVP Scenario cannot pass in Playwright (third-party harness, integration SoT, env/plugin blocker)
- **THEN** it is recorded with scenario name, reason, and owner/target in the coverage matrix and/or `e2e/README.md` skip inventory

#### Scenario: Post-MVP remains excluded from the MVP gate
- **WHEN** Phase 8 launch polish completes
- **THEN** `features/post-mvp/` scenarios MAY remain skipped and MUST NOT be treated as MVP coverage failures
