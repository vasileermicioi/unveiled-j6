## ADDED Requirements

### Requirement: Robots.txt route

The application SHALL serve `/robots.txt` allowing crawl of public marketing routes and disallowing auth, member, partner, and admin paths per `docs/migration/extras/seo-and-metadata.md`, with a `Sitemap:` directive pointing at `/sitemap.xml`.

#### Scenario: Robots.txt disallows admin

- **WHEN** a crawler requests `/robots.txt`
- **THEN** the response includes a disallow rule for admin paths

#### Scenario: Sitemap directive present

- **WHEN** a crawler requests `/robots.txt`
- **THEN** the response includes `Sitemap: {SITE_URL}/sitemap.xml`

### Requirement: Site URL configuration

The application SHALL read `SITE_URL` from environment variables for absolute canonical, Open Graph, and sitemap URLs, defaulting to `http://localhost:3000` in local development.

#### Scenario: Production canonical URLs

- **WHEN** `SITE_URL=https://staging.example.com` is set
- **THEN** canonical and sitemap URLs use that origin

### Requirement: Phase 1 release gate

Phase 1 SHALL be considered complete when all public marketing routes render in DE and EN, legal pages are footer-linked, View Source shows server-rendered meta tags, robots.txt and sitemap.xml are served, cookie consent works, and staging loads without console errors.

#### Scenario: Client demo acceptance

- **WHEN** the client opens staging and toggles DE/EN across marketing pages
- **THEN** they see the full brochure site with legal pages, SEO-ready metadata, and no console errors
