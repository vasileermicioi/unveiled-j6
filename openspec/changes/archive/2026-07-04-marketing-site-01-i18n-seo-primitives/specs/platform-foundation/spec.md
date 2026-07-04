## ADDED Requirements

### Requirement: Marketing page content modules

The application SHALL provide typed locale content modules under `apps/web/app/lib/content/` (or equivalent) containing verbatim DE/EN copy for static marketing pages, sourced from `docs/migration/ui/static-pages-content.md` and `docs/migration/extras/content-i18n-inventory.md`.

#### Scenario: German landing copy available

- **WHEN** a route requests landing page content for locale `de`
- **THEN** the hero subheadline matches the German string from `static-pages-content.md` exactly

#### Scenario: English FAQ copy available

- **WHEN** a route requests FAQ content for locale `en`
- **THEN** all three Q&A pairs match the English strings from `static-pages-content.md` exactly

### Requirement: Server-rendered SEO metadata helper

The application SHALL expose a SEO helper that builds per-page `<title>`, `<meta name="description">`, `<link rel="canonical">`, hreflang alternates (`de`, `en`, `x-default` pointing at `de`), and Open Graph / Twitter Card tags, rendered in the initial SSR HTML via `_renderer.tsx`.

#### Scenario: Marketing page title pattern

- **WHEN** a page sets title `"FAQ"` for locale `de`
- **THEN** the rendered document title is `FAQ — Unveiled Berlin`

#### Scenario: Hreflang reciprocity

- **WHEN** a user views `/de/faq`
- **THEN** the HTML head includes `hreflang="de"`, `hreflang="en"`, and `hreflang="x-default"` alternate links with absolute URLs

#### Scenario: Canonical self-reference

- **WHEN** a user views `/en/discover`
- **THEN** `<link rel="canonical">` points at the English URL for that page, not the German version

### Requirement: Shared marketing layout primitives

The application SHALL provide reusable `PageHero` and `SectionCard` components implementing the bordered-card + eyebrow + display-headline pattern described in `static-pages-content.md` cross-page observations.

#### Scenario: PageHero structure

- **WHEN** a marketing page renders `PageHero`
- **THEN** it displays an optional eyebrow, uppercase display headline, and supporting paragraph inside a bordered card on the yellow page background
