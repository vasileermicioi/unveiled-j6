# Admin Featured Partners

ADMIN Featured partners curation tab and SSR list/add/remove flows for Discover Partner venues, plus the Featured events admin tab label.

## Requirements

### Requirement: Admin Featured partners management

The admin app SHALL expose a **Featured partners** tab and SSR pages under `/:locale/admin/featured-partners*` for listing, searching catalog partners not already featured, adding, reordering, and removing featured rows. Mutations SHALL use dedicated pages with form POST. Removing from featured SHALL keep the partner in `/admin/partners`. The list SHALL be a gallery-style grid of curated partners ordered by `sort_order`, with drag-to-reorder (explicit Save order POST) and checkbox multi-select → SSR remove confirm.

#### Scenario: List featured partners

- **WHEN** an ADMIN opens "/:locale/admin/featured-partners"
- **THEN** they see the current featured partners grid ordered by sort_order
- **AND** each tile shows at least name (and logo thumbnail when present)
- **AND** they see Save order and Remove partners controls

#### Scenario: Add by searching existing partners

- **WHEN** an ADMIN searches on "/:locale/admin/featured-partners/add?q="
- **THEN** they see matching partners that are not already featured
- **AND** submitting add creates a featured row for that partner
- **AND** they are redirected to the featured partners list

#### Scenario: Reorder featured partners

- **WHEN** an ADMIN drags a partner tile and submits Save order
- **THEN** `featured_partners.sort_order` matches the new grid order

#### Scenario: Remove from featured keeps partner venue

- **GIVEN** a partner is on the Featured partners list
- **WHEN** an ADMIN selects that partner and confirms remove on "/:locale/admin/featured-partners/remove"
- **THEN** the partner disappears from the featured partners list
- **AND** Discover no longer lists it in Partner venues
- **AND** the partner remains available in "/:locale/admin/partners"

### Requirement: Featured events admin tab label

The admin tab that routes to `/:locale/admin/featured` SHALL be labeled **Featured events** (EN) / **Empfohlene Events** (DE), not the bare label **Featured** / **Empfohlen**. Routes under `/admin/featured*` remain the featured-events surfaces. Gallery manage is not an entry point from this tab.

#### Scenario: Featured events tab label

- **WHEN** an ADMIN views admin chrome tabs
- **THEN** the tab for "/:locale/admin/featured" reads "Featured events" / "Empfohlene Events"

### Requirement: Featured partners admin BDD

`docs/product/features/admin-partners.feature` (or an adjacent agreed feature file) SHALL specify list/add/remove for Featured partners under `/:locale/admin/featured-partners*`, including empty state and “remove keeps venue” behavior, aligned with sitemap routes. Playwright titles for in-scope scenarios SHALL match Gherkin `Scenario:` lines where the BDD contract requires it, or the coverage matrix SHALL list a named deferral with owner. `docs/product/features/admin-events.feature` and e2e fixtures SHALL refer to the `/admin/featured` tab as **Featured events** (EN) / **Empfohlene Events** (DE), not the bare label **Featured** / **Empfohlen**.

#### Scenario: Docs and e2e titles align

- **WHEN** featured-partners hardening completes
- **THEN** shipped Playwright titles for in-scope scenarios match Gherkin `Scenario:` lines where the BDD contract requires it
- **OR** the coverage matrix lists a named deferral with owner

#### Scenario: Featured events tab wording in product docs

- **WHEN** `admin-events.feature` and admin e2e tab navigation are read after this step
- **THEN** the tab for `/admin/featured` is named Featured events / Empfohlene Events
- **AND** Featured partners routes are covered under admin-partners (or adjacent) Gherkin and fixtures

### Requirement: Admin publish and unpublish featured membership
Admins SHALL publish or unpublish a featured event from `/:locale/admin/featured/:eventId/publish` and `/:locale/admin/featured/:eventId/unpublish`, and a featured partner from `/:locale/admin/featured-partners/:partnerId/publish` and `/:locale/admin/featured-partners/:partnerId/unpublish`, via form POST on dedicated pages (no client-only toggle, no localStorage draft, no publish inside featured drag-reorder POST). Admin featured lists SHALL show Published or Draft for the **featured membership** flag and SHALL keep unpublished rows. Adding to featured SHALL create an unpublished featured row (database default) and MUST NOT by itself make Discover show the item. A missing featured row SHALL return admin 404. POST SHALL be idempotent when the membership is already in the requested state. Successful POST SHALL persist only that featured flag and redirect to the originating featured list.

#### Scenario: Publish featured event
- **WHEN** an admin confirms publish on a featured event whose catalog event is also published
- **THEN** Discover may list it
- **AND** the featured row stays on `/admin/featured`

#### Scenario: Unpublish featured partner
- **WHEN** an admin confirms unpublish on a featured partner
- **THEN** Discover Partner venues omits it
- **AND** the partner remains on `/admin/partners` and `/admin/featured-partners`

#### Scenario: Add to featured stays off Discover until publish
- **WHEN** an admin adds an event or partner to featured
- **THEN** the new featured row is unpublished
- **AND** success copy does not claim Discover is updated
- **AND** Discover still omits the item until the featured row is published (and, for events, the catalog event is published)

### Requirement: Canonical featured-partners Gherkin records featured publish
`docs/product/features/admin-partners.feature` SHALL include featured-partner publish/unpublish behavior with the titles below. Playwright `e2e/specs/admin-partners.spec.ts` SHALL map 1:1. Existing title **Add by searching existing partners** SHALL keep its name; its steps SHALL state that add creates an unpublished featured row and points at the featured-partner publish confirm. **Admin remove from featured partners keeps venue** SHALL still assert Discover Partner venues no longer lists the partner after remove. Selectors SHALL be proximity/layout only. Env skips (`E2E_ADMIN_*`, R2) MAY remain. The system SHALL NOT add `@skip-no-ui` for these MVP scenarios.

#### Scenario: Add featured partner stays off Discover until publish
- **WHEN** an admin adds a partner to featured and does not publish the featured row
- **THEN** the partner is on `/admin/featured-partners` as Draft
- **AND** a guest on `/:locale/discover` does not see that partner in Partner venues

#### Scenario: Publish featured partner shows on Discover
- **WHEN** an admin confirms publish on a featured partner
- **THEN** a guest on `/:locale/discover` may see that partner in Partner venues
- **AND** the partner remains on `/admin/featured-partners` as Published

#### Scenario: Unpublish featured partner keeps venue
- **WHEN** an admin confirms unpublish on a featured partner
- **THEN** Discover Partner venues omits it
- **AND** the partner remains on `/admin/partners` and `/admin/featured-partners`
