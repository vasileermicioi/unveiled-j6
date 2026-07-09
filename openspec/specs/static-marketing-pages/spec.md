# Static Marketing Pages

Phase 1–4 public marketing routes, legal pages, and discover preview integration.

## Requirements

### Requirement: Discover marketing preview page

The locale home route `/:locale` SHALL render the Discover marketing preview with hero stats, three value proposition cards, a preview grid of up to six upcoming catalog events (soonest first), membership category highlights, partner venue highlights with logos where available, and a "missing venue" callout, using verbatim static copy from `static-pages-content.md` for hero and value sections while sourcing event and partner preview data from the database. The legacy path `/:locale/discover` SHALL redirect to `/:locale`.

#### Scenario: Discover page sections

- **WHEN** a guest visits `/de`
- **THEN** they see the hero panel, value cards, event preview grid, membership categories, and partner venues sections

#### Scenario: Live event grid

- **WHEN** at least one future event exists in the catalog
- **THEN** up to six EventCard components render with guest CTA labels "Mehr sehen" (DE) or "See details" (EN), ordered by ascending `date_time`

#### Scenario: Empty event state

- **WHEN** no future events exist in the catalog
- **THEN** the dashed-border empty state message from `static-pages-content.md` is shown

#### Scenario: Guest never sees waitlist CTA

- **WHEN** a guest views an EventCard for a sold-out upcoming event on discover
- **THEN** the CTA still reads "See details" / "Mehr sehen", not "Waitlist"

#### Scenario: Discover page SEO

- **WHEN** a crawler requests `/de`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

#### Scenario: Legacy discover path redirects home

- **WHEN** a guest visits `/de/discover`
- **THEN** they are redirected to `/de`

#### Scenario: Partner logos from catalog

- **WHEN** a partner in the venue grid has a `logo_image_id`
- **THEN** the grid displays the partner logo using the `medium-640` variant URL

### Requirement: Legal pages

The routes `/:locale/impressum`, `/:locale/privacy`, and `/:locale/terms` SHALL render structured legal content in the visitor's selected language and be linked from the site footer on every page.

#### Scenario: Impressum accessible

- **WHEN** a guest clicks "IMPRESSUM" in the German footer
- **THEN** they navigate to `/de/impressum` and see Impressum content with German headings

#### Scenario: Privacy policy accessible

- **WHEN** a guest visits `/en/privacy`
- **THEN** they see Privacy Policy content with English headings

#### Scenario: Terms accessible

- **WHEN** a guest visits `/de/terms`
- **THEN** they see Terms of Service (AGB) content with German headings

#### Scenario: Footer linkage on all pages

- **WHEN** a guest views any locale page
- **THEN** the footer contains working links to Impressum, Privacy, and Terms in the active language

#### Scenario: Legal page SEO

- **WHEN** a crawler requests `/en/impressum`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

### Requirement: Cookie consent banner

The application SHALL display a cookie consent banner on first visit offering accept or decline for non-essential cookies, persist the decision, and not re-prompt until the decision expires or storage is cleared. Accepting consent SHALL allow the event map island to load MapLibre GL JS and OpenStreetMap tiles. Declining (or lacking an accepted decision) SHALL replace the map with a static fallback and MUST NOT load MapLibre or third-party map tiles. Error tracking remains ungated (unchanged).

#### Scenario: Banner on first visit

- **WHEN** a guest loads any page with no prior consent decision stored
- **THEN** a cookie consent banner is visible with accept and decline actions

#### Scenario: Decision persisted

- **WHEN** a guest accepts or declines cookies
- **THEN** the banner is hidden on subsequent page loads until storage is cleared or expires

#### Scenario: Declining consent disables map tiles

- **WHEN** a user declines non-essential cookies and views a page that would show the event map
- **THEN** no MapLibre GL JS map island or OpenStreetMap tile requests are loaded
- **AND** a static fallback is shown instead
- **AND** the site remains fully usable

### Requirement: Static sitemap

The application SHALL serve `/sitemap.xml` listing absolute URLs for both locale versions of every Phase 1 static/marketing/legal page.

#### Scenario: Sitemap includes marketing routes

- **WHEN** a crawler requests `/sitemap.xml`
- **THEN** the response is valid XML containing `/de` and `/en/terms` among other static page URLs

#### Scenario: No event URLs in Phase 1

- **WHEN** Phase 1 sitemap is generated
- **THEN** it does not include `/events/:id` URLs

### Requirement: Site-wide Open Graph fallback

The application SHALL provide a default Open Graph image at `apps/web/public/og-default.png` (or equivalent) used for marketing and legal pages that have no page-specific image.

#### Scenario: Default OG image on FAQ

- **WHEN** a crawler inspects Open Graph tags on `/de/faq`
- **THEN** `og:image` references the site-wide fallback image URL

### Requirement: Automated browser coverage for static pages

Each Gherkin scenario in `docs/migration/features/static-pages.feature` SHALL have a Playwright test in `e2e/specs/static-pages.spec.ts` whose title matches the scenario line (including the `Scenario:` prefix). Tests SHALL use proximity-only selectors and default locale `de` unless the scenario requires bilingual coverage. The declining-consent map scenario SHALL assert against a real map surface (consent fallback shown, no OpenStreetMap tile requests) on a public event detail page that mounts `EventMap`.

#### Scenario: Marketing and legal flows are E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/static-pages.spec.ts`
- **THEN** discover home, how-it-works, FAQ, legacy `/discover` redirect, bilingual toggle, legal footer links, and cookie consent behaviors are asserted in a real browser

#### Scenario: Cookie first-visit isolation

- **WHEN** a static-pages cookie scenario requires a first visit
- **THEN** the test clears the `unveiled:cookie-consent` decision before asserting the banner

#### Scenario: Declining consent disables map embed

- **WHEN** the user has declined non-essential cookies and views a public event detail page with coordinates
- **THEN** the map embed is not loaded, a static fallback (including an external OpenStreetMap link) is shown, and no OpenStreetMap tile requests are made
