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

The admin tab that routes to `/:locale/admin/featured` SHALL be labeled **Featured events** (EN) / **Empfohlene Events** (DE), not the bare label **Featured** / **Empfohlen**. Routes under `/admin/featured*` remain the featured-events surfaces (including gallery entry from the featured-events list).

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
