## ADDED Requirements

### Requirement: All onboarding preference fields are optional
After registration, every onboarding step MAY be completed with no selections. The system SHALL NOT block the primary Next/Finish action on an empty preference field. Non-empty values that fail format or allowlist validation SHALL still be rejected. Completing the wizard with all preference fields blank SHALL mark onboarding complete and route the member to the membership checkout page.

#### Scenario: Step 3 — zip under Germany/Berlin is optional
- **GIVEN** I am on onboarding step 3
- **THEN** country shows Germany and city shows Berlin (prefilled, not a free picker)
- **AND** I can enter a Berlin PLZ via a native text input or leave it blank
- **AND** Next succeeds when zip is blank
- **AND** Next fails with a validation message when zip is present but not a valid Berlin PLZ

#### Scenario: Step 2 — interests and moods optional
- **GIVEN** I am on onboarding step 2
- **WHEN** I submit with no interests and no moods selected
- **THEN** my preferences are stored as empty/unset for those fields
- **AND** I advance to the next step

#### Scenario: Step 2 — Other without free text does not block
- **GIVEN** I am on onboarding step 2
- **WHEN** I select Other and submit with empty free text
- **THEN** the step is accepted
- **AND** `Other` is not kept in `interests` without text
- **AND** `interests_other` is null
- **AND** I advance to the next step

#### Scenario: Step 4 — timing preferences optional
- **GIVEN** I am on onboarding step 4
- **WHEN** I finish with no timing, days, or languages selected
- **THEN** onboarding is marked complete
- **AND** I am routed to the membership checkout page

#### Scenario: Completing onboarding with all fields blank
- **GIVEN** I skip or leave blank every optional preference field across all steps
- **WHEN** I finish the wizard
- **THEN** my onboarding is marked complete
- **AND** I am routed to the membership checkout page

## MODIFIED Requirements

### Requirement: Automated browser coverage for onboarding wizard

Each Gherkin scenario in `docs/product/features/onboarding.feature` SHALL have a Playwright test in `e2e/specs/onboarding.spec.ts` tracing the four-step SSR wizard (`age`, `interests`, `location`, `timing`), including: step 3 zip under prefilled Germany/Berlin **without** travel distance / `max_distance` and with blank-zip Next succeeding; interests Other + free text when provided, and empty interests/moods allowed; searchable languages with DE/EN first; accessibility “needed?” yes checkbox. Coverage SHALL include completing the wizard with all preference fields blank. Tests that mutate onboarding state SHALL use a fresh USER (prefer new signup) for isolation. Scenario titles SHALL match Gherkin `Scenario:` lines verbatim (including the step 3 zip title and optional-field scenarios).

#### Scenario: Onboarding gate and completion are E2E-verified

- **WHEN** a fresh USER signs up and `e2e/specs/onboarding.spec.ts` runs
- **THEN** incomplete users are redirected into the wizard, each step accepts the updated preference controls, and completion sets onboarding complete and routes to the membership/checkout destination implemented by the app
- **AND** ADMIN/PARTNER and already-onboarded USERs skip the wizard per the feature file

#### Scenario: Onboarding fixture helpers exist

- **WHEN** onboarding specs need to drive multi-step forms
- **THEN** helpers live in `e2e/fixtures/onboarding.ts` (or extended auth fixtures) and use proximity selectors only
- **AND** `completeLocationStep` MAY fill a valid Berlin PLZ under Germany/Berlin or leave zip blank, and does **not** fill or require travel distance / `max_distance`

#### Scenario: Blank zip Next is E2E-verified

- **WHEN** an e2e scenario advances location with an empty zip under Germany/Berlin
- **THEN** Next succeeds and the member reaches timing (or completes the wizard when finishing)
- **AND** an invalid non-empty zip still fails with a visible validation message

### Requirement: Interests may include Other with free text
The system SHALL offer an `Other` interest option on onboarding step 2. When `Other` is selected **and** non-empty free text is provided, the member's free-text interest SHALL be stored as `profile.interests_other` and the interests array SHALL include the allowlist key `Other`. When `Other` is not selected, or when `Other` is selected with empty/whitespace free text, `interests_other` SHALL be null and `Other` SHALL NOT remain in the persisted interests array. Empty interests and moods arrays SHALL be accepted and SHALL advance the step. `Other` SHALL be a normal member of `@unveiled/auth/constants` `INTERESTS` (appended after the existing eight keys). Locale labels SHALL be EN `Other` and DE `Sonstiges`. Free text SHALL be trimmed; when present it MUST NOT exceed the configured max length (100 characters). The Other free-text input SHALL NOT use HTML `required`.

#### Scenario: Other interest without text advances
- **WHEN** a member selects Other under WHAT INTERESTS YOU? and submits without free text
- **THEN** the step is accepted
- **AND** persisted `interests` does not contain `Other`
- **AND** `interests_other` is null

#### Scenario: Other interest saves free text
- **WHEN** a member selects Other, enters free text, and submits
- **THEN** `interests` contains `Other` and `interests_other` stores the trimmed text

