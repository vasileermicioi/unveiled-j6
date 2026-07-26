# Partner Catalog

Admin-curated partner venue membership for Discover and related catalog helpers in `@unveiled/db`.

## Requirements

### Requirement: Featured partners join table

The system SHALL persist admin-curated Discover partners in a `featured_partners` join table keyed by existing `partners.id`, without duplicating partner payload columns. Each row SHALL store `partner_id` (PK, FK → `partners.id` ON DELETE CASCADE), `sort_order` (integer, not null), and `created_at` (timestamptz, not null, default now). Removing a featured row MUST NOT delete the underlying partner. Adding a partner that is already featured SHALL be rejected. New featured rows SHALL receive `sort_order = max(existing)+1` (append). Listing SHALL order by `sort_order` ascending then a stable secondary key (partner `name`). Catalog APIs SHALL live in `@unveiled/db` and MAY accept an optional list limit for Discover’s “up to 8” display. The domain SHALL also expose search of catalog partners excluding already-featured rows (name search consistent with `listPartners`).

#### Scenario: Add featured partner appends sort order

- **WHEN** an admin adds a partner that is not yet featured
- **THEN** a `featured_partners` row is created with the next `sort_order`
- **AND** the partner row remains in `partners`

#### Scenario: Duplicate featured partner rejected

- **WHEN** an admin attempts to feature a partner that is already featured
- **THEN** the operation is rejected without creating a second row

#### Scenario: Remove featured partner keeps venue

- **WHEN** an admin removes a partner from featured
- **THEN** the `featured_partners` row is deleted
- **AND** the `partners` row still exists

#### Scenario: Partner delete cascades featured row

- **WHEN** a partner venue is deleted
- **THEN** any `featured_partners` row for that partner is removed by cascade

#### Scenario: List featured partners respects sort order and optional limit

- **WHEN** `listFeaturedPartners` is called with an optional `limit`
- **THEN** results are ordered by `sort_order` ascending then partner `name`
- **AND** at most `limit` rows are returned when `limit` is provided

#### Scenario: Search excludes already-featured partners

- **WHEN** `searchPartnersNotFeatured` is called with a query matching both featured and non-featured partners
- **THEN** only non-featured matching partners are returned

### Requirement: Partner logo image is required
The system SHALL require a processed catalog image (five WebP variants via the standard admin prebuilt pipeline) when creating a partner. `partners.logo_image_id` SHALL be NOT NULL. Editing a partner MAY replace the logo with a new prebuilt set but SHALL NOT clear the logo to empty.

#### Scenario: Create partner without logo rejected
- **WHEN** an admin submits partner create without a complete prebuilt logo variant set
- **THEN** the system rejects the create and does not insert a partner row

#### Scenario: Create partner with logo succeeds
- **WHEN** an admin submits partner create with a valid five-variant WebP logo set
- **THEN** the partner is stored with a non-null `logo_image_id` referencing that image

#### Scenario: Edit keeps logo when no replacement supplied
- **WHEN** an admin edits partner fields without supplying a new logo
- **THEN** the existing `logo_image_id` remains unchanged and non-null

#### Scenario: Edit cannot clear logo
- **WHEN** an admin attempts to clear a partner logo without supplying a replacement
- **THEN** the system does not set `logo_image_id` to NULL and the previous logo remains attached

### Requirement: Admin partners Gherkin and e2e require logo
Gherkin in `docs/product/features/admin-partners.feature` and Playwright coverage in `e2e/specs/admin-partners.spec.ts` (plus coverage-matrix rows) SHALL treat logo image as required on create via the five-WebP prebuilt pipeline, not optional. Scenarios SHALL NOT instruct omitting both upload and URL as a valid create path. Assertions for logo URLs SHALL expect WebP variant filenames (e.g. `small-320.webp`) when image specs run. Selectors SHALL remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`. Image scenarios MAY continue to env-skip when R2 vars are missing using the existing documented skip pattern.

#### Scenario: Feature file requires logo
- **WHEN** a reader follows `admin-partners.feature` create scenarios after this step
- **THEN** logo supply is mandatory and aligned with the WebP variant contract

#### Scenario: Playwright create without logo is not the happy path
- **WHEN** admin partner e2e covers create
- **THEN** the covered happy path supplies a logo (or uses a fixture helper that attaches one) and does not treat logo-less create as success
