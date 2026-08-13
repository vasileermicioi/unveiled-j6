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

### Requirement: Structured partner location fields

Partners SHALL use the same minimal structured location model as events: required `street` and `house_number`, optional `address_line2`, plus `country` / `city` / `zip_code` with the same Berlin postal validation (`validatePostalCode`) and defaults (`DE` / `berlin`) for this release. Partner create/update SHALL compose display `address` on write from those fields. Structured partner location SHALL be available for add-only event form prefill field-by-field. The system SHALL NOT store partner neighborhood/Bezirk as a separate field.

#### Scenario: Create partner requires street house and Berlin zip

- **WHEN** `createPartner` is called without street, house number, or a valid Berlin zip
- **THEN** the create is rejected

#### Scenario: Create partner composes display address

- **WHEN** `createPartner` succeeds with structured location fields
- **THEN** the partner row stores those fields and a composed display `address`

#### Scenario: Partner structured fields support event prefill

- **WHEN** an admin on the new-event form selects a partner with structured location stored
- **THEN** the event form can copy street, house number, optional line2, and zip from that partner

### Requirement: Admin partners list domain returns event counts and honors sort

The system SHALL support server-side sorting of the admin partner list in `@unveiled/db` (`listPartners`) and SHALL return, per partner, a count of events (`eventCount`) and a count of active events (`activeEventCount`) as part of the list result, computed from `events` via aggregate, without new schema columns. `PartnerSort` SHALL be `"name" | "created" | "events"` (URL-stable identifiers). When `sort` is `"events"`, ordering SHALL use `activeEventCount` (not total `eventCount`). `ListPartnersOptions` SHALL accept optional `sort`, `desc`, and `now` (active reference instant). When `sort` is omitted, ordering SHALL remain `created_at` descending then `id` descending. An event SHALL count as **active** when `date_time >= now` and `remaining_capacity > 0`. Name search SHALL remain name-only via the existing partner name filter. `countPartners` SHALL count partner rows matched by that same name filter so pagination totals stay correct. Default page size SHALL remain 25 with offset pagination.

#### Scenario: Partner list sort by name

- **WHEN** an ADMIN requests the partner list with `sort=name` and ascending direction
- **THEN** partners are ordered alphabetically by name ascending

#### Scenario: Partner list sort by last created

- **WHEN** an ADMIN requests the partner list with `sort=created` and descending direction
- **THEN** partners are ordered by `created_at` descending
- **AND** `id` descending is used as the tiebreak

#### Scenario: Partner list sort by active events

- **WHEN** an ADMIN requests the partner list with `sort=events` and descending direction
- **THEN** partners are ordered by their active event count descending
- **AND** `id` descending is used as the tiebreak

#### Scenario: Partner list returns active-event counts

- **WHEN** an ADMIN lists partners
- **THEN** each partner includes `eventCount` (all events for that partner) and `activeEventCount` using the active predicate (`date_time >= now` and `remaining_capacity > 0`)

#### Scenario: Default sort unchanged when sort omitted

- **WHEN** `listPartners` is called without a `sort` option
- **THEN** partners are ordered by `created_at` descending then `id` descending

#### Scenario: Partner count honors the name filter

- **WHEN** an ADMIN filters the partner list by a name query
- **THEN** the count used for pagination matches the number of filtered partner rows

### Requirement: Admin partner list Name filter and active-events column

The admin partner list (`/:locale/admin/partners`) SHALL label its search filter **Name** (DE: **Name**), consistent with the table's Name column, and SHALL display an **Active events** column per partner using the `activeEventCount` from the list domain. The shared admin search placeholder used by the events list ("Search title or partner" / "Titel oder Partner suchen") SHALL NOT be used on the partner list. `AdminSearchForm` SHALL accept an optional placeholder/label override so only the partner call site changes.

#### Scenario: Partner search filter is labeled Name

- **WHEN** an ADMIN opens the partner list
- **THEN** the search field placeholder/label reads **Name**
- **AND** it does not read "Search title or partner" or "Titel oder Partner suchen"

#### Scenario: Partner list shows active events

- **WHEN** an ADMIN views the partner list with at least one partner row
- **THEN** each partner row shows an **Active events** count from `activeEventCount`

#### Scenario: Events list search placeholder unchanged

- **WHEN** an ADMIN opens the events list
- **THEN** the search field still uses the existing title-or-partner placeholder copy

### Requirement: Admin partner list sort controls

The admin partner list SHALL offer server-driven sorting by Name, Created (last created), and Active events via **clickable table column headers** (not search-bar controls), each toggling ascending/descending. Query params `sort` (`name` | `created` | `events`) and `dir` (`asc` | `desc`) SHALL be preserved across name search submits (hidden fields) and pagination. The `sort=events` value SHALL order by **active** event count (same definition as the Active events column), not total event count. When `sort` is omitted, the list SHALL keep the domain default (last-created descending). A **Reset filters** control SHALL clear both the name query and sort params (returning to the default last-created sort). Sort controls in the search bar SHALL NOT be used. Page size SHALL remain 25 with offset pagination. Localized admin copy SHALL include an Export action label used by the partner-list Export control that navigates to the sales-export page.

