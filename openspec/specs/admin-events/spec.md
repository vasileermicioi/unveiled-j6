# Admin Events

ADMIN catalog management for events, including the Featured curation tab used by Discover and per-event gallery photo management.

## Requirements

### Requirement: Admin manages event gallery photos

Admins SHALL be able to add, reorder, and remove gallery photos for any existing catalog event through ADMIN-only SSR routes under `/:locale/admin/events/:id/gallery*` (list), `.../gallery/add` (multi-upload), and `.../gallery/remove` (confirm remove). Gallery management entry SHALL be available from the admin Events list and/or the event edit page. Featured Discover membership SHALL NOT be required to manage an event's gallery; the Featured list MAY retain a convenience gallery shortcut but SHALL NOT be the sole entry. Create-event forms SHALL NOT require gallery manage. Mutations SHALL use dedicated pages with form POST (no client-only modals). Selection for bulk remove SHALL NOT use checkbox or radio inputs; the system SHALL use native multi-select and/or discrete per-photo remove links. Each uploaded file SHALL be processed into five WebP variants client-side and persisted as gallery images (separate from the required primary `events.image_id`). Removal SHALL call the catalog remove path so associations disappear from the gallery list and unreferenced image objects are cleaned up per image-upload rules. There is **no hard count cap** on gallery photos; primary `events.image_id` remains separate. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include scenarios that match these routes and SSR confirm behavior (proximity/layout selectors only), SHALL describe five WebP variants (not six JPEG), and SHALL document Events list/edit gallery entry (not Featured-exclusive). Admin-visible empty-state and validation error copy SHALL be present for the manage surfaces.

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

#### Scenario: Gallery manage is available from the Events catalog

- **WHEN** an admin opens the Events list or an event edit page for an existing catalog event
- **THEN** they see a path to manage that event's gallery photos
- **AND** the event need not be on the Featured list
- **AND** gallery manage is not required on the create-event form

#### Scenario: Non-featured event can have a gallery managed

- **WHEN** an admin opens gallery manage for an event that is not in `featured_events`
- **THEN** add/remove/reorder gallery flows work the same as for featured events

#### Scenario: Product feature file documents gallery manage routes

- **WHEN** an agent reads `docs/product/features/admin-events.feature`
- **THEN** it includes scenarios for multi-upload add, SSR remove confirm (single and/or multi), and Events list/edit gallery entry aligned to `/admin/events/:id/gallery*`
- **AND** image-processing steps describe five WebP variants (not six JPEG)
- **AND** it does not require Featured membership as the sole gallery manage entry
- **AND** it does not require a hard gallery photo count cap

### Requirement: Gallery manage product docs and e2e

Product Gherkin, UI component map, image-uploads §8a, DEPLOYMENT demo script, and Playwright SHALL state that gallery manage is available for any existing catalog event from the admin Events list and/or event edit page. Featured-list gallery entry, if present, is optional convenience. Coverage matrix rows SHALL use the updated scenario titles.

#### Scenario: Product docs describe per-event gallery admin entry

- **WHEN** a reader opens `admin-events.feature` and `ui-component-map.md`
- **THEN** gallery manage is documented on Events/edit, not as Featured-exclusive

#### Scenario: Playwright covers gallery manage from Events

- **WHEN** admin gallery e2e runs with required env
- **THEN** it asserts a path from Events list or edit to gallery manage (proximity/layout selectors only)

#### Scenario: Coverage matrix lists updated gallery entry scenario

- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** the gallery manage entry scenario maps to the updated Playwright title with `pass` or named env `skip`
- **AND** no matrix row claims Featured-exclusive gallery manage as current MVP behavior

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

The admin event feature file (`docs/product/features/admin-events.feature`) SHALL describe Markdown authoring on create/edit and that the stored value is Markdown source. Scenarios SHALL state that guests see rendered Markdown on the public event detail page. Playwright coverage, if added, SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin authors Markdown description

