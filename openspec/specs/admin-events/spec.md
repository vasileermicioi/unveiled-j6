# Admin Events

ADMIN catalog management for events, including the Featured curation tab used by Discover and per-event gallery photo management.

## Requirements

### Requirement: Create a single event accepts dateTimes list

Creating an event SHALL require at least one datetime value supplied as a list (`dateTimes`). Admin create and edit SSR paths SHALL post the editable datetime list (not a single wrapped field) into `dateTimes` together with a parallel `occurrenceCreditPrices` list of equal length (one credit price per complete datetime row). The catalog SHALL persist sorted `date_times` with matching `occurrence_credit_prices`, set denormalized primary `date_time` to the next upcoming instant (or earliest if all past), set denormalized `credit_price` to that primary occurrence’s price, and compute `startTimeMinutes` and `weekday` from that primary datetime in Europe/Berlin. Duplicate instants SHALL be rejected (paired path). The admin form SHALL NOT post a separate event-level `credit_price` field that overrides row credits.

#### Scenario: Create a single event

- **WHEN** I create a new event with a title, partner, per-datetime credit prices, capacity, description, image, Berlin zip code, and one or more dateTimes
- **THEN** the event is added to the catalog
- **AND** its remaining capacity defaults to its total capacity
- **AND** its startTimeMinutes and weekday are computed from its primary/next dateTime

#### Scenario: Create with multiple dateTimes persists the list

- **WHEN** an admin create path (or catalog `createEvent`) supplies two or more dateTimes with matching credit prices
- **THEN** the stored event has `date_times` length equal to the unique sorted input count
- **AND** denormalized `date_time` matches the primary/next rule
- **AND** `occurrence_credit_prices` follow that datetime order

### Requirement: Editable list of event datetimes

Admin create, edit, and clone forms SHALL present event datetimes as an editable list. Each row SHALL include a date, a time (when timing mode is `TIME_SLOT`), and a credit price. The admin SHALL be able to add and remove rows inplace before submitting the SSR form. The system SHALL reject submit when zero complete datetime rows remain. The form SHALL display the sum of the listed credit prices. The form SHALL NOT show a separate event-level Credits field; `events.credit_price` is derived from the primary occurrence on write.

#### Scenario: Add and remove datetimes on create

- **WHEN** I am on the new-event form
- **AND** I add a second datetime row, set a credit price on each remaining row, and remove one row
- **THEN** submitting persists exactly the remaining datetime values and their credits on the event

#### Scenario: Per-datetime credits persist

- **WHEN** I create an event with two datetime rows priced 1 and 3 credits
- **THEN** the stored `occurrence_credit_prices` are 1 and 3 in datetime order
- **AND** denormalized `credit_price` equals the primary/next slot’s price

#### Scenario: Total credits shown on the form

- **WHEN** the datetime list has rows priced 2 and 5
- **THEN** the form shows a total of 7 credits for the list

#### Scenario: Edit datetimes inplace

- **WHEN** I edit an event that already has multiple datetimes
- **THEN** I see all values as editable rows including each row’s credits
- **AND** I can add or remove rows and save

#### Scenario: Empty datetime list rejected on admin form

- **WHEN** an admin submits create or edit with no complete datetime rows
- **THEN** the form is re-rendered with an error
- **AND** no catalog write occurs

### Requirement: Date-range occurrence builder
Admin create, edit, and clone event forms SHALL offer a range builder: an inclusive start date, an inclusive end date, and one or more time slots each with a clock time and a credit price. The occurrence list SHALL be the cartesian product of each Europe/Berlin calendar date in that range and each time slot. Changing start date, end date, or any time-slot row SHALL replace the occurrence list from scratch (manual add/remove of list rows is discarded). The system SHALL reject a generated list that is empty or that exceeds 52 occurrences. Submit SHALL persist the generated (or subsequently edited) list via the existing SSR form POST. When timing mode is `ALL_DAY`, the builder SHALL still expand dates but SHALL emit one row per date at Europe/Berlin midnight using the first time slot’s credit price (time-of-day on additional slots is ignored). The builder SHALL live on create/edit/clone event forms; the system SHALL NOT revive `/admin/events/series/new`.

#### Scenario: Range and two time slots generate a grid
- **WHEN** I set start 2026-09-01, end 2026-09-03, and time slots 10:00 at 1 credit and 18:00 at 3 credits
- **THEN** the datetime list has six rows (each date × each time)
- **AND** morning rows are priced 1 and evening rows are priced 3