#### Scenario: Sort by name ascending

- **WHEN** an ADMIN clicks the Name column header on the partner list
- **THEN** the list orders by partner name ascending (or toggles direction if Name is already active)

#### Scenario: Sort by active events descending

- **WHEN** an ADMIN clicks the Active events column header when another sort is active
- **THEN** the list orders by active event count descending

#### Scenario: Search preserves sort

- **WHEN** an ADMIN has a non-default sort and submits a name search
- **THEN** the resulting URL retains `sort` and `dir` together with `q`

#### Scenario: Reset filters clears search and sort

- **WHEN** an ADMIN follows Reset filters with an active query and/or non-default sort
- **THEN** the list returns to `/admin/partners` with default last-created ordering and no search query

#### Scenario: Sort persists across pagination

- **WHEN** an ADMIN sorts the list and navigates to another page
- **THEN** the `sort` and `dir` parameters are preserved in pagination links

#### Scenario: Sort persists across name filter submit

- **WHEN** an ADMIN has an active sort/direction and submits a name search
- **THEN** the resulting URL retains `sort` and `dir` together with `q`

#### Scenario: Default sort when params omitted

- **WHEN** an ADMIN opens `/:locale/admin/partners` with no `sort` query param
- **THEN** partners are ordered by last created descending (domain default)

### Requirement: Partner list Export action

The admin partner list (`/:locale/admin/partners`) SHALL provide an **Export** action that navigates to the sales-export page (`/:locale/admin/partners/export`). The action SHALL be available at list level (toolbar), not as a partner-row-scoped export, because the report covers all events for a chosen period.

#### Scenario: Partner list links to sales export

- **WHEN** an ADMIN views the partner list
- **THEN** an **Export** action is available that opens the sales-export page

### Requirement: BDD and e2e cover partner list sorting and active events

The Gherkin feature file and Playwright coverage (or a named deferral) SHALL cover the partner list **Name** filter label, the three sort modes with both directions, the **Active events** column, and the **Export** action, using proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Product scenarios SHALL live in `docs/product/features/admin-partners.feature` (or a dedicated admin sales-export feature file only if split during apply). Coverage-matrix rows SHALL exist for each new scenario with status `pass` or an explicit named deferral (owner/reason). Sitemap and related product docs SHALL describe the list query params and the Export entry to the sales-export route.

#### Scenario: Feature file documents partner list enhancements

- **WHEN** a reader opens `docs/product/features/admin-partners.feature` after this step
- **THEN** it includes scenarios for the Name filter, sorting (all three modes, asc/desc), the Active events column, and the Export action

#### Scenario: Coverage matrix lists partner list scenarios

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for sorting, active column, and export (pass or named deferral)

#### Scenario: Playwright mirrors partner list scenarios

- **WHEN** `bun run test:e2e` runs the admin-partners Playwright file against a configured environment
- **THEN** each new partner-list Scenario either passes with proximity/layout selectors or is recorded as a named env/harness deferral in the coverage matrix

### Requirement: Partner weekly opening hours

The system SHALL persist optional venue opening hours on `partners` as `has_opening_hours` (boolean, not null, default false) and `opening_hours` (jsonb, nullable). When `has_opening_hours` is false, `opening_hours` MUST be null. When `has_opening_hours` is true, `opening_hours` MUST contain exactly the seven keys `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`, each either `{ "closed": true }` or `{ "open": "HH:MM", "close": "HH:MM" }` with `open` strictly before `close` on the same calendar day. Overnight spans are not supported. Create and update partner domain operations SHALL validate this contract and reject invalid payloads with a catalog validation error. Wall times are Europe/Berlin local times for display purposes (no per-partner timezone column).

#### Scenario: Enable hours with a full week

- **WHEN** an admin creates or updates a partner with `has_opening_hours` true and a valid seven-day schedule
- **THEN** the partner row stores both fields
- **AND** subsequent reads return the same schedule

#### Scenario: Disable hours clears schedule

- **WHEN** an admin updates a partner with `has_opening_hours` false
- **THEN** `opening_hours` is stored as null
- **AND** public consumers MUST treat hours as absent

#### Scenario: Invalid range rejected

- **WHEN** a day has `open` greater than or equal to `close`, or a day key is missing while hours are enabled
- **THEN** the write is rejected without partial persistence of an invalid schedule

### Requirement: Admin partner form opening hours toggle

Admin partner create and edit pages SHALL include a native checkbox to enable opening hours. When checked, the form SHALL show one row per weekday (Monday–Sunday) with a native “closed” checkbox and native time inputs for open and close. When unchecked, weekday controls are hidden or ignored and the submitted write clears stored hours per domain rules. Mutations SHALL use the existing SSR form POST partner create/edit routes (no client-only mutation modal). Copy SHALL be available in DE and EN.

