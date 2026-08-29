## ADDED Requirements

### Requirement: Canonical schema SEO and decisions document three published flags
`docs/product/database/schema-overview.md` SHALL document `published` boolean NOT NULL on `events`, `featured_events`, and `featured_partners` (existing rows backfilled `true`; new inserts default `false`; unpublish does not delete rows or drop featured membership). `docs/product/extras/seo-and-metadata.md` SHALL state that unpublished `/events/:id` is HTTP 404 (same as missing), not indexable, and not listed in `sitemap.xml`. `docs/product/sitemap/sitemap.md` SHALL keep the six publish/unpublish admin routes and the events `published=` query. `docs/product/extras/content-i18n-inventory.md` SHALL list the step-02 admin publish copy keys. `docs/product/extras/gaps-and-decisions.md` SHALL log the three independent flags (Discover events need both featured and catalog published; no `partners.published`). `docs/product/testing/coverage-matrix.md` SHALL add a row for every new Scenario (pass or documented skip).

#### Scenario: Schema overview names the three flags
- **WHEN** a reader opens `schema-overview.md` after this change
- **THEN** `events.published`, `featured_events.published`, and `featured_partners.published` are documented with backfill/default and independence

#### Scenario: Unpublished detail is not indexable
- **WHEN** an event is unpublished
- **THEN** `/:locale/events/:id` is not in `sitemap.xml`
- **AND** SEO docs treat it as 404 / not indexable (not `noindex` 200)
