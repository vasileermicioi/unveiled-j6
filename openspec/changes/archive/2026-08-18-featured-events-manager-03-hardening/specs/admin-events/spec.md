## MODIFIED Requirements

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

### Requirement: Automated coverage for admin remove from featured

The system’s BDD/e2e suite SHALL cover admin remove-from-featured via native checkbox select and SSR confirm at `/:locale/admin/featured/remove?eventIds=`: after confirm POST, the event SHALL disappear from Discover’s featured list and SHALL remain in the admin events catalog (`/:locale/admin/events`). Product docs / admin feature scenarios SHALL state that remove deletes only the `featured_events` membership row. Playwright SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Per-row `/admin/featured/:eventId/remove` SHALL NOT be the documented or tested primary path.

#### Scenario: Admin remove from featured keeps catalog event

- **WHEN** an admin selects an event on Featured and confirms remove on the bulk confirm page
- **THEN** Discover no longer lists it
- **AND** the event remains in the admin events catalog

#### Scenario: Admin featured remove is documented

- **WHEN** a reader opens admin Featured scenarios in product docs
- **THEN** remove-from-featured is specified as checkbox bulk confirm at `/admin/featured/remove?eventIds=` that keeps the underlying catalog event
