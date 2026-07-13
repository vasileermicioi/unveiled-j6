## REMOVED Requirements

### Requirement: Static sitemap
**Reason:** Phase 1 static-only sitemap is replaced by the Phase 8 dynamic sitemap that also lists currently bookable public event detail URLs per `docs/product/extras/seo-and-metadata.md`.
**Migration:** Implement and follow **Dynamic sitemap includes bookable events**.

## ADDED Requirements

### Requirement: Dynamic sitemap includes bookable events
The application SHALL serve `/sitemap.xml` containing absolute URLs for both locale versions of marketing and legal pages and both locale versions of currently bookable public event detail URLs (`/:locale/events/:id`). Event entries SHALL include `lastmod` derived from the event's `updated_at`. An event is bookable when `date_time` is in the future and `remaining_capacity` is greater than zero. The sitemap MUST NOT include the member-gated `/:locale/events` feed (path without an event id), sold-out or past events, bare `/`, or private/auth/admin paths.

#### Scenario: Bookable event listed
- **WHEN** an event is in the future with remaining capacity greater than zero
- **THEN** both `/de/events/:id` and `/en/events/:id` appear in sitemap.xml with a `lastmod` value

#### Scenario: Member feed excluded
- **WHEN** sitemap.xml is generated
- **THEN** it does not list `/:locale/events` without an event id

#### Scenario: Sitemap includes marketing routes
- **WHEN** a crawler requests `/sitemap.xml`
- **THEN** the response is valid XML containing locale marketing/legal URLs such as `/de` and `/en/terms`
