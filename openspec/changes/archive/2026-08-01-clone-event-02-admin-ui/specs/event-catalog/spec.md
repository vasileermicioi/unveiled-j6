## MODIFIED Requirements

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, edit, delete, redemption code export, gallery management, and clone (`/:locale/admin/events/:id/clone`), using dedicated form POST pages without client-side modals, matching `docs/product/sitemap/sitemap.md` and `docs/product/features/admin-events.feature` (docs updates MAY land in a follow-up step). Series create (`/:locale/admin/events/series/new`) SHALL NOT be offered. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records on create/edit. Create and edit forms SHALL accept multipart **file upload** for images (required on create; optional replace on edit) and delegate validation, image processing, and storage to the catalog domain layer and `@unveiled/images`. Clone SHALL reuse the source event primary image id and SHALL NOT require a new image upload. Admin event forms SHALL NOT accept remote image URL paste. Admin parsers and forms SHALL NOT accept or persist `secret_code_mode`. Ticket type options SHALL use `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`.

#### Scenario: Admin creates event with required image upload

- **WHEN** an ADMIN submits a valid new event form with a file upload
- **THEN** the event is persisted with `image_id` set and six JPEG variants stored in object storage

#### Scenario: Event image required on create

- **WHEN** an ADMIN submits a create form without a file upload
- **THEN** the form re-renders with a validation error and no event row is created

#### Scenario: Conflicting image sources rejected

- **WHEN** an ADMIN submits a create or edit form with both a file upload and a remote URL
- **THEN** the form re-renders with a validation error and no partial write occurs

#### Scenario: Admin clones event with new dateTime

- **WHEN** an ADMIN opens clone for an existing event, submits a date/time, and confirms
- **THEN** a distinct event row exists with copied catalog metadata and the submitted date/time
- **AND** the admin is redirected to an admin events surface for the new event or list

#### Scenario: Series create route not offered

- **WHEN** an ADMIN uses the admin Events UI
- **THEN** no series create CTA or `/admin/events/series/new` authoring surface is offered

#### Scenario: Redemption validation on create

- **WHEN** an ADMIN creates a `VOUCHER_PROMO` event omitting `event_website_url`
- **THEN** creation is rejected until the website URL is provided

#### Scenario: Secret code required for secret-code tickets

- **WHEN** an ADMIN creates a `SECRET_CODE` event with no secret code
- **THEN** creation is rejected until a secret code is provided

#### Scenario: Edit replaces event image

- **WHEN** an ADMIN edits an event and supplies a new image file upload
- **THEN** the old `images` row and its six bucket objects are removed and the event references the new image

#### Scenario: Delete event removes image assets

- **WHEN** an ADMIN confirms delete for an event
- **THEN** the event row is removed and its associated `images` row and bucket objects are deleted synchronously

#### Scenario: Non-admin forbidden

- **WHEN** a USER or unauthenticated visitor requests `/admin/events`
- **THEN** access is denied via login redirect or home redirect consistent with auth phase patterns

### Requirement: Admin event list discovery aids

The admin events list at `/:locale/admin/events` SHALL support GET search and pagination (`?q=&page=`, page size 25) per `docs/product/extras/pagination-and-search.md`, searching event title and denormalized partner name. List results SHALL be ordered by `created_at` descending, then `id` descending. The list SHALL display a `small-320` thumbnail for each event's image when present, plus title, partner, date/time (Europe/Berlin), capacity, and row actions for edit, delete, codes export, and clone. The list SHALL NOT include a series create CTA.

#### Scenario: Paginated admin event list

- **WHEN** an ADMIN opens `/admin/events?page=1`
- **THEN** events are listed with SSR-rendered pagination controls and a server-side total count

#### Scenario: Admin event list search

- **WHEN** an ADMIN opens `/admin/events?q=berghain`
- **THEN** only events whose title or denormalized partner name matches the query (case-insensitive) are listed and pagination totals reflect the filtered count

#### Scenario: Admin event list newest first

- **WHEN** an ADMIN opens `/admin/events` without filters
- **THEN** events appear with the most recently created row first

#### Scenario: Event list page clamp

- **WHEN** an ADMIN opens `/admin/events?page=99` and fewer than 99 pages of results exist
- **THEN** the server redirects to the last valid page or equivalent clamp so the table is not empty solely due to an out-of-range page number

#### Scenario: Event list shows image thumbnail

- **WHEN** an ADMIN views `/admin/events` and an event has an image
- **THEN** the list displays a thumbnail using the `small-320` variant URL

#### Scenario: List offers clone action

- **WHEN** an ADMIN views the events list with at least one event
- **THEN** each row includes a Clone action to `/:locale/admin/events/:id/clone`

## REMOVED Requirements

### Requirement: Admin event series confirm survives preview remount
**Reason:** Event series create UI and `createEventSeries` are removed; clone replaces multi-slot authoring.
**Migration:** Admins clone a single event via `/:locale/admin/events/:id/clone` and set a new date/time (repeat as needed).
