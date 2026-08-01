## MODIFIED Requirements

### Requirement: Admin event form select controls

Admin event create/edit and clone forms SHALL use native HTML `<select>` (or native checkbox groups for multi-value fields) for partner, category, event type, timing mode, ticket type, secret-code mode, barrier-free, languages, and target age groups where those fields appear. HeroUI `Select` / `ListBox` SHALL NOT be required for those fields. SSR field names and validation remain unchanged. Native selects SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native select classes from `globals.css` (e.g. `.admin-native-select`). Series create forms SHALL NOT be documented or offered.

#### Scenario: Partner field is a native select

- **WHEN** an admin opens Create Event
- **THEN** the Partner control is a native HTML select (or equivalent native multi pattern) associated with an accessible label

#### Scenario: Multi-value fields post the same array names

- **WHEN** an admin submits languages or target age groups
- **THEN** the POST body still carries the existing array field names accepted by admin parsers

#### Scenario: Category and event type remain native selects

- **WHEN** an admin opens Create Event or Edit Event
- **THEN** category and event type are native HTML selects (or documented native multi pattern) with unchanged `name` attributes

### Requirement: Admin event SSR CRUD

The web app SHALL expose ADMIN-only SSR routes under `/:locale/admin/events/*` for list, single create, edit, delete, redemption code export, gallery management, and clone (`/:locale/admin/events/:id/clone`), using dedicated form POST pages without client-side modals, matching `docs/product/sitemap/sitemap.md` and `docs/product/features/admin-events.feature`. Series create (`/:locale/admin/events/series/new`) SHALL NOT be offered. Admin event management SHALL NOT be scoped to a single partner — admins select the partner per event from admin-managed partner records on create/edit. Create and edit forms SHALL accept multipart **file upload** for images (required on create; optional replace on edit) and delegate validation, image processing, and storage to the catalog domain layer and `@unveiled/images`. Clone SHALL reuse the source event primary image id and SHALL NOT require a new image upload. Admin event forms SHALL NOT accept remote image URL paste. Admin parsers and forms SHALL NOT accept or persist `secret_code_mode`. Ticket type options SHALL use `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`.

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

#### Scenario: Product docs match clone SSR routes

- **WHEN** an implementer reads `docs/product/sitemap/sitemap.md` and `docs/product/features/admin-events.feature` after this change
- **THEN** they document `/admin/events/:id/clone` and do not require series create as current MVP behavior

### Requirement: Automated browser coverage for admin catalog management

Each Gherkin scenario in `docs/product/features/admin-events.feature` and `docs/product/features/admin-partners.feature` SHALL have a Playwright test with a title matching the scenario line (or Scenario Outline plus example row). Partner scenarios SHALL live in `e2e/specs/admin-partners.spec.ts` and event scenarios in `e2e/specs/admin-events.spec.ts`. Tests SHALL sign in as ADMIN via `loginAsAdmin` / `E2E_ADMIN_*`, use proximity selectors only, and use unique timestamp suffixes for created partner/event names and portal emails. Image upload/URL processing tests SHALL call `test.skip` with reason `R2 vars not configured` when any required R2 env var (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL`) is missing. Image specs SHALL NOT skip solely because the target host is Cloudflare Workers; `e2e/README.md` SHALL allow running image uploads against `bun run dev` and, when configured, against a Workers preview or staging base URL. Series create scenarios SHALL NOT remain in the suite; clone scenarios SHALL be covered (or named env-deferred).

#### Scenario: Admin partner CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-partners.spec.ts`
- **THEN** partner create/edit/delete, logo upload or URL, name propagation, QR regeneration, and portal-access flows are asserted in the browser

#### Scenario: Admin event CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-events.spec.ts`
- **THEN** single event creation, clone (happy path; voucher inventory reject when practical), image required/upload/URL, redemption validation, capacity recalculation, edit, delete, optional metadata, export (or explicit skip with reason), and seed-demo behaviors are asserted
- **AND** series create builders are not exercised as current MVP UI

#### Scenario: Published events surface on public pages

- **WHEN** an admin creates or edits an event via the E2E flow
- **THEN** the event appears on the locale home (Discover) and is viewable on `/events/:id` without authentication
- **AND** after a partner rename, the updated partner name is visible on discover for that partner's events

#### Scenario: Image tests skip when R2 is unavailable

- **WHEN** R2 / image env vars are not fully configured
- **THEN** image upload and remote-URL processing tests skip with an explicit reason string
- **AND** they do not fail the suite

#### Scenario: E2E docs do not require sharp-only local uploads

- **WHEN** an operator reads `e2e/README.md` image-test guidance
- **THEN** the docs do not state that admin uploads require `bun run dev` + `sharp` or that Workers preview cannot upload
