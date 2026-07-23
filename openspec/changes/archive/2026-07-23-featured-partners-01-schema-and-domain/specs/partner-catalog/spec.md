## ADDED Requirements

### Requirement: Featured partners join table

The system SHALL persist admin-curated Discover partners in a `featured_partners` join table keyed by existing `partners.id`, without duplicating partner payload columns. Each row SHALL store `partner_id` (PK, FK → `partners.id` ON DELETE CASCADE), `sort_order` (integer, not null), and `created_at` (timestamptz, not null, default now). Removing a featured row MUST NOT delete the underlying partner. Adding a partner that is already featured SHALL be rejected. New featured rows SHALL receive `sort_order = max(existing)+1` (append). Listing SHALL order by `sort_order` ascending then a stable secondary key (partner `name`). Catalog APIs SHALL live in `@unveiled/db` and MAY accept an optional list limit for Discover’s “up to 8” display. The domain SHALL also expose search of catalog partners excluding already-featured rows (name search consistent with `listPartners`).

#### Scenario: Add featured partner appends sort order

- **WHEN** an admin adds a partner that is not yet featured
- **THEN** a `featured_partners` row is created with the next `sort_order`
- **AND** the partner row remains in `partners`

#### Scenario: Duplicate featured partner rejected

- **WHEN** an admin attempts to feature a partner that is already featured
- **THEN** the operation is rejected without creating a second row

#### Scenario: Remove featured partner keeps venue

- **WHEN** an admin removes a partner from featured
- **THEN** the `featured_partners` row is deleted
- **AND** the `partners` row still exists

#### Scenario: Partner delete cascades featured row

- **WHEN** a partner venue is deleted
- **THEN** any `featured_partners` row for that partner is removed by cascade

#### Scenario: List featured partners respects sort order and optional limit

- **WHEN** `listFeaturedPartners` is called with an optional `limit`
- **THEN** results are ordered by `sort_order` ascending then partner `name`
- **AND** at most `limit` rows are returned when `limit` is provided

#### Scenario: Search excludes already-featured partners

- **WHEN** `searchPartnersNotFeatured` is called with a query matching both featured and non-featured partners
- **THEN** only non-featured matching partners are returned