- **WHEN** an admin creates or edits an event and enters Markdown in the description editor
- **THEN** the event is saved with that Markdown source
- **AND** guests see rendered Markdown on the public event detail page

#### Scenario: Product feature file documents Markdown description

- **WHEN** an agent reads `docs/product/features/admin-events.feature` after this step
- **THEN** it includes scenarios covering Markdown authoring on create/edit and public render of the stored Markdown

### Requirement: Admin edits event description as Markdown

The system SHALL provide an MDXEditor-based Markdown editor on admin event create and edit forms for the description field. The editor SHALL submit Markdown source through the existing SSR form field `description`. Stored descriptions SHALL remain Markdown text in `events.description` and SHALL be shown on the public event detail page per the `event-catalog` Markdown rendering requirements. Creating or editing an event with a description SHALL accept Markdown source for the description field (toolbar-assisted via MDXEditor) while other required fields remain unchanged. When an admin updates an event's title, description, image, price, or redemption configuration, the description value MAY include Markdown. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include acceptance scenarios for Markdown authoring and public render.

#### Scenario: Create with Markdown description

- **WHEN** an admin creates an event and authors a description with headings and a list in the Markdown editor
- **THEN** the saved `events.description` value is the Markdown source
- **AND** the public event detail page renders that Markdown

#### Scenario: Edit preserves Markdown source

- **WHEN** an admin opens an existing event edit page
- **THEN** the Markdown editor is initialized with the stored description source
- **AND** saving without intentional edits does not strip the Markdown structure

#### Scenario: Create required fields unchanged

- **WHEN** an admin creates an event with a Markdown description plus the existing required fields (title, partner, credit price, capacity, image, dateTime, redemption config as applicable)
- **THEN** validation and persistence rules for those other fields remain unchanged

### Requirement: Description mutations stay SSR form POST

The system SHALL continue to persist description changes only via dedicated admin page form POST (create/edit). Client-side-only save APIs for description are out of scope.

#### Scenario: Submit uses form field

- **WHEN** an admin submits the event form
- **THEN** the request body includes `description` as Markdown text from the editor sync field

### Requirement: Language-independent event option
The system SHALL allow ADMIN to mark an event as language-independent on create and edit forms. The control SHALL be a native HTML checkbox labeled for humans as **Language-independent** (DE: **Sprachunabhängig**), with short helper copy that this is for events with no spoken-language requirement (e.g. art exhibitions). When the option is checked, the languages multi-select SHALL be hidden and MUST NOT be required. Persisted state SHALL set `language_independent = true` and `languages = null`. When unchecked, the existing searchable languages multi-select behavior SHALL remain available. Catalog create/update SHALL coerce `languages` to null whenever `language_independent` is true, even if the form POST still includes language values.

#### Scenario: Check language-independent hides languages picker
- **WHEN** an admin opens create or edit event
- **AND** checks Language-independent
- **THEN** the languages multi-select is not shown
- **AND** saving stores language-independent true with no language list

#### Scenario: Uncheck language-independent restores languages picker
- **WHEN** an admin clears Language-independent on edit
- **THEN** the languages multi-select is shown again
- **AND** they may select zero or more languages as today

#### Scenario: Domain coerces languages when flag is true
- **WHEN** create or update event is called with `language_independent = true` and a non-empty languages array
- **THEN** the persisted event has `language_independent = true` and `languages = null`

### Requirement: Multi-value event metadata uses checkbox multi-selects
The admin event create/edit form SHALL collect supported languages via a searchable native-checkbox multi-select (same interaction model as onboarding preferred languages) and target age groups via a native-checkbox multi-select without a search filter, except that when Language-independent is checked the languages multi-select SHALL NOT be shown or required. Other single-value choice fields (partner, category, etc.) SHALL continue to use a native HTML `select` unless a documented exception applies. Supported languages and language-independent are mutually exclusive in the UI: language-independent checked means languages are not collected.

