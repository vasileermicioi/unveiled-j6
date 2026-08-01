## MODIFIED Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`), including: step 3 zip under prefilled Germany/Berlin without travel radius; interests Other + free text; searchable languages with DE/EN first; accessibility “needed?” yes checkbox. Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation. Scenario titles SHALL match Gherkin `Scenario:` lines verbatim (including the renamed step 3 zip title).

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts the updated preference controls, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only
- **AND** `completeLocationStep` fills a valid Berlin PLZ under Germany/Berlin (not Bezirk checkboxes)

### Requirement: Product docs match onboarding preference options

`docs/product/features/onboarding.feature`, `extras/content-i18n-inventory.md`, `database/schema-overview.md`, and `testing/coverage-matrix.md` SHALL describe the shipped preference UX: interests include Other + free text (`interests_other`); location on step 3 collects `zip_code` with country/city prefilled to Germany/Berlin (`DE` / `berlin`), does not offer Bezirk multi-select, and does not collect travel radius; timing offers searchable preferred languages (DE/EN first; no Non-Verbal) and Accessibility needed? with a Yes/Ja checkbox. Docs MAY note that more cities/countries can be added later via the postal registry without changing the field trio. `max_distance` SHALL be documented as legacy/unused (not collected). Coverage-matrix Scenario titles SHALL match the updated Gherkin.

#### Scenario: Onboarding feature file matches shipped steps 2–4

- **WHEN** an implementer reads `docs/product/features/onboarding.feature` after this step
- **THEN** step 2 mentions Other + free text, step 3 describes zip under Germany/Berlin without travel radius or Bezirk multi-select, and step 4 describes searchable languages and Accessibility needed?
- **AND** stale hangout-district / 12-Bezirke scenarios, travel-radius controls, Non-Verbal language options, and Required/Erforderlich accessibility labels are absent from those scenarios

#### Scenario: Coverage matrix tracks zip location step

- **WHEN** an implementer reads `docs/product/testing/coverage-matrix.md` onboarding rows
- **THEN** the step 3 row uses the zip Scenario title and notes Germany/Berlin defaults (not hangout districts)