#### Scenario: Changing the end date rebuilds from scratch
- **WHEN** a generated list exists and I have manually added an extra row
- **AND** I change the builder end date
- **THEN** the list is replaced by a fresh expansion
- **AND** the manually added row is gone

#### Scenario: Over-cap range is rejected
- **WHEN** start, end, and time slots would produce more than 52 occurrences
- **THEN** the form shows an error
- **AND** no catalog write occurs on submit

#### Scenario: Empty generated list rejected on submit
- **WHEN** the rebuilt datetime list has zero complete rows (including start after end, or every date skipped)
- **THEN** the form is re-rendered with an error
- **AND** no catalog write occurs

#### Scenario: ALL_DAY expands one row per date
- **WHEN** timing mode is `ALL_DAY` and I generate 2026-09-01 through 2026-09-02 with slots 10:00 at 1 credit and 18:00 at 3 credits
- **THEN** the datetime list has two rows (one per date at Berlin midnight)
- **AND** each row is priced 1 (first slot’s credits)

### Requirement: Partner opening hours default time slots
On the **create** event form, when the admin selects a partner with `has_opening_hours` true and a valid week, the builder’s default time-slot rows SHALL be the distinct `open` times from open weekdays, sorted. Range expansion SHALL emit every inclusive calendar day × each time slot (closed partner weekdays are not omitted). When the partner has no published hours, the default time slot SHALL be 19:30 at 1 credit. On **edit**, changing partner SHALL NOT overwrite existing datetimes or builder fields.

#### Scenario: Create prefills slots from partner open times
- **WHEN** I am on the new-event form and select a partner open 10:00–18:00 weekdays and closed Sunday
- **THEN** the builder shows a 10:00 time slot by default

#### Scenario: Range includes closed partner weekdays
- **WHEN** that partner is selected and I generate 2026-09-05 (Saturday) through 2026-09-07 (Monday) with the default 10:00 slot
- **THEN** Sunday is in the datetime list
- **AND** Saturday, Sunday, and Monday are

#### Scenario: No published hours includes every calendar day
- **WHEN** I select a partner with `has_opening_hours` false and generate 2026-09-05 through 2026-09-07 with the default 19:30 slot
- **THEN** the datetime list includes Saturday, Sunday, and Monday

#### Scenario: Edit partner change does not overwrite datetimes
- **WHEN** I edit an event that already has datetime rows and builder fields
- **AND** I change the partner
- **THEN** the datetime list and builder fields are unchanged

### Requirement: Admin Featured events management

The admin app SHALL expose Featured events under `/:locale/admin/featured*` for listing, searching catalog events not already featured, adding, reordering, and removing featured rows. The list SHALL stay a table (or table-equivalent rows) showing thumbnail, title, partner, and date, ordered by `sort_order`. Admins SHALL drag rows to a new order and persist it with an explicit Save order form POST. Admins SHALL select one or more rows with native checkboxes and open SSR remove confirm at `/:locale/admin/featured/remove?eventIds=` (catalog events kept). The Featured events list SHALL NOT include a gallery-manage action; gallery entry remains the Events catalog list and/or event edit page. Mutations SHALL use dedicated pages with form POST (no client-only mutation modal).

`docs/product/features/admin-events.feature` SHALL include scenarios for listing featured events (thumb, title, partner, date, Save order, Remove selected), drag-reorder with Save order, checkbox select → SSR bulk remove that keeps the catalog event, empty list, and add-by-search. Playwright titles SHALL match those `Scenario:` lines verbatim. Remove confirm SHALL use `/:locale/admin/featured/remove?eventIds=`. Environment skips (`E2E_ADMIN_*`, R2) MAY remain as named `test.skip` reasons. The system SHALL NOT add `data-testid` for these scenarios.

#### Scenario: List featured events

- **WHEN** an ADMIN opens "/:locale/admin/featured"
- **THEN** they see the current featured list ordered by sort_order
- **AND** each row shows at least a primary-image thumbnail (or placeholder), title, partner, and date/time
- **AND** they see Save order and Remove selected controls when the list is non-empty
- **AND** a missing or broken thumbnail does not block select or remove

#### Scenario: Reorder featured events

- **GIVEN** two or more events are on the Featured list
- **WHEN** an ADMIN drags a featured event row and submits Save order
- **THEN** `featured_events.sort_order` matches the new list order
- **AND** that order is shown after reload

#### Scenario: Admin remove from featured keeps catalog event