#### Scenario: Languages multi-select with search
- **WHEN** an admin opens create or edit event
- **AND** Language-independent is unchecked
- **THEN** languages are chosen with a searchable checkbox multi-select
- **AND** only a short default list is shown until search is used
- **AND** a hint explains that search is needed to find other languages
- **AND** already-selected values remain available for the form POST even when filtered out of the visible list

#### Scenario: Age groups multi-select without search
- **WHEN** an admin opens create or edit event
- **THEN** target age groups are chosen with checkboxes and no search filter control

### Requirement: Admin event location authoring
Admin create/edit SHALL collect a postal code (`zip_code` / form field `zipCode`) instead of neighborhood/Kiez, with country and city prefilled to Germany (`DE`) and Berlin (`berlin`) and not user-selectable in this release. Country and city SHALL be visibly shown as fixed (disabled/readonly or equivalent non-editable display) with submitted values `DE` / `berlin`. The zip control SHALL be a native text input validated via the shared postal registry for `(DE, berlin)`. Street location SHALL be collected as structured native fields (`street`, `house_number`, optional `address_line2`) with structured geocode preview (line2 excluded). The form SHALL NOT ship a city/country picker.

#### Scenario: Admin sets Berlin zip on create
- **WHEN** an admin creates an event with a valid Berlin PLZ and other required fields
- **THEN** the event is saved with `country=DE`, `city=berlin`, and that `zip_code`

#### Scenario: Admin invalid zip rejected
- **WHEN** an admin submits a non-Berlin or malformed zip
- **THEN** the form is rejected with an admin-visible error

#### Scenario: Country and city are fixed on the form
- **WHEN** an admin opens create or edit event
- **THEN** country and city are shown prefilled as Germany and Berlin
- **AND** the admin cannot change country or city via the form
- **AND** no neighborhood/Kiez select is shown

### Requirement: Address is the only admin location input
Admin event create and edit forms SHALL collect street location via structured native fields — required street, required house number, optional address line 2 — not via latitude, longitude, map zoom, or a free-text address authoring field. Postal location SHALL be collected separately as country/city/zip under the admin event location authoring rules. The system SHALL NOT present latitude, longitude, or map zoom as admin-editable fields. A map MAY be shown to preview a **structured** geocode of street + house number + postal fields (including partner-prefill geocode on create); `address_line2` SHALL be excluded from the geocode query. The map preview marker SHALL NOT be draggable and SHALL NOT treat map click or zoom as the source of truth for coordinates. Geocode failure SHALL NOT block saving a valid structured location; the map preview MAY remain at a prior or default view. Derived `lat`/`lng` MAY be posted from the geocode preview as hidden fields when a geocode (or preserved existing coordinates on edit) is resolved; the system MUST NOT persist default map-center coordinates as if they were a successful geocode. Display `address` SHALL be composed server-side on write.

#### Scenario: Add event prefills structured location and map from partner
- **WHEN** an admin is on the new-event form and selects a partner
- **THEN** the street, house number, optional line2, and zip fields are set from that partner
- **AND** the map preview updates to a structured geocode when geocoding succeeds

#### Scenario: Edit event keeps existing location when partner changes
- **WHEN** an admin is on the edit-event form and changes the partner
- **THEN** the existing structured location fields remain unchanged until edited manually
- **AND** the map preview follows the current structured geocode rules (not a silent partner overwrite)

#### Scenario: Geocode soft-fails leave structured location filled
- **WHEN** an admin selects a partner whose location cannot be geocoded
- **THEN** the structured location fields are still set
- **AND** saving the event with that location succeeds
- **AND** the map preview may stay unchanged
- **AND** the saved event MUST NOT store invented default-center coordinates for that failed geocode

