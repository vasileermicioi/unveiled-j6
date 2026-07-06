## ADDED Requirements

### Requirement: Cookie consent banner

The application SHALL display a cookie consent banner on first visit offering accept or decline for non-essential cookies, persist the decision, and not re-prompt until the decision expires or storage is cleared.

#### Scenario: Banner on first visit

- **WHEN** a guest loads any page with no prior consent decision stored
- **THEN** a cookie consent banner is visible with accept and decline actions

#### Scenario: Decision persisted

- **WHEN** a guest accepts or declines cookies
- **THEN** the banner is hidden on subsequent page loads until storage is cleared or expires

#### Scenario: Phase 1 no gating yet

- **WHEN** a guest declines non-essential cookies in Phase 1
- **THEN** no MapLibre GL JS map island or OpenStreetMap tile requests are loaded (none exists yet) and the site remains fully usable

### Requirement: Static sitemap

The application SHALL serve `/sitemap.xml` listing absolute URLs for both locale versions of every Phase 1 static/marketing/legal page.

#### Scenario: Sitemap includes marketing routes

- **WHEN** a crawler requests `/sitemap.xml`
- **THEN** the response is valid XML containing `/de/discover` and `/en/terms` among other static page URLs

#### Scenario: No event URLs in Phase 1

- **WHEN** Phase 1 sitemap is generated
- **THEN** it does not include `/events/:id` URLs

### Requirement: Site-wide Open Graph fallback

The application SHALL provide a default Open Graph image at `apps/web/public/og-default.png` (or equivalent) used for marketing and legal pages that have no page-specific image.

#### Scenario: Default OG image on FAQ

- **WHEN** a crawler inspects Open Graph tags on `/de/faq`
- **THEN** `og:image` references the site-wide fallback image URL
