## ADDED Requirements

### Requirement: Admin Featured partners management

The admin app SHALL expose a **Featured partners** tab and SSR pages under `/:locale/admin/featured-partners*` for listing, searching catalog partners not already featured, adding, and removing featured rows. Mutations SHALL use dedicated pages with form POST. Removing from featured SHALL keep the partner in `/admin/partners`. The list SHALL show curated partners ordered by `sort_order`.

#### Scenario: List featured partners

- **WHEN** an ADMIN opens "/:locale/admin/featured-partners"
- **THEN** they see the current featured partners list ordered by sort_order
- **AND** each row shows at least name (and logo thumbnail when present)

#### Scenario: Add by searching existing partners

- **WHEN** an ADMIN searches on "/:locale/admin/featured-partners/add?q="
- **THEN** they see matching partners that are not already featured
- **AND** submitting add creates a featured row for that partner
- **AND** they are redirected to the featured partners list

#### Scenario: Remove from featured keeps partner venue

- **GIVEN** a partner is on the Featured partners list
- **WHEN** an ADMIN confirms remove on "/:locale/admin/featured-partners/:partnerId/remove"
- **THEN** the partner disappears from the featured partners list
- **AND** Discover no longer lists it in Partner venues
- **AND** the partner remains available in "/:locale/admin/partners"

## MODIFIED Requirements

### Requirement: Featured events admin tab label

The admin tab that routes to `/:locale/admin/featured` SHALL be labeled **Featured events** (EN) / **Empfohlene Events** (DE), not the bare label **Featured** / **Empfohlen**. Routes under `/admin/featured*` remain the featured-events surfaces (including gallery entry from the featured-events list).

#### Scenario: Featured events tab label

- **WHEN** an ADMIN views admin chrome tabs
- **THEN** the tab for "/:locale/admin/featured" reads "Featured events" / "Empfohlene Events"