#### Scenario: No admin lat lng or zoom controls
- **WHEN** an admin opens create or edit event
- **THEN** no latitude, longitude, or map zoom number fields are shown
- **AND** the map marker is not offered as a drag-to-set authoring control
- **AND** no free-text address authoring field is shown as the street-location source of truth

### Requirement: Partner location prefill on add only
When creating a single event, changing the partner control SHALL prefill the event structured location fields (`street`, `house_number`, optional `address_line2`, `zip_code`) from that partner's stored structured fields and SHALL attempt to update the map **preview** from a structured geocode (line2 excluded). When editing an existing event, changing the partner control SHALL NOT overwrite the event structured location fields. Map coordinates on edit SHALL follow structured-geocode rules and MUST NOT be silently replaced from the newly selected partner's location.

#### Scenario: Add event prefills structured location and map from partner
- **WHEN** an admin on the new-event form selects a partner from the dropdown
- **THEN** street, house number, optional line2, and zip are set from that partner
- **AND** the map preview updates to a structured geocode when geocoding succeeds

#### Scenario: Edit event keeps existing location when partner changes
- **WHEN** an admin on the edit-event form changes the partner
- **THEN** the existing structured location fields remain unchanged until the admin edits them manually
- **AND** the map preview is not silently overwritten from the new partner's location

#### Scenario: Geocode soft-fails leave structured location filled
- **WHEN** an admin on the new-event form selects a partner whose location cannot be geocoded
- **THEN** the structured location fields are still set from that partner
- **AND** the map preview is left unchanged (or at its prior default)
- **AND** saving the event with that location succeeds

### Requirement: BDD coverage for form control and prefill UX
Gherkin scenarios for checkbox multi-select languages/age groups and add-only partner structured-location/map prefill SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Structured street/house/zip prefill on add (and non-overwrite on edit) MUST be covered; live Nominatim map-pin success MAY be deferred when CI cannot reach Nominatim reliably.

#### Scenario: Coverage matrix lists new admin form scenarios
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new admin-events scenarios (pass or explicit deferral)