- **GIVEN** an event is on the Featured list
- **WHEN** an ADMIN selects that event and confirms remove on "/:locale/admin/featured/remove"
- **THEN** the event disappears from the featured list
- **AND** Discover no longer lists it
- **AND** the event remains available in "/:locale/admin/events"

#### Scenario: Featured list has no gallery shortcut

- **WHEN** an ADMIN opens "/:locale/admin/featured" with at least one featured event
- **THEN** the list does not offer a gallery-manage control
- **AND** gallery manage remains available from the Events list or event edit page

#### Scenario: Docs and e2e titles align

- **WHEN** featured-events-manager hardening completes
- **THEN** shipped Playwright titles for in-scope featured scenarios match Gherkin `Scenario:` lines
- **OR** the coverage matrix lists a named deferral with owner

### Requirement: Admin manages event gallery photos

Admins SHALL be able to add, reorder, and remove gallery photos for any existing catalog event through ADMIN-only SSR routes under `/:locale/admin/events/:id/gallery*` (list), `.../gallery/add` (multi-upload), and `.../gallery/remove` (confirm remove). Gallery management entry SHALL be available from the admin Events list and/or the event edit page. Featured Discover membership SHALL NOT be required to manage an event's gallery. The Featured events list SHALL NOT offer a gallery-manage shortcut. Create-event forms SHALL NOT require gallery manage. Mutations SHALL use dedicated pages with form POST (no client-only modals). Selection for bulk remove SHALL NOT use checkbox or radio inputs; the system SHALL use native multi-select and/or discrete per-photo remove links. Each uploaded file SHALL be processed into five WebP variants client-side and persisted as gallery images (separate from the required primary `events.image_id`). Removal SHALL call the catalog remove path so associations disappear from the gallery list and unreferenced image objects are cleaned up per image-upload rules. There is **no hard count cap** on gallery photos; primary `events.image_id` remains separate. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include scenarios that match these routes and SSR confirm behavior (proximity/layout selectors only), SHALL describe five WebP variants (not six JPEG), and SHALL document Events list/edit gallery entry (not Featured-exclusive). Admin-visible empty-state and validation error copy SHALL be present for the manage surfaces.

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
- **AND** the Featured events list does not offer a gallery-manage control

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

Product Gherkin, UI component map, image-uploads §8a, DEPLOYMENT demo script, and Playwright SHALL state that gallery manage is available for any existing catalog event from the admin Events list and/or event edit page. The Featured events list SHALL NOT be documented or tested as a gallery entry point. Coverage matrix rows SHALL use the updated scenario titles.

#### Scenario: Product docs describe per-event gallery admin entry

- **WHEN** a reader opens `admin-events.feature` and `ui-component-map.md`
- **THEN** gallery manage is documented on Events/edit, not on Featured events

#### Scenario: Playwright covers gallery manage from Events

- **WHEN** admin gallery e2e runs with required env
- **THEN** it asserts a path from Events list or edit to gallery manage (proximity/layout selectors only)
- **AND** it does not treat Featured events as a gallery entry point

#### Scenario: Coverage matrix lists updated gallery entry scenario

- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** the gallery manage entry scenario maps to the updated Playwright title with `pass` or named env `skip`
- **AND** no matrix row claims Featured-list gallery manage as current MVP behavior

### Requirement: Admin event image Gherkin and e2e match WebP pipeline
Product Gherkin in `docs/product/features/admin-events.feature` and Playwright coverage in `e2e/specs/admin-events.spec.ts` (plus coverage-matrix rows) SHALL describe required primary event image supply via the five-WebP client Pica pipeline, including WebP variant URL/field assertions where image specs run. Selectors SHALL remain proximity/layout only per `docs/product/testing/bdd-and-e2e.md`. Image scenarios MAY continue to env-skip when R2 vars are missing using the existing documented skip pattern.

#### Scenario: Feature file requires primary image as five WebP
- **WHEN** a reader follows `admin-events.feature` create/image scenarios after this step
- **THEN** primary image supply is mandatory and described as five WebP variants (not six JPEG / not `original.jpg`)

#### Scenario: Playwright asserts WebP when R2 present
- **WHEN** admin event image e2e runs with R2 env configured
- **THEN** assertions expect `.webp` variant URLs or prebuilt WebP field names consistent with `@unveiled/images`

### Requirement: Automated coverage for admin remove from featured

