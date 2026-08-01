## MODIFIED Requirements

### Requirement: Admin manages event gallery photos

Admins SHALL be able to add, reorder, and remove gallery photos for any existing catalog event through ADMIN-only SSR routes under `/:locale/admin/events/:id/gallery*` (list), `.../gallery/add` (multi-upload), and `.../gallery/remove` (confirm remove). Gallery management entry SHALL be available from the admin Events list and/or the event edit page. Featured Discover membership SHALL NOT be required to manage an event's gallery; the Featured list MAY retain a convenience gallery shortcut but SHALL NOT be the sole entry. Create-event forms SHALL NOT require gallery manage. Mutations SHALL use dedicated pages with form POST (no client-only modals). Selection for bulk remove SHALL NOT use checkbox or radio inputs; the system SHALL use native multi-select and/or discrete per-photo remove links. Each uploaded file SHALL be processed into five WebP variants client-side and persisted as gallery images (separate from the required primary `events.image_id`). Removal SHALL call the catalog remove path so associations disappear from the gallery list and unreferenced image objects are cleaned up per image-upload rules. The gallery SHALL respect the configured maximum (12) enforced by the domain layer. Capacity remains max 12; primary `events.image_id` remains separate. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include scenarios that match these routes and SSR confirm behavior (proximity/layout selectors only) and SHALL describe five WebP variants (not six JPEG) — product Gherkin entry-point wording is updated in a follow-on docs/e2e change. Admin-visible empty-state, capacity, and validation error copy SHALL be present for the manage surfaces.

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

#### Scenario: Gallery capacity is enforced

- **WHEN** an admin attempts to add gallery photos that would exceed the maximum of 12 images for the event
- **THEN** the add is rejected with an admin-visible error
- **AND** the primary hero image is unchanged

#### Scenario: Product feature file documents gallery manage routes

- **WHEN** an agent reads `docs/product/features/admin-events.feature`
- **THEN** it includes scenarios for multi-upload add, SSR remove confirm (single and/or multi), and capacity enforcement aligned to `/admin/events/:id/gallery*`
- **AND** image-processing steps describe five WebP variants (not six JPEG)
