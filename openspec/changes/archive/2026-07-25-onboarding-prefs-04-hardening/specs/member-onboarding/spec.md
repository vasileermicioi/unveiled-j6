## ADDED Requirements

### Requirement: Product docs match onboarding preference options

`docs/product/features/onboarding.feature`, `extras/content-i18n-inventory.md`, `database/schema-overview.md`, and `testing/coverage-matrix.md` SHALL describe the shipped preference UX: interests include Other + free text (`interests_other`); location offers the 12 official Berlin Bezirke and does not collect travel radius; timing offers searchable preferred languages (DE/EN first; no Non-Verbal) and Accessibility needed? with a Yes/Ja checkbox. `max_distance` SHALL be documented as legacy/unused (not collected). Coverage-matrix Scenario titles SHALL match the updated Gherkin.

#### Scenario: Onboarding feature file matches shipped steps 2–4

- **WHEN** an implementer reads `docs/product/features/onboarding.feature` after this step
- **THEN** step 2 mentions Other + free text, step 3 lists the 12 Bezirke without travel radius, and step 4 describes searchable languages and Accessibility needed?
- **AND** stale informal district keys, travel-radius controls, Non-Verbal language options, and Required/Erforderlich accessibility labels are absent from those scenarios

## MODIFIED Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`), including: 12 Bezirke without travel radius; interests Other + free text; searchable languages with DE/EN first; accessibility “needed?” yes checkbox. Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation.

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts the updated preference controls, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only