#### Scenario: Toggle reveals weekday rows

- **WHEN** an admin checks the opening-hours toggle on create or edit
- **THEN** seven weekday rows appear for open/close (or closed)

#### Scenario: Save enabled hours

- **WHEN** an admin submits a valid enabled schedule
- **THEN** the partner is saved with `has_opening_hours` true and the weekly JSON

#### Scenario: Uncheck clears public hours

- **WHEN** an admin unchecks the toggle and saves
- **THEN** the partner is saved with hours disabled and no schedule for public display

### Requirement: Admin partners feature documents opening hours

`docs/product/features/admin-partners.feature` SHALL include scenarios for enabling weekly opening hours on create/edit, validating incomplete/invalid ranges, and disabling hours so they no longer appear on public event detail. Playwright coverage SHALL follow the BDD contract (proximity selectors; R2 skip only when logo upload is required for the scenario setup).

#### Scenario: Feature file covers enable validate and disable

- **WHEN** a reader follows `admin-partners.feature` after this step
- **THEN** scenarios cover enabling a full week, rejecting invalid/incomplete ranges, and disabling hours

#### Scenario: Playwright covers admin hours and public omit

- **WHEN** admin partner and event-discovery e2e run with required env
- **THEN** coverage includes saving enabled hours and asserting public detail shows or omits hours per `has_opening_hours`
- **AND** selectors remain proximity/layout only

### Requirement: Optional partner barrier-free flag

The system SHALL persist optional barrier-free accessibility on `partners.barrier_free` as a nullable boolean (`true` or `NULL`). Create MAY omit the field and MUST store `NULL`. Update SHALL accept `true` or `NULL` (clear). A write of `false` SHALL be stored as `NULL`. The system SHALL return `barrierFree` on partner reads used by admin and public event-detail partner fetches (`getPartnerById`, `listPartners`, `listFeaturedPartners`). Barrier-free SHALL NOT be stored on events; `events.barrier_free` SHALL NOT exist after the cutover migration.

#### Scenario: Create partner omits barrier-free

- **WHEN** an admin creates a partner without a barrier-free value
- **THEN** `partners.barrier_free` is `NULL`

#### Scenario: Create partner sets barrier-free

- **WHEN** an admin creates a partner with barrier-free true
- **THEN** `partners.barrier_free` is true
- **AND** subsequent `getPartnerById` and `listPartners` results include `barrierFree` true

#### Scenario: Update partner sets barrier-free

- **WHEN** an admin updates a partner with barrier-free true
- **THEN** `partners.barrier_free` is true

#### Scenario: Update partner clears barrier-free

- **WHEN** an admin updates a partner with barrier-free null
- **THEN** `partners.barrier_free` is `NULL`

#### Scenario: Update omits barrier-free leaves existing value

- **WHEN** an admin updates other partner fields without sending barrier-free
- **THEN** `partners.barrier_free` is unchanged

### Requirement: Admin sets barrier-free on the partner form

Admin partner create and edit SHALL include an optional native select for barrier-free accessibility (Yes/No), labeled Barrierefrei / Barrier-free, placed near opening hours. Yes stores `partners.barrier_free = true`. No stores `NULL`. The control SHALL be a native `<select>` (or existing `AdminFormSelect` wrapper), not HeroUI `Select`. Mutations SHALL use the existing SSR form POST partner create/edit routes (no client-only mutation modal). Copy SHALL reuse existing admin Yes/No and barrier-free labels (DE/EN).

#### Scenario: Set barrier-free on create

- **WHEN** I create a partner and set barrier-free to Yes
- **THEN** the partner is stored with barrier_free true

#### Scenario: Clear barrier-free on edit

- **WHEN** I edit a partner and set barrier-free to No
- **THEN** the partner is stored with barrier_free null

#### Scenario: Default is unset

- **WHEN** I create a partner without changing the barrier-free select (No / off)
- **THEN** the partner is stored with barrier_free null

### Requirement: Admin partners feature documents barrier-free

`docs/product/features/admin-partners.feature` SHALL include scenarios titled `Set barrier-free on create` and `Clear barrier-free on edit`. Playwright in `e2e/specs/admin-partners.spec.ts` SHALL use those titles verbatim. Selectors SHALL remain proximity/layout only. Scenarios that create a partner via UI MAY env-skip when R2 vars are missing (logo required).

#### Scenario: Feature file covers set and clear

- **WHEN** a reader follows `admin-partners.feature` after this step
- **THEN** it includes `Set barrier-free on create` and `Clear barrier-free on edit`

#### Scenario: Playwright covers partner barrier-free

- **WHEN** admin partner e2e runs with required env
- **THEN** coverage includes setting Yes on create and No on edit
- **AND** selectors remain proximity/layout only
