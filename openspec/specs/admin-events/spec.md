# Admin Events

ADMIN catalog management for events, including the Featured curation tab used by Discover and per-event gallery photo management.

## Requirements

### Requirement: Admin manages event gallery photos

Admins SHALL be able to add multiple gallery photos to an existing event in one submission and remove individual or multiple gallery photos through SSR confirmation pages with form POST. Gallery management SHALL be ADMIN-only under locale-prefixed routes such as `/:locale/admin/events/:id/gallery` (list), `.../gallery/add` (multi-upload), and `.../gallery/remove` (confirm remove). Mutations SHALL NOT use client-only modals. Selection for bulk remove SHALL NOT use checkbox or radio inputs; the system SHALL use native multi-select and/or discrete per-photo remove links. Each uploaded file SHALL be processed into five WebP variants client-side and persisted as gallery images (separate from the required primary `events.image_id`). Removal SHALL call the catalog remove path so associations disappear from the gallery list and unreferenced image objects are cleaned up per image-upload rules. The gallery SHALL respect the configured maximum (12) enforced by the domain layer. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include scenarios that match these routes and SSR confirm behavior (proximity/layout selectors only) and SHALL describe five WebP variants (not six JPEG). Admin-visible empty-state, capacity, and validation error copy SHALL be present for the manage surfaces.

#### Scenario: Admin multi-upload gallery photos

- **WHEN** an admin opens the event gallery add page and submits multiple valid image files
- **THEN** each file is processed into five WebP variants client-side and stored as gallery images for that event
- **AND** the admin is redirected to the event gallery list showing the new photos

#### Scenario: Admin removes selected gallery photos

- **WHEN** an admin confirms removal of one or more gallery images on the remove page
- **THEN** those images disappear from the event gallery list
- **AND** unreferenced image objects are cleaned up from storage per existing image-upload rules

#### Scenario: Admin removes a single gallery photo via discrete action

- **WHEN** an admin opens remove confirm for one gallery image id from the gallery list
- **AND** confirms with form POST
- **THEN** that image is removed from the event gallery list

#### Scenario: Non-admin cannot open gallery manage routes

- **WHEN** a USER or unauthenticated visitor requests `/:locale/admin/events/:id/gallery`
- **THEN** access is denied per existing admin route guards (redirect or forbidden consistent with other `/admin/*` routes)

#### Scenario: Gallery manage is available for existing events

- **WHEN** an admin opens the edit page for an existing event
- **THEN** they have a path to manage that event’s gallery photos
- **AND** gallery manage is not required on the create-event form

#### Scenario: Gallery capacity is enforced

- **WHEN** an admin attempts to add gallery photos that would exceed the maximum of 12 images for the event
- **THEN** the add is rejected with an admin-visible error
- **AND** the primary hero image is unchanged

#### Scenario: Product feature file documents gallery manage routes

- **WHEN** an agent reads `docs/product/features/admin-events.feature`
- **THEN** it includes scenarios for multi-upload add, SSR remove confirm (single and/or multi), and capacity enforcement aligned to `/admin/events/:id/gallery*`
- **AND** image-processing steps describe five WebP variants (not six JPEG)

