## ADDED Requirements

### Requirement: Phase test coverage extends with each feature phase

After Phase 4½, each implementing phase SHALL add Ladle stories and Playwright specs for its own `features/*.feature` file(s). Phase 5 adds discovery coverage without regressing existing `bun run stories` / `bun run test:e2e` suites.

#### Scenario: Phase 5 extends the harness

- **WHEN** Phase 5 discovery stories and `e2e/specs/event-discovery.spec.ts` are added
- **THEN** `bun run stories` continues to serve prior Phase 0–4 stories
- **AND** `bun run test:e2e` continues to execute existing specs (`smoke`, `static-pages`, `auth`, `onboarding`, `admin-*`) in addition to `event-discovery.spec.ts`

#### Scenario: Feature file maps to spec basename

- **WHEN** Phase 5 E2E coverage is added for `event-discovery.feature`
- **THEN** the Playwright file is named `e2e/specs/event-discovery.spec.ts`
- **AND** each `test()` title matches a `Scenario:` line from that feature file verbatim