The system’s BDD/e2e suite SHALL cover admin remove-from-featured via native checkbox select and SSR confirm at `/:locale/admin/featured/remove?eventIds=`: after confirm POST, the event SHALL disappear from Discover’s featured list and SHALL remain in the admin events catalog (`/:locale/admin/events`). Product docs / admin feature scenarios SHALL state that remove deletes only the `featured_events` membership row. Playwright SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Per-row `/admin/featured/:eventId/remove` SHALL NOT be the documented or tested primary path.

#### Scenario: Admin remove from featured keeps catalog event

- **WHEN** an admin selects an event on Featured and confirms remove on the bulk confirm page
- **THEN** Discover no longer lists it
- **AND** the event remains in the admin events catalog

#### Scenario: Admin featured remove is documented

- **WHEN** a reader opens admin Featured scenarios in product docs
- **THEN** remove-from-featured is specified as checkbox bulk confirm at `/admin/featured/remove?eventIds=` that keeps the underlying catalog event

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
The admin event create/edit form SHALL collect supported languages via a searchable native-checkbox multi-select (same interaction model as onboarding preferred languages), except that when Language-independent is checked the languages multi-select SHALL NOT be shown or required. The form SHALL NOT collect or display target age groups. Other single-value choice fields (partner, category, etc.) SHALL continue to use a native HTML `select` unless a documented exception applies. Supported languages and language-independent are mutually exclusive in the UI: language-independent checked means languages are not collected.

#### Scenario: Languages multi-select with search
- **WHEN** an admin opens create or edit event
- **AND** Language-independent is unchecked
- **THEN** languages are chosen with a searchable checkbox multi-select
- **AND** only a short default list is shown until search is used
- **AND** a hint explains that search is needed to find other languages
- **AND** already-selected values remain available for the form POST even when filtered out of the visible list

#### Scenario: No target age groups control
- **WHEN** an admin opens create or edit event
- **THEN** no target age groups / Altersgruppen checkbox multi-select is shown

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
Gherkin scenarios for checkbox multi-select languages and add-only partner structured-location/map prefill SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Structured street/house/zip prefill on add (and non-overwrite on edit) MUST be covered; live Nominatim map-pin success MAY be deferred when CI cannot reach Nominatim reliably. There SHALL NOT be a required e2e scenario for event target age groups multi-select.

#### Scenario: Coverage matrix lists new admin form scenarios
- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new admin-events scenarios (pass or explicit deferral)
- **AND** it does not require a pass row for “Age groups multi-select without search”

#### Scenario: Admin languages use checkbox multi-select
- **WHEN** an admin opens create or edit event
- **THEN** Playwright can assert languages are chosen with checkboxes that expose a search filter
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

Admins SHALL clone an existing event via a dedicated SSR page `/:locale/admin/events/:id/clone` with form POST (no client-only modal). The form SHALL be prefilled from the source event (at least a source summary and an editable datetime list copied from the source, including each row’s credit price from `occurrence_credit_prices`) and SHALL require at least one datetime before confirm. The admin SHALL be able to add or remove datetime rows inplace before submit. Clone POST SHALL persist the submitted `dateTimes` together with `occurrenceCreditPrices` (not flatten to `source.creditPrice` when row credits are posted). Primary image upload SHALL NOT be required on clone (source image id is reused by the catalog clone operation). For `VOUCHER_PROMO` or `VOUCHER_PDF` source events, the clone form SHALL require new redemption inventory using create-mode semantics. On success, a new catalog event exists and the admin is redirected to a sensible admin events surface (edit of the new event or the events list). Entry points SHALL exist on the Events list and/or event edit page. The admin Events UI SHALL NOT offer series create.

#### Scenario: Clone event from catalog list

- **WHEN** an admin opens clone for an existing event
- **THEN** the datetime list is prefilled from the source event including each row’s credits
- **AND** when the admin edits the list if needed and confirms
- **THEN** a new event appears in the catalog with the copied title, the submitted dateTimes, and the submitted occurrence credit prices

#### Scenario: Clone voucher event requires inventory

- **WHEN** an admin clones a `VOUCHER_PROMO` or `VOUCHER_PDF` event without providing new inventory
- **THEN** the clone is rejected until inventory is provided

#### Scenario: Clone entry points visible

- **WHEN** an admin views the Events list or an event edit page
- **THEN** a Clone action linking to `/:locale/admin/events/:id/clone` is available
- **AND** no Event series create CTA is shown

