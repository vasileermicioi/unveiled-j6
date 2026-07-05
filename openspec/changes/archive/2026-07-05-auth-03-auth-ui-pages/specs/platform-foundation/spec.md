## MODIFIED Requirements

### Requirement: Robots.txt route

The application SHALL serve `/robots.txt` allowing crawl of public marketing routes and disallowing auth, member, partner, and admin paths per `docs/migration/extras/seo-and-metadata.md`, with a `Sitemap:` directive pointing at `/sitemap.xml`.

#### Scenario: Robots.txt disallows admin

- **WHEN** a crawler requests `/robots.txt`
- **THEN** the response includes a disallow rule for admin paths

#### Scenario: Auth paths disallowed

- **WHEN** a crawler requests `/robots.txt`
- **THEN** the response includes disallow rules covering locale-prefixed auth routes (`/*/login`, `/*/signup`, `/*/forgot-password`, `/*/reset-password`)

#### Scenario: Sitemap directive present

- **WHEN** a crawler requests `/robots.txt`
- **THEN** the response includes `Sitemap: {SITE_URL}/sitemap.xml`