### Requirement: Admin event image Gherkin and e2e match WebP pipeline
Product Gherkin in `docs/product/features/admin-events.feature` and Playwright coverage in `e2e/specs/admin-events.spec.ts` (plus coverage-matrix rows) SHALL describe required primary event image supply via the five-WebP client Pica pipeline, including WebP variant URL/field assertions where image specs run. Selectors SHALL remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`. Image scenarios MAY continue to env-skip when R2 vars are missing using the existing documented skip pattern.

#### Scenario: Feature file requires primary image as five WebP
- **WHEN** a reader follows `admin-events.feature` create/image scenarios after this step
- **THEN** primary image supply is mandatory and described as five WebP variants (not six JPEG / not `original.jpg`)

#### Scenario: Playwright asserts WebP when R2 present
- **WHEN** admin event image e2e runs with R2 env configured
- **THEN** assertions expect `.webp` variant URLs or prebuilt WebP field names consistent with `@unveiled/images`

### Requirement: Automated coverage for admin remove from featured

The system’s BDD/e2e suite SHALL cover admin remove-from-featured: after confirm POST, the event SHALL disappear from Discover’s featured list and SHALL remain in the admin events catalog (`/:locale/admin/events`). Product docs / admin feature scenarios SHALL state that remove deletes only the `featured_events` membership row. Playwright SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin remove from featured keeps catalog event

- **WHEN** an admin removes an event from Featured
- **THEN** Discover no longer lists it
- **AND** the event remains in the admin events catalog

#### Scenario: Admin featured remove is documented

- **WHEN** a reader opens admin Featured scenarios in product docs (or `event-discovery` / admin feature files that cover Featured)
- **THEN** remove-from-featured is specified as keeping the underlying catalog event

### Requirement: Admin Markdown description acceptance scenarios

The admin event feature file (`docs/product/features/admin-events.feature`) SHALL describe Markdown authoring on create/edit (and series via shared base fields) and that the stored value is Markdown source. Scenarios SHALL state that guests see rendered Markdown on the public event detail page. Playwright coverage, if added, SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin authors Markdown description

- **WHEN** an admin creates or edits an event and enters Markdown in the description editor
- **THEN** the event is saved with that Markdown source
- **AND** guests see rendered Markdown on the public event detail page

#### Scenario: Product feature file documents Markdown description

- **WHEN** an agent reads `docs/product/features/admin-events.feature` after this step
- **THEN** it includes scenarios covering Markdown authoring on create/edit (and series via shared base fields) and public render of the stored Markdown

### Requirement: Admin edits event description as Markdown

The system SHALL provide an MDXEditor-based Markdown editor on admin event create, edit, and series forms for the description field. The editor SHALL submit Markdown source through the existing SSR form field `description`. Stored descriptions SHALL remain Markdown text in `events.description` and SHALL be shown on the public event detail page per the `event-catalog` Markdown rendering requirements. Creating or editing an event with a description SHALL accept Markdown source for the description field (toolbar-assisted via MDXEditor) while other required fields remain unchanged. When an admin updates an event's title, description, image, price, or redemption configuration, the description value MAY include Markdown. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include acceptance scenarios for Markdown authoring and public render.

#### Scenario: Create with Markdown description

- **WHEN** an admin creates an event and authors a description with headings and a list in the Markdown editor
- **THEN** the saved `events.description` value is the Markdown source
- **AND** the public event detail page renders that Markdown

#### Scenario: Edit preserves Markdown source

- **WHEN** an admin opens an existing event edit page
- **THEN** the Markdown editor is initialized with the stored description source
- **AND** saving without intentional edits does not strip the Markdown structure

#### Scenario: Series create uses the same editor

- **WHEN** an admin opens the series create form
- **THEN** the shared base fields include the same MDXEditor-based description control

#### Scenario: Create required fields unchanged

- **WHEN** an admin creates an event with a Markdown description plus the existing required fields (title, partner, credit price, capacity, image, dateTime, redemption config as applicable)
- **THEN** validation and persistence rules for those other fields remain unchanged

### Requirement: Description mutations stay SSR form POST

The system SHALL continue to persist description changes only via dedicated admin page form POST (create/edit/series). Client-side-only save APIs for description are out of scope.

#### Scenario: Submit uses form field

- **WHEN** an admin submits the event form
- **THEN** the request body includes `description` as Markdown text from the editor sync field

### Requirement: Multi-value event metadata uses checkbox multi-selects
The admin event create/edit form SHALL collect supported languages via a searchable native-checkbox multi-select (same interaction model as onboarding preferred languages) and target age groups via a native-checkbox multi-select without a search filter. Series builder weekday selection SHALL use a native-checkbox multi-select without search. Single-value choice fields SHALL continue to use a native HTML `select`.

#### Scenario: Languages multi-select with search
- **WHEN** an admin opens create or edit event
- **THEN** languages are chosen with checkboxes and a search filter that narrows visible options without dropping already-selected values from the POST payload

#### Scenario: Age groups multi-select without search
- **WHEN** an admin opens create or edit event
- **THEN** target age groups are chosen with checkboxes and no search filter control

#### Scenario: Series weekdays use checkbox multi-select
- **WHEN** an admin opens the series create form
- **THEN** builder weekdays are chosen with checkboxes and no search filter control
- **AND** single-value fields on the form continue to use a native HTML `select`

### Requirement: Partner location prefill on add only
When creating a single event or an event series, changing the partner control SHALL prefill the event address from that partner's stored address and SHALL attempt to update the map location from that address. When editing an existing event, changing the partner control SHALL NOT overwrite the event address or map coordinates.

#### Scenario: Add event prefills address and map from partner
- **WHEN** an admin on the new-event (or series-create) form selects a partner from the dropdown
- **THEN** the address field is set to that partner's address
- **AND** the map pin updates to a geocode of that address when geocoding succeeds

#### Scenario: Edit event keeps existing location when partner changes
- **WHEN** an admin on the edit-event form changes the partner
- **THEN** the existing address and map coordinates remain unchanged until the admin edits them manually

#### Scenario: Geocode soft-fails leave address filled
- **WHEN** an admin on the new-event form selects a partner whose address cannot be geocoded
- **THEN** the address field is still set to that partner's address
- **AND** the map location is left unchanged (or at its prior default)

### Requirement: BDD coverage for form control and prefill UX
Gherkin scenarios for checkbox multi-select languages/age groups (and series weekdays) and add-only partner address/map prefill SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Address prefill on add (and non-overwrite on edit) MUST be covered; live Nominatim map-pin success MAY be deferred when CI cannot reach Nominatim reliably.

#### Scenario: Coverage matrix lists new admin form scenarios
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new admin-events scenarios (pass or explicit deferral)

#### Scenario: Admin languages and age groups use checkbox multi-selects
- **WHEN** an admin opens create or edit event
- **THEN** Playwright can assert languages and target age groups are chosen with checkboxes (languages expose a search filter; age groups do not)
- **AND** selectors remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`

#### Scenario: Add event prefills partner address
- **WHEN** an admin on the new-event (or series-create) form selects a partner that has a stored address
- **THEN** Playwright asserts the address field is set to that partner's address
- **AND** live map-pin geocode success is not required for the scenario to pass (soft-fail leaves map unchanged)

#### Scenario: Edit event does not overwrite location when partner changes
- **WHEN** an admin on the edit-event form changes the partner
- **THEN** Playwright asserts the existing address remains unchanged