### Requirement: Product docs describe clone not series
`docs/product/features/admin-events.feature`, `docs/product/sitemap/sitemap.md`, and `docs/product/ui/ui-component-map.md` SHALL document `/admin/events/:id/clone` (ADMIN clone flow) and SHALL NOT document `/admin/events/series/new` as a current MVP route. An inline date-range builder on create, edit, and clone event forms is a current MVP surface (not a separate series route). Feature scenarios SHALL include clone acceptance coverage (happy path and entry points; voucher inventory reject when practical) and SHALL NOT require series-create scenarios. Canonical Gherkin SHALL include the inline builder, per-datetime credits, and partner-hours defaults. `docs/product/ui/ui-component-map.md` Events row SHALL mention per-row credits, the list total, and the range builder. `docs/product/extras/gaps-and-decisions.md` SHALL NOT describe admin add/remove datetime UI as parked or `ALLOW_MULTI_DATETIME_UI = false`.

#### Scenario: Feature file documents clone
- **WHEN** a reader opens `docs/product/features/admin-events.feature`
- **THEN** it includes clone acceptance scenarios
- **AND** it has no required series-create scenarios (no `/admin/events/series/new`)

#### Scenario: Sitemap lists clone not series
- **WHEN** a reader opens `docs/product/sitemap/sitemap.md`
- **THEN** it lists `/admin/events/:id/clone` for ADMIN
- **AND** it does not list `/admin/events/series/new` as a current MVP route

#### Scenario: UI component map describes clone
- **WHEN** a reader opens the Events row in `docs/product/ui/ui-component-map.md`
- **THEN** admin events document SSR CRUD and clone
- **AND** they do not describe series create as a current surface

#### Scenario: UI map and Gherkin describe the inline builder
- **WHEN** a reader opens `admin-events.feature` and the Events row of `ui-component-map.md`
- **THEN** both describe per-datetime credits and the inline date-range builder on create/edit/clone
- **AND** neither describes admin multi-datetime UI as parked

### Requirement: Admin subtitles checkbox and languages

Admin create and edit event forms SHALL offer a native Subtitles checkbox (`has_subtitles`) and, when that checkbox is checked, a required searchable checkbox multi-select (`subtitle_languages`) whose options are the full ISO 639-1 language list (not limited to spoken-event `EVENT_LANGUAGES`). The control SHALL use the same checkbox multi-select pattern as spoken event languages (search filter; selected values remain in the POST when hidden by the filter). At least one language SHALL be required when Subtitles is checked. The subtitle controls SHALL remain available regardless of Language-independent / spoken-languages state. When Subtitles is unchecked, the multi-select SHALL be hidden or non-required and the submitted state MUST persist `subtitle_languages = null`. Forms MUST NOT use HeroUI `Select`, `Checkbox`, or `Switch` for these fields, and MUST NOT use a native `<select>` or `<select multiple>` for subtitle languages. DE+EN admin copy SHALL label the language field in the plural (Subtitle languages / Untertitelsprachen or equivalent) and SHALL state that one or more languages may be chosen.

Admin Events catalog and Featured add-results Subtitles cells SHALL list every stored subtitle language as locale labels (same formatter as spoken Languages on those tables), joined, or an em dash when subtitles are off / empty.

#### Scenario: Checking subtitles reveals required language select

- **WHEN** an ADMIN checks Subtitles on create or edit
- **THEN** a searchable subtitle-languages checkbox multi-select with the full ISO 639-1 list is shown and at least one language is required

#### Scenario: Check Subtitles reveals language multi-select

- **WHEN** I open create or edit event and check Subtitles
- **THEN** a searchable subtitle-languages checkbox multi-select with the full ISO 639-1 list is shown and at least one language is required

#### Scenario: Save event with Subtitles and multiple languages

- **WHEN** I create an event with Subtitles checked and DE plus EN selected
- **THEN** the saved event has `has_subtitles` true and `subtitle_languages` containing DE and EN
- **AND** the public detail DETAILS metadata shows subtitles availability and those languages

#### Scenario: Unchecking subtitles omits language requirement

- **WHEN** an ADMIN leaves Subtitles unchecked and submits a valid event form
- **THEN** the saved event has `has_subtitles` = false and `subtitle_languages` = null

#### Scenario: Subtitles controls available when language-independent

- **WHEN** an ADMIN checks Language-independent on the event form
- **THEN** the Subtitles checkbox remains available
- **AND** checking Subtitles still shows the subtitle-languages checkbox multi-select

#### Scenario: Admin list shows all subtitle languages

