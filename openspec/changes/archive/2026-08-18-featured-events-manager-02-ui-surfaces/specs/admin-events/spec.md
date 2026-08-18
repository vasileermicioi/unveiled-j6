## ADDED Requirements

### Requirement: Admin Featured events management

The admin app SHALL expose Featured events under `/:locale/admin/featured*` for listing, searching catalog events not already featured, adding, reordering, and removing featured rows. The list SHALL stay a table (or table-equivalent rows) showing thumbnail, title, partner, and date, ordered by `sort_order`. Admins SHALL drag rows to a new order and persist it with an explicit Save order form POST. Admins SHALL select one or more rows with native checkboxes and open SSR remove confirm at `/:locale/admin/featured/remove?eventIds=` (catalog events kept). The Featured events list SHALL NOT include a gallery-manage action; gallery entry remains the Events catalog list and/or event edit page. Mutations SHALL use dedicated pages with form POST (no client-only mutation modal).

#### Scenario: List featured events

- **WHEN** an ADMIN opens "/:locale/admin/featured"
- **THEN** they see the current featured list ordered by sort_order
- **AND** each row shows at least a primary-image thumbnail (or placeholder), title, partner, and date/time
- **AND** they see Save order and Remove selected controls
- **AND** a missing or broken thumbnail does not block select or remove

#### Scenario: Reorder featured events

- **WHEN** an ADMIN drags a featured event row and submits Save order
- **THEN** `featured_events.sort_order` matches the new list order

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

## MODIFIED Requirements

### Requirement: Admin manages event gallery photos

Admins SHALL be able to add, reorder, and remove gallery photos for any existing catalog event through ADMIN-only SSR routes under `/:locale/admin/events/:id/gallery*` (list), `.../gallery/add` (multi-upload), and `.../gallery/remove` (confirm remove). Gallery management entry SHALL be available from the admin Events list and/or the event edit page. Featured Discover membership SHALL NOT be required to manage an event's gallery. The Featured events list SHALL NOT offer a gallery-manage shortcut. Create-event forms SHALL NOT require gallery manage. Mutations SHALL use dedicated pages with form POST (no client-only modals). Selection for bulk remove SHALL NOT use checkbox or radio inputs; the system SHALL use native multi-select and/or discrete per-photo remove links. Each uploaded file SHALL be processed into five WebP variants client-side and persisted as gallery images (separate from the required primary `events.image_id`). Removal SHALL call the catalog remove path so associations disappear from the gallery list and unreferenced image objects are cleaned up per image-upload rules. There is **no hard count cap** on gallery photos; primary `events.image_id` remains separate. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include scenarios that match these routes and SSR confirm behavior (proximity/layout selectors only), SHALL describe five WebP variants (not six JPEG), and SHALL document Events list/edit gallery entry (not Featured-exclusive). Admin-visible empty-state and validation error copy SHALL be present for the manage surfaces.

#### Scenario: Admin multi-upload gallery photos

- **WHEN** an admin opens the event gallery add page and submits multiple valid image files
- **THEN** each file is processed into five WebP variants client-side and stored as gallery images for that event
- **AND** the admin is redirected to the event gallery list showing the new photos

#### Scenario: Admin removes selected gallery photos

- **WHEN** an admin confirms removal of one or more gallery images on the remove page
- **THEN** those images disappear from the event gallery list
- **AND** unreferenced image objects are cleaned up from storage per image-upload rules

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
