## ADDED Requirements

### Requirement: Landing page

The locale root `/:locale` SHALL render a marketing landing page with hero headline "Unveiled Berlin", localized subheadline, CTAs to discover and how-it-works, trust microcopy, a conversion card linking to signup/login (not an inline auth form), and three English trust badges identical in both locales.

#### Scenario: German landing hero

- **WHEN** a guest visits `/de`
- **THEN** they see the German subheadline from `static-pages-content.md` and CTAs labeled "Entdecken" and "So funktioniert's"

#### Scenario: English landing hero

- **WHEN** a guest visits `/en`
- **THEN** they see the English subheadline and CTAs labeled "Discover" and "How it works"

#### Scenario: Trust badges not translated

- **WHEN** a guest views the landing page in either locale
- **THEN** the three badges read "Member-owned", "Verified Events", and "Berlin Focused"

#### Scenario: Landing page SEO

- **WHEN** a crawler requests `/de`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

### Requirement: How it works page

The route `/:locale/how-it-works` SHALL render a static explainer with hero panel, three-step membership process cards, and a dark "Why this works" panel with three value points, using verbatim copy from `static-pages-content.md`.

#### Scenario: Three-step explainer

- **WHEN** a guest visits `/de/how-it-works`
- **THEN** they see three numbered steps describing browse, become a member, and book an event in German

#### Scenario: Value points panel

- **WHEN** a guest visits `/en/how-it-works`
- **THEN** they see the inverted "Why this works" section with three English value tiles

### Requirement: Organization structured data on landing

The landing page SHALL emit `schema.org/Organization` JSON-LD in the server-rendered HTML.

#### Scenario: Organization JSON-LD present

- **WHEN** a crawler requests `/de`
- **THEN** the HTML includes a `<script type="application/ld+json">` block with Organization schema including the site name and contact email
