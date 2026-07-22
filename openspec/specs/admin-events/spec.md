# Admin Events

ADMIN catalog management for events, including the Featured curation tab used by Discover and per-event gallery photo management.

## Requirements

### Requirement: Admin manages event gallery photos

Admins SHALL be able to add multiple gallery photos to an existing event in one submission and remove individual or multiple gallery photos through SSR confirmation pages with form POST. Gallery management SHALL be ADMIN-only under locale-prefixed routes such as `/:locale/admin/events/:id/gallery` (list), `.../gallery/add` (multi-upload), and `.../gallery/remove` (confirm remove). Mutations SHALL NOT use client-only modals. Selection for bulk remove SHALL NOT use checkbox or radio inputs; the system SHALL use native multi-select and/or discrete per-photo remove links. Each uploaded file SHALL be processed into six JPEG variants client-side and persisted as gallery images (separate from the required primary `events.image_id`). Removal SHALL call the catalog remove path so associations disappear from the gallery list and unreferenced image objects are cleaned up per image-upload rules. The gallery SHALL respect the configured maximum (12) enforced by the domain layer. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include scenarios that match these routes and SSR confirm behavior (proximity/layout selectors only). Admin-visible empty-state, capacity, and validation error copy SHALL be present for the manage surfaces.

#### Scenario: Admin multi-upload gallery photos

- **WHEN** an admin opens the event gallery add page and submits multiple valid image files
- **THEN** each file is processed into six JPEG variants client-side and stored as gallery images for that event
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

### Requirement: Automated coverage for admin remove from featured

The system’s BDD/e2e suite SHALL cover admin remove-from-featured: after confirm POST, the event SHALL disappear from Discover’s featured list and SHALL remain in the admin events catalog (`/:locale/admin/events`). Product docs / admin feature scenarios SHALL state that remove deletes only the `featured_events` membership row. Playwright SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin remove from featured keeps catalog event

- **WHEN** an admin removes an event from Featured
- **THEN** Discover no longer lists it
- **AND** the event remains in the admin events catalog

#### Scenario: Admin featured remove is documented

- **WHEN** a reader opens admin Featured scenarios in product docs (or `event-discovery` / admin feature files that cover Featured)
- **THEN** remove-from-featured is specified as keeping the underlying catalog event
