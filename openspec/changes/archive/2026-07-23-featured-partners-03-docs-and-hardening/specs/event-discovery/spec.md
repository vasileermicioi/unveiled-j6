## ADDED Requirements

### Requirement: Product docs match featured partners on Discover

`docs/product/` SHALL document Discover Partner venues as admin-curated `featured_partners` (up to 8 by `sort_order`), not an automatic catalog slice. Empty curated list hides the section. Sitemap, static Discover copy, component map, schema overview, i18n inventory, gaps-and-decisions, and coverage matrix SHALL match shipped behavior including the **Featured events** admin tab label and **Featured partners** admin routes.

#### Scenario: Feature files document featured partners

- **WHEN** product Gherkin and sitemap are read after this step
- **THEN** they include Featured partners admin list/add/remove and Discover curated partner venues behavior
- **AND** the admin tab for `/admin/featured` is named Featured events

### Requirement: Automated coverage for featured partners

The BDD/e2e suite SHALL cover (or matrix-defer with owner): Featured events tab label/navigation still works; Featured partners add/remove keeps the venue; Discover shows curated partners only and hides Partner venues when none are featured. Playwright SHALL use proximity/layout selectors only. Demo seed SHALL create a small set of `featured_partners` rows so Discover Partner venues can be non-empty after `seed:demo`.

#### Scenario: Guest sees featured partners only

- **WHEN** a guest visits Discover with a mixed featured/non-featured partner set
- **THEN** featured partners appear in Partner venues
- **AND** non-featured partners do not appear solely for existing in the catalog
