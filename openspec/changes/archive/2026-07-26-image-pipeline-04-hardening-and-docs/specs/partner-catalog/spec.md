## ADDED Requirements

### Requirement: Admin partners Gherkin and e2e require logo
Gherkin in `docs/product/features/admin-partners.feature` and Playwright coverage in `e2e/specs/admin-partners.spec.ts` (plus coverage-matrix rows) SHALL treat logo image as required on create via the five-WebP prebuilt pipeline, not optional. Scenarios SHALL NOT instruct omitting both upload and URL as a valid create path. Assertions for logo URLs SHALL expect WebP variant filenames (e.g. `small-320.webp`) when image specs run. Selectors SHALL remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`. Image scenarios MAY continue to env-skip when R2 vars are missing using the existing documented skip pattern.

#### Scenario: Feature file requires logo
- **WHEN** a reader follows `admin-partners.feature` create scenarios after this step
- **THEN** logo supply is mandatory and aligned with the WebP variant contract

#### Scenario: Playwright create without logo is not the happy path
- **WHEN** admin partner e2e covers create
- **THEN** the covered happy path supplies a logo (or uses a fixture helper that attaches one) and does not treat logo-less create as success
