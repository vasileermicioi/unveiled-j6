## ADDED Requirements

### Requirement: Event published flag
Each `events` row SHALL have `published` boolean NOT NULL. Existing rows SHALL backfill `true`. New inserts SHALL default to `false`. Admin `getEventById` / `listEvents` SHALL return unpublished rows. Public `getPublicEventById` SHALL return null when unpublished. `listBookableEventsForSitemap` and `listUpcomingEvents` SHALL include only `published = true` events (in addition to their existing date/capacity filters).

#### Scenario: Draft is admin-visible and publicly missing
- **WHEN** an event is unpublished
- **THEN** `getEventById` returns the row
- **AND** `getPublicEventById` returns null

#### Scenario: Unpublished events are omitted from sitemap and upcoming picker
- **WHEN** an upcoming event has remaining capacity and `published = false`
- **THEN** it does not appear in `listBookableEventsForSitemap`
- **AND** it does not appear in `listUpcomingEvents`
- **AND** a published sibling with the same dates still appears

### Requirement: Featured published flags
`featured_events.published` and `featured_partners.published` SHALL be boolean NOT NULL with the same backfill (`true`) and new-insert default (`false`) as events. Discover-facing lists SHALL use `publishedOnly: true` (featured flag and, for events, catalog `events.published`). Admin featured lists SHALL return unpublished featured rows.

#### Scenario: Discover omits unpublished featured
- **WHEN** `listFeaturedEvents` / `listFeaturedPartners` is called with `publishedOnly: true`
- **THEN** unpublished featured rows are omitted
- **AND** a featured event whose catalog event is unpublished is omitted even if the featured row is published

#### Scenario: Admin featured lists include drafts
- **WHEN** `listFeaturedEvents` / `listFeaturedPartners` is called without `publishedOnly` (or with `publishedOnly: false`)
- **THEN** unpublished featured rows are included

### Requirement: Set published
`setEventPublished`, `setFeaturedEventPublished`, and `setFeaturedPartnerPublished` SHALL persist the boolean and SHALL NOT delete rows, cancel bookings, or alter the other publish flags. A missing catalog event or featured row SHALL fail with the existing not-found error (`EVENT_NOT_FOUND` / `PARTNER_NOT_FOUND`). A write that is already in the requested state SHALL succeed as a no-op.

#### Scenario: Unpublish keeps featured membership
- **WHEN** an admin unpublishes a catalog event that has a featured row
- **THEN** the featured row remains
- **AND** Discover `publishedOnly` omits it until both flags are true

#### Scenario: Missing row is not found
- **WHEN** `setEventPublished` is called for an unknown event id
- **THEN** the operation fails with `EVENT_NOT_FOUND` and no other rows change
