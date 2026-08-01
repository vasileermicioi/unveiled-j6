## MODIFIED Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`), including: step 3 zip under prefilled Germany/Berlin **plus** required travel distance (km); interests Other + free text; searchable languages with DE/EN first; accessibility “needed?” yes checkbox. Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation. Scenario titles SHALL match Gherkin `Scenario:` lines verbatim (including the step 3 zip title).

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts the updated preference controls, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only
- **AND** `completeLocationStep` fills a valid Berlin PLZ under Germany/Berlin and a valid travel distance within bounds (not Bezirk checkboxes; not omitting `max_distance`)

### Requirement: Product docs match onboarding preference options

`docs/product/features/onboarding.feature`, `extras/content-i18n-inventory.md`, `database/schema-overview.md`, and `testing/coverage-matrix.md` SHALL describe the shipped preference UX: interests include Other + free text (`interests_other`); location on step 3 collects `zip_code` with country/city prefilled to Germany/Berlin (`DE` / `berlin`), does not offer Bezirk multi-select, and **collects required travel distance** (`max_distance` integer km, inclusive bounds 1–50); timing offers searchable preferred languages (DE/EN first; no Non-Verbal) and Accessibility needed? with a Yes/Ja checkbox. Docs MAY note that more cities/countries can be added later via the postal registry without changing the field trio. `max_distance` SHALL be documented as an **active** preference (collected in onboarding and Vibes; preference saves do not clear it by policy). i18n inventory SHALL list `radiusLabel` / `km` with EN “How far will you travel?” / DE “Wie weit bist du bereit zu fahren?” (+ `km`). Coverage-matrix Scenario titles SHALL match the updated Gherkin; notes SHALL not claim “no travel radius”.

#### Scenario: Onboarding feature file matches shipped steps 2–4

- **WHEN** an implementer reads `docs/product/features/onboarding.feature` after this step
- **THEN** step 2 mentions Other + free text, step 3 describes zip under Germany/Berlin **and** travel distance (km), without Bezirk multi-select, and step 4 describes searchable languages and Accessibility needed?
- **AND** scenarios that forbid travel distance / radius (“I cannot set a travel distance / radius”) are absent
- **AND** stale hangout-district / 12-Bezirke scenarios, Non-Verbal language options, and Required/Erforderlich accessibility labels remain absent from those scenarios

#### Scenario: Coverage matrix tracks zip and travel distance on step 3

- **WHEN** an implementer reads `docs/product/testing/coverage-matrix.md` onboarding rows
- **THEN** the step 3 row uses the zip Scenario title and notes Germany/Berlin defaults **plus** travel distance (km)
- **AND** the notes do not claim travel radius is unavailable

#### Scenario: Onboarding e2e asserts travel distance control

- **WHEN** `e2e/specs/onboarding.spec.ts` runs Scenario Step 3 — zip under Germany/Berlin
- **THEN** the location form shows a travel-distance control (native number / labeled how-far copy) beside zip
- **AND** the test does not assert that travel distance / radius is absent