- **WHEN** an ADMIN views the events list or Featured add-results for an event with `has_subtitles` true and `subtitle_languages` containing DE and EN
- **THEN** the Subtitles cell shows both languages as locale labels

### Requirement: Optional accessibility and audience metadata without age groups

The system SHALL allow admins to optionally set barrier-free accessibility, supported languages, language-independent, and subtitles when creating or editing an event. The system SHALL NOT collect or store target age groups on events.

#### Scenario: Optional accessibility and audience metadata

- **WHEN** I create or edit an event
- **THEN** I can optionally set barrier-free accessibility, supported languages, language-independent, and subtitles
- **AND** supported languages and language-independent are mutually exclusive in the UI
- **AND** subtitles are independent of spoken languages / language-independent
- **AND** no target age groups control is shown

### Requirement: Admin event lists show next upcoming datetime

Admin Events catalog and Featured tables (and related add-result rows that show an event datetime) SHALL display the event’s **next upcoming** datetime (denormalized primary `date_time`) formatted in Europe/Berlin for the admin locale. When an event has more than one datetime, the cell MAY append a simple `+N` count of additional datetimes. The list SHALL NOT invent a past slot as the primary display when a later upcoming datetime exists.

#### Scenario: Catalog list shows primary next datetime

- **WHEN** an admin views `/admin/events` for an event with multiple datetimes including a future occurrence
- **THEN** the date column shows the next upcoming datetime

#### Scenario: Multiple datetimes indicated simply

- **WHEN** an admin views a list row for an event with three datetimes
- **THEN** the date presentation shows the primary/next datetime
- **AND** optionally indicates two additional datetimes (e.g. `+2`)

### Requirement: Multi-datetime admin and discovery e2e coverage

BDD/Playwright SHALL cover admin add/remove datetime smoke on create or edit and SHALL keep discovery assertions that fully past multi-datetime events stay out of the default upcoming feed. Selectors SHALL remain proximity/layout only. Product feature files (`admin-events`, `event-discovery`, booking as needed), schema overview, ui-component-map, and gaps-and-decisions SHALL document slot-scoped booking for time and credits, event-level capacity, and multi-datetime display rules.

#### Scenario: Admin multi-datetime smoke

- **WHEN** an admin creates or edits an event with two datetime rows via the SSR form
- **THEN** Playwright can assert both values persist (edit re-open or equivalent proximity assertion)

#### Scenario: Discovery excludes fully past multi-datetime events

- **WHEN** every datetime on an event is in the past
- **THEN** the member feed does not list that event

### Requirement: Admin events feature documents occurrence credits
`docs/product/features/admin-events.feature` SHALL include scenarios for add/remove datetime rows with per-row credits, the list total, range generation from start/end plus time slots, rebuild-from-scratch, partner opening-hours default slots on create, and closed-day skip. The create scenario SHALL say “one or more dateTimes” and credits per datetime (not a single event-level credit price). Playwright titles in `e2e/specs/admin-events.spec.ts` SHALL match those Scenario lines verbatim. Native datetime and credit controls SHALL be asserted with `getByLabel` (and `nth` / layout filters when several “Credits” labels exist). The parked skip `ALLOW_MULTI_DATETIME_UI=false` SHALL NOT remain on `Scenario: Add and remove datetimes on create`. Environment skips (`E2E_ADMIN_*`, R2) MAY remain as named `test.skip` reasons. The system SHALL NOT add `data-testid` for these scenarios.

#### Scenario: Coverage traces admin occurrence-credit scenarios
- **WHEN** the coverage matrix is updated for this feature
- **THEN** it includes rows for the new admin-events scenarios (pass or explicit environment skip)
- **AND** none of those rows use `@skip-no-ui` as the reason the UI is unbuilt

#### Scenario: Add and remove datetimes on create
- **WHEN** I am on the new-event form
- **AND** I add a second datetime row, set a credit price on each remaining row, and remove one row
- **THEN** submitting persists exactly the remaining datetime values and their credits on the event

#### Scenario: Per-datetime credits persist
- **WHEN** I create an event with two datetime rows priced 1 and 3 credits
- **THEN** the stored `occurrence_credit_prices` are 1 and 3 in datetime order
- **AND** denormalized `credit_price` equals the primary/next slot’s price

#### Scenario: Total credits shown on the form
- **WHEN** the datetime list has rows priced 2 and 5
- **THEN** the form shows a total of 7 credits for the list

