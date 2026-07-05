# Static Marketing Pages

Public marketing and legal pages for the Unveiled Berlin rewrite — bilingual informational routes that require no authentication in Phase 1.

## Requirements

### Requirement: Static marketing pages capability exists

The rewrite SHALL track public marketing page behavior under the `static-marketing-pages` capability, covering informational routes that require no authentication in Phase 1.

#### Scenario: Capability scope

- **WHEN** Phase 1 step 01 is complete
- **THEN** the content and SEO primitives required by subsequent marketing route steps are available in `apps/web`

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

### Requirement: FAQ page

The route `/:locale/faq` SHALL render a support header, a HelpSection with exactly three FAQ items in an accordion (one open at a time, first open by default), a mailto link to `support@unveiled.berlin`, and a back button, using verbatim DE/EN copy from `static-pages-content.md`.

#### Scenario: FAQ accordion behavior

- **WHEN** a guest expands the second FAQ item on `/de/faq`
- **THEN** only that item is expanded and the previously open item collapses

#### Scenario: Support email visible

- **WHEN** a guest visits `/en/faq`
- **THEN** they see a clickable mailto link to `support@unveiled.berlin`

#### Scenario: FAQPage structured data

- **WHEN** a crawler requests `/de/faq`
- **THEN** the HTML includes `schema.org/FAQPage` JSON-LD wrapping the three Q&A pairs

#### Scenario: FAQ page SEO

- **WHEN** a crawler requests `/en/faq`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

### Requirement: Membership info page

The route `/:locale/membership` SHALL render plan information (title, subtitle, perks, guarantee, secure-payment line) from the `checkout` content keys without functional Stripe checkout or auth requirement in Phase 1.

#### Scenario: Plan details visible

- **WHEN** a guest visits `/de/membership`
- **THEN** they see the German plan title and subtitle from `content-i18n-inventory.md` checkout keys

#### Scenario: Credits do not roll over

- **WHEN** a guest views membership perks in either locale
- **THEN** the perks list does NOT claim credits roll over; it reflects monthly fresh credits per the corrected copy decision

#### Scenario: No payment processing

- **WHEN** a guest clicks the primary membership CTA in Phase 1
- **THEN** no Stripe checkout session is created and no payment form is shown

#### Scenario: Membership page SEO

- **WHEN** a crawler requests `/de/membership`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

### Requirement: Discover marketing preview page

The route `/:locale/discover` SHALL render a public marketing preview with hero stats, three value proposition cards, a preview grid of mock upcoming events, membership category highlights, partner venue highlights, and a "missing venue" callout, using verbatim copy from `static-pages-content.md` and hardcoded mock data in Phase 1.

#### Scenario: Discover page sections

- **WHEN** a guest visits `/de/discover`
- **THEN** they see the hero panel, value cards, event preview grid, membership categories, and partner venues sections

#### Scenario: Mock event grid

- **WHEN** mock event data is present
- **THEN** up to six EventCard previews render with guest CTA labels "Mehr sehen" (DE) or "See details" (EN)

#### Scenario: Empty event state

- **WHEN** the mock event array is empty
- **THEN** the dashed-border empty state message from `static-pages-content.md` is shown

#### Scenario: Guest never sees waitlist CTA

- **WHEN** a guest views an EventCard preview for a mock sold-out event
- **THEN** the CTA still reads "See details" / "Mehr sehen", not "Waitlist"

#### Scenario: Discover page SEO

- **WHEN** a crawler requests `/de/discover`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

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

The application SHALL display a cookie consent banner on first visit offering accept or decline for non-essential cookies, persist the decision, and not re-prompt until the decision expires or storage is cleared.

#### Scenario: Banner on first visit

- **WHEN** a guest loads any page with no prior consent decision stored
- **THEN** a cookie consent banner is visible with accept and decline actions

#### Scenario: Decision persisted

- **WHEN** a guest accepts or declines cookies
- **THEN** the banner is hidden on subsequent page loads until storage is cleared or expires

#### Scenario: Phase 1 no gating yet

- **WHEN** a guest declines non-essential cookies in Phase 1
- **THEN** no third-party map embed is loaded (none exists yet) and the site remains fully usable

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