#### Scenario: Admin languages and age groups use checkbox multi-selects
- **WHEN** an admin opens create or edit event
- **THEN** Playwright can assert languages and target age groups are chosen with checkboxes (languages expose a search filter; age groups do not)
- **AND** selectors remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`

#### Scenario: Add event prefills partner structured location
- **WHEN** an admin on the new-event form selects a partner that has stored structured location fields
- **THEN** Playwright asserts street, house number, and zip fields are set from that partner
- **AND** live map-pin geocode success is not required for the scenario to pass (soft-fail leaves map unchanged)

#### Scenario: Edit event does not overwrite location when partner changes
- **WHEN** an admin on the edit-event form changes the partner
- **THEN** Playwright asserts the existing structured location fields remain unchanged

### Requirement: Admin event form ticket types and voucher inventory islands

Admin event create and edit forms SHALL offer ticket types `SECRET_CODE`, `VOUCHER_PROMO`, and `VOUCHER_PDF` via the shared base fields. `SECRET_CODE` SHALL show a manual secret-code text field and SHALL NOT show a secret-code mode control. `VOUCHER_PROMO` SHALL show `event_website_url` plus a client preview island for text/CSV (or paste) promo codes. `VOUCHER_PDF` SHALL show a client island with an import mode choice: (1) split one master PDF — text input for pages to skip (comma-separated pages and inclusive ranges, e.g. `1-3,7,9-10`) plus pages per ticket, showing only the resulting ticket count; or (2) multiple PDF files, each file one ticket, showing the file count as tickets. For `VOUCHER_PROMO` and `VOUCHER_PDF`, the capacity number field SHALL be hidden — `total_capacity` is derived from inventory size on SSR create/edit. Persistence of inventory SHALL occur only through the existing SSR form POST path (hidden staged fields and/or prior authenticated admin PDF upload that returns object keys). Theme and HeroUI rules SHALL match AGENTS.md (native file/number/text controls; no client-only inventory mutation modals).

#### Scenario: Secret code has no mode field

- **WHEN** an admin opens create or edit with ticket type `SECRET_CODE`
- **THEN** they can enter a secret code
- **AND** no secret-code mode select is shown

#### Scenario: Promo inventory island on create

- **WHEN** an admin chooses `VOUCHER_PROMO` on create
- **THEN** they see the website URL field and a file/paste control that previews codes before submit

#### Scenario: PDF inventory island on create

- **WHEN** an admin chooses `VOUCHER_PDF` on create
- **THEN** they see PDF upload plus skip and pages-per-ticket number inputs
- **AND** a preview of derived tickets before submit

### Requirement: Admin edit shows voucher inventory summary

When an admin opens edit for an event with voucher inventory, the form SHALL show available and allocated counts for the relevant inventory type(s). Counts SHALL be loaded server-side for the edit page (catalog inventory count helper) and rendered with HeroUI chrome.

#### Scenario: Edit shows available and allocated counts

- **WHEN** an admin opens edit for a `VOUCHER_PROMO` or `VOUCHER_PDF` event that has inventory rows
- **THEN** the page shows available and allocated inventory counts

### Requirement: Product docs and BDD match Berlin zip authoring
`docs/product/features/admin-events.feature`, `e2e/specs/admin-events.spec.ts`, and `docs/product/testing/coverage-matrix.md` SHALL describe admin event create/edit collecting Berlin `zip_code` under prefilled Germany/Berlin (`DE` / `berlin`), with no neighborhood/Kiez field and no city/country picker. Playwright SHALL cover at least admin create smoke with a valid Berlin PLZ using proximity selectors, or record a named coverage-matrix deferral with owner and reason. Invalid-zip browser coverage MAY rely on unit tests with a named matrix deferral.

#### Scenario: Admin-events feature file describes zip fields
- **WHEN** an implementer reads `docs/product/features/admin-events.feature` after this step
- **THEN** create/edit scenarios mention zip under Germany/Berlin
- **AND** neighborhood/Kiez authoring is absent

#### Scenario: Admin create smoke uses Berlin PLZ
- **WHEN** `e2e/specs/admin-events.spec.ts` runs an admin create (or equivalent smoke) scenario
- **THEN** the form is filled with a valid Berlin PLZ (e.g. `10115`) under fixed Germany/Berlin
- **AND** selectors remain proximity/layout only

#### Scenario: Coverage matrix lists zip authoring
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for admin zip authoring scenarios (pass or explicit deferral)

### Requirement: Product Gherkin admin redemption matches inventory model

`docs/product/features/admin-events.feature` SHALL document create/edit redemption configuration for `SECRET_CODE` (manual `secretCode` only), `VOUCHER_PROMO` (promo inventory payload + `eventWebsiteUrl`), and `VOUCHER_PDF` (PDF ticket inventory). It SHALL NOT require `secret code mode`, auto-generated shared codes, or a single `promoCode` field as the voucher source. Default create values SHALL NOT include `secretCodeMode`. Inventory upload/preview/save and edit inventory summary behavior SHALL match the shipped admin UI.

#### Scenario: Admin feature file drops secret-code modes

- **WHEN** an implementer reads `admin-events.feature` after this change
- **THEN** redemption validation examples use `SECRET_CODE` / `VOUCHER_PROMO` / `VOUCHER_PDF` without a mode column
- **AND** no Scenario requires `SHARED_GENERATED` code generation

#### Scenario: Admin defaults omit secretCodeMode

- **WHEN** the default-values scenario is read
- **THEN** defaults describe `ticketType` `SECRET_CODE` (and capacity/timing as today) without `secretCodeMode`

### Requirement: Admin clones an event
Admins SHALL clone an existing event via a dedicated SSR page `/:locale/admin/events/:id/clone` with form POST (no client-only modal). The form SHALL be prefilled from the source event (at least a source summary and a date/time control) and SHALL require a date/time for the new occurrence. Primary image upload SHALL NOT be required on clone (source image id is reused by the catalog clone operation). For `VOUCHER_PROMO` or `VOUCHER_PDF` source events, the clone form SHALL require new redemption inventory using create-mode semantics. On success, a new catalog event exists and the admin is redirected to a sensible admin events surface (edit of the new event or the events list). Entry points SHALL exist on the Events list and/or event edit page. The admin Events UI SHALL NOT offer series create.

#### Scenario: Clone event from catalog list
- **WHEN** an admin opens clone for an existing event, sets a new date/time, and confirms
- **THEN** a new event appears in the catalog with the copied title and new date/time

#### Scenario: Clone voucher event requires inventory
- **WHEN** an admin clones a `VOUCHER_PROMO` or `VOUCHER_PDF` event without providing new inventory
- **THEN** the clone is rejected until inventory is provided

#### Scenario: Clone entry points visible
- **WHEN** an admin views the Events list or an event edit page
- **THEN** a Clone action linking to `/:locale/admin/events/:id/clone` is available
- **AND** no Event series create CTA is shown

### Requirement: Product docs describe clone not series
`docs/product/features/admin-events.feature`, `docs/product/sitemap/sitemap.md`, and `docs/product/ui/ui-component-map.md` SHALL document `/admin/events/:id/clone` (ADMIN clone flow) and SHALL NOT document `/admin/events/series/new` or series builders (manual slots, date-range / weekday builders) as current MVP behavior. Feature scenarios SHALL include clone acceptance coverage (happy path and entry points; voucher inventory reject when practical) and SHALL NOT require series-create scenarios.

#### Scenario: Feature file documents clone
- **WHEN** a reader opens `docs/product/features/admin-events.feature`
- **THEN** it includes clone acceptance scenarios
- **AND** it has no required series-create scenarios (manual slots or date-range builder)

#### Scenario: Sitemap lists clone not series
- **WHEN** a reader opens `docs/product/sitemap/sitemap.md`
- **THEN** it lists `/admin/events/:id/clone` for ADMIN
- **AND** it does not list `/admin/events/series/new` as a current MVP route

#### Scenario: UI component map describes clone
- **WHEN** a reader opens the Events row in `docs/product/ui/ui-component-map.md`
- **THEN** admin events document SSR CRUD and clone
- **AND** they do not describe series create as a current surface

### Requirement: Admin subtitles checkbox and language

Admin create and edit event forms SHALL offer a native Subtitles checkbox (`has_subtitles`) and, when that checkbox is checked, a required native language `<select>` (`subtitle_language`) whose options are the full ISO 639-1 language list (not limited to spoken-event `EVENT_LANGUAGES`). The subtitle controls SHALL remain available regardless of the Language-independent checkbox / spoken-languages multi-select state. When Subtitles is unchecked, the language select SHALL be hidden or non-required and the submitted state MUST persist `subtitle_language = null`. Forms MUST NOT use HeroUI `Select`, `Checkbox`, or `Switch` for these fields (native checkbox + native select / existing admin native wrappers only). DE+EN admin copy SHALL label the controls clearly (Subtitles / Untertitel or equivalent).

#### Scenario: Checking subtitles reveals required language select

- **WHEN** an ADMIN checks Subtitles on create or edit
- **THEN** a native language select with the full ISO 639-1 list is shown and required

#### Scenario: Unchecking subtitles omits language requirement

- **WHEN** an ADMIN leaves Subtitles unchecked and submits a valid event form
- **THEN** the saved event has `has_subtitles = false` and `subtitle_language = null`

#### Scenario: Subtitles controls available when language-independent

- **WHEN** an ADMIN checks Language-independent on the event form
- **THEN** the Subtitles checkbox (and language select when Subtitles is checked) remain available