#### Scenario: Range and two time slots generate a grid
- **WHEN** I set a start date, end date, and time slots 10:00 at 1 credit and 18:00 at 3 credits
- **THEN** the datetime list has one row per date × each time
- **AND** morning rows are priced 1 and evening rows are priced 3

#### Scenario: Changing the end date rebuilds from scratch
- **WHEN** a generated list exists and I have manually added an extra row
- **AND** I change the builder end date
- **THEN** the list is replaced by a fresh expansion
- **AND** the manually added row is gone

#### Scenario: Create prefills slots from partner open times
- **WHEN** I am on the new-event form and select a partner open 10:00–18:00 weekdays and closed Sunday
- **THEN** the builder shows a 10:00 time slot by default

#### Scenario: Range includes closed partner weekdays
- **WHEN** that partner is selected and I generate a range that includes Sunday with the default 10:00 slot
- **THEN** Sunday is in the datetime list
- **AND** every calendar day in the range is

### Requirement: Event add/edit wizard keeps unsaved drafts

`docs/product/features/admin-events.feature` SHALL include scenarios titled `Refresh keeps unsaved event edits`, `Edit steps keep unsaved edits`, and `Successful event save clears draft`. Playwright SHALL use those titles verbatim. Drafts SHALL live in browser `localStorage`, not cookies and not a database table. Create GET on `/:locale/admin/events/new/dates` and `/:locale/admin/events/new/image` SHALL render those wizard steps (no redirect to step 1). That GET contract SHALL be asserted inside `Edit steps keep unsaved edits` (create path) — not as a fourth Gherkin/Playwright title. Product sitemap notes for those create step URLs SHALL match (no “GET redirects to `/new`”). UI component-map Events and Partners rows SHALL mention the shared draft helper on the event wizard, clone, gallery add, and partner create/edit. Coverage-matrix rows SHALL exist for the three new scenarios.

#### Scenario: Refresh keeps unsaved event edits

- **WHEN** I change a field on create or edit event and refresh
- **THEN** the unsaved value is still in the field
- **AND** I can discard the draft to reload saved or empty values
- **AND** discard on create returns to step 1

#### Scenario: Edit steps keep unsaved edits

- **WHEN** I edit a field on one wizard step and open another step URL
- **THEN** returning to the first step still shows the unsaved value
- **AND** create GET `/:locale/admin/events/new/dates` stays on Date & tickets (does not redirect to step 1)
- **AND** Back from Date & tickets does not trigger date validation

#### Scenario: Successful event save clears draft

- **WHEN** I save the event successfully and reopen edit
- **THEN** I see persisted database values, not the discarded in-progress draft

### Requirement: Admin create requires DE and EN copy

`docs/product/features/admin-events.feature` SHALL specify that create/edit collect title and Markdown description for both German and English, and reject submit when either locale is empty. It SHALL include a scenario titled `Create event with DE and EN titles`. Playwright in `e2e/specs/admin-events.spec.ts` SHALL use that title verbatim. After create, `/de/events/:id` and `/en/events/:id` SHALL show the matching locale titles (identity heading). Playwright SHALL use proximity/layout selectors only; the system SHALL NOT add `data-testid`.

Admin e2e helpers (`createEventViaUI`, `fillNewEventRequiredFields`) SHALL fill both locale title fields and both locale description fields so existing create/edit scenarios remain green after the step-02 General form (labels `Titel (DE)` / `Title (EN)` and `Beschreibung (DE)` / `Description (EN)`, or equivalent `getAdminCopy` keys). Default helper fills MAY copy the same string into both locales; the new scenario MUST use distinct DE vs EN titles.

`docs/product/extras/content-i18n-inventory.md` SHALL list the new admin label and `fieldErrors` keys. Coverage matrix SHALL include the new admin scenario (`pass` or named R2 / `E2E_ADMIN_*` env-skip — never “UI not built”).

#### Scenario: Create event with DE and EN titles

- **WHEN** I create an event with both locale titles and both locale descriptions
- **THEN** the event is added to the catalog
- **AND** `/de` and `/en` public detail show the matching titles

#### Scenario: Empty either-locale copy is rejected in Gherkin

- **WHEN** a reader opens `admin-events.feature` after this change
- **THEN** create/edit are specified to reject submit when either locale title or description is empty