#### Scenario: Other unchecked clears free text
- **WHEN** a member submits interests without Other selected (even if stray `interests_other` text was posted)
- **THEN** persisted `interests_other` is null

#### Scenario: Empty interests and moods advance
- **WHEN** a member submits step 2 with no interests and no moods selected
- **THEN** preferences are stored as empty arrays (or equivalent unset) for those fields
- **AND** the member advances to the location step

### Requirement: Step 3 location preferences

Onboarding step 3 SHALL collect an **optional** postal code (`zip_code`) via a native text input, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The zip input SHALL NOT use HTML `required`. The system SHALL NOT offer the 12 Berlin Bezirke multi-select. The system SHALL NOT require, show, or persist travel distance / `max_distance` on this step. Locale copy SHALL label Country / Land, City / Stadt, and PLZ / Zip code, and SHALL indicate that zip is optional while Unveiled currently serves Berlin (without claiming the data model can never expand). Submitting a valid Berlin zip SHALL store `country`, `city`, and `zip_code`, clear legacy `districts`, and leave any existing `max_distance` JSONB value untouched. Submitting with empty/whitespace zip SHALL succeed: store `zip_code` as null/unset, persist `country`/`city` defaults from the payload, clear legacy `districts`, advance `behavior.onboarding_step` to timing, and MUST NOT re-route the member back to location solely because zip is empty. Invalid or non-Berlin **non-empty** zip under `(DE, berlin)` SHALL be rejected with a user-visible / typed validation error without completing the step.

#### Scenario: Step 3 — zip under Germany/Berlin only

- **WHEN** I am on onboarding step 3
- **THEN** country shows Germany and city shows Berlin (prefilled)
- **AND** I can enter a Berlin PLZ or leave it blank
- **AND** I cannot set a travel distance / radius
- **AND** I cannot multi-select hangout districts
- **AND** submitting a valid zip stores country, city, and zip_code

#### Scenario: Step 3 — blank zip advances

- **WHEN** I submit onboarding step 3 with an empty zip under Germany/Berlin
- **THEN** the step succeeds
- **AND** `zip_code` is null/unset
- **AND** country and city remain `DE` / `berlin`
- **AND** I am advanced to the timing step (not trapped on location)

#### Scenario: Step 3 — invalid zip rejected

- **WHEN** I submit onboarding step 3 with a malformed or non-Berlin non-empty zip
- **THEN** the step is rejected with a user-visible error
- **AND** the location preference is not advanced as saved with that invalid zip

#### Scenario: Step 3 — existing max_distance left untouched

- **WHEN** a profile already has a non-null `max_distance` and onboarding location step is submitted with a valid Berlin zip only
- **THEN** the persisted profile keeps the previous `max_distance` value
- **AND** districts is cleared (null or absent)

### Requirement: Product docs match onboarding preference options

`docs/product/features/onboarding.feature`, `extras/content-i18n-inventory.md`, `database/schema-overview.md`, and `testing/coverage-matrix.md` SHALL describe the shipped preference UX: interests include Other + optional free text (`interests_other`); all onboarding preference fields are optional (including zip); location on step 3 collects optional `zip_code` with country/city prefilled to Germany/Berlin (`DE` / `berlin`), does not offer Bezirk multi-select, and does **not** collect travel distance / `max_distance`; timing offers searchable preferred languages (DE/EN first; no Non-Verbal) and Accessibility needed? with a Yes/Ja checkbox. Docs MAY note that more cities/countries can be added later via the postal registry without changing the field trio. `max_distance` SHALL be documented as optional legacy JSONB (not an active onboarding preference). i18n inventory SHALL NOT list active `radiusLabel` / travel-distance chrome for onboarding. Coverage-matrix Scenario titles SHALL match the updated Gherkin; notes SHALL state optional zip-only location (no travel distance) and that blank Next is allowed.

#### Scenario: Onboarding feature file matches shipped steps 2–4

- **WHEN** an implementer reads `docs/product/features/onboarding.feature` after this step
- **THEN** step 2 mentions Other + free text (optional), step 3 describes optional zip under Germany/Berlin without travel distance, without Bezirk multi-select, and step 4 describes searchable languages and Accessibility needed?
- **AND** scenarios assert blank zip / empty preferences can advance and complete onboarding
- **AND** scenarios that require filling travel distance are absent
- **AND** stale hangout-district / 12-Bezirke scenarios, Non-Verbal language options, and Required/Erforderlich accessibility labels remain absent from those scenarios

#### Scenario: Coverage matrix tracks optional zip-only step 3

- **WHEN** an implementer reads `docs/product/testing/coverage-matrix.md` onboarding rows
- **THEN** the step 3 row uses the zip Scenario title and notes Germany/Berlin defaults, optional zip, without travel distance
- **AND** the notes do not require a travel-distance control or a filled zip to advance

#### Scenario: Onboarding e2e asserts no travel distance control

- **WHEN** `e2e/specs/onboarding.spec.ts` runs Scenario Step 3 — zip under Germany/Berlin
- **THEN** the location form shows zip under Germany/Berlin
- **AND** the test asserts that travel distance / radius is absent (or equivalent proximity assertion)