### Requirement: Admin publish and unpublish an event
Admins SHALL publish or unpublish a catalog event from dedicated SSR pages `/:locale/admin/events/:id/publish` and `/:locale/admin/events/:id/unpublish` via form POST (no client-only toggle, no localStorage draft). The Events catalog SHALL show a Published or Draft status and a link to the matching confirm page. Unpublished events SHALL remain on the admin list. Event edit SHALL offer a text link to the matching confirm page. After a successful create, the admin flow SHALL NOT imply the event is live on Browse and SHALL point at the publish confirm. A missing event SHALL return the same admin 404 as other event confirm pages. POST SHALL be idempotent when the event is already in the requested state. Successful POST SHALL persist `events.published` and redirect to the Events catalog.

#### Scenario: Publish confirm goes live on Browse
- **WHEN** an admin confirms publish for a draft event
- **THEN** `events.published` is true
- **AND** they are returned to the Events catalog

#### Scenario: Unpublish confirm hides from Browse
- **WHEN** an admin confirms unpublish for a published event
- **THEN** `events.published` is false
- **AND** the event remains on the admin Events catalog

#### Scenario: Create does not imply Browse is live
- **WHEN** an admin successfully creates an event
- **THEN** the success path does not claim the event is live on Browse
- **AND** it points the admin at the publish confirm for that event

#### Scenario: Non-admin cannot open event publish routes
- **WHEN** a guest or USER requests `/:locale/admin/events/:id/publish` or `.../unpublish`
- **THEN** access is denied per existing admin route guards (guest → login, USER → locale home)

### Requirement: Admin events list can filter by published
The Events catalog MAY accept `published=yes` or `published=no`. When omitted, both drafts and published rows SHALL appear. The filter SHALL compose with existing title, partner, language, sort, and page query params.

#### Scenario: Filter drafts
- **WHEN** an admin opens `/admin/events?published=no`
- **THEN** only unpublished events are listed

### Requirement: Canonical admin-events Gherkin records publish and draft
`docs/product/features/admin-events.feature` SHALL include the publish/unpublish confirm, Published/Draft chip, optional `published=` filter, create-as-draft, and unpublish-keeps-featured scenarios with the titles below. Playwright `e2e/specs/admin-events.spec.ts` SHALL map 1:1 (`test("Scenario: <exact title>")`). Existing titles SHALL keep their names; their steps MAY be updated so create stays draft on the admin list and featured-add does not claim Discover is live. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim. Selectors SHALL be proximity/layout only. Env skips (`E2E_ADMIN_*`, R2, `DATABASE_URL`) MAY remain as named `test.skip` reasons. The system SHALL NOT add `@skip-no-ui` for these MVP scenarios.

#### Scenario: Publish confirm goes live on Browse
- **WHEN** an admin confirms publish for a draft event
- **THEN** the Events catalog shows Published / Veröffentlicht
- **AND** a booking-eligible member sees that event on `/events`

#### Scenario: Unpublish confirm hides from Browse
- **WHEN** an admin confirms unpublish for a published event
- **THEN** the Events catalog still lists the event as Draft / Entwurf
- **AND** that event does not appear on member `/events`

#### Scenario: Create does not appear on Browse
- **WHEN** an admin creates an event and does not publish it
- **THEN** the event is on `/admin/events` as Draft
- **AND** it does not appear on member `/events`

#### Scenario: Event list shows Published or Draft status
- **WHEN** an admin opens `/admin/events` with both a draft and a published event
- **THEN** each row shows Published / Veröffentlicht or Draft / Entwurf

#### Scenario: Event list filters by published
- **WHEN** an admin opens `/admin/events?published=no`
- **THEN** only unpublished events are listed
- **AND** sort, title, partner, and language params are preserved when changing the filter

#### Scenario: Unpublish does not delete or drop featured membership
- **WHEN** an admin unpublishes a catalog event that has a featured row
- **THEN** the event remains on `/admin/events`
- **AND** the featured row remains on `/admin/featured`
- **AND** Discover omits the event until both flags are true

### Requirement: Featured-add Gherkin does not imply Discover is live
`docs/product/features/admin-events.feature` Scenario **Add by searching existing events** SHALL state that submitting add creates an unpublished featured row and points the admin at the featured publish confirm (not a silent “now on Discover” list redirect). Scenario **Admin remove from featured keeps catalog event** SHALL still assert Discover no longer lists the event after remove. Playwright SHALL keep those existing titles; only the steps and assertions change.

#### Scenario: Add by searching existing events
- **WHEN** an admin adds a catalog event to featured
- **THEN** a featured row exists as Draft
- **AND** Discover does not list that event until the featured row is published and the catalog event is published

