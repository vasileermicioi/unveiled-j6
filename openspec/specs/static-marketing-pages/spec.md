# Static Marketing Pages

## Purpose

Defines behavior and automated coverage for the public marketing routes (home, how-it-works, FAQ, discover preview), legal pages, and their locale/SEO contracts in Phase 1–4.

## Requirements

### Requirement: Discover marketing preview page

The locale home route `/:locale` SHALL render the Discover marketing preview with hero stats, three value proposition cards, a preview grid of up to six upcoming catalog events (soonest first), membership category highlights, partner venue highlights with logos where available, and a "missing venue" callout, using verbatim static copy from `static-pages-content.md` for hero and value sections while sourcing event and partner preview data from the database. Legacy `/:locale/discover` SHALL **301** redirect to `/:locale`. Bare `/discover` (no locale segment), when requested, SHALL **301** to the visitor's locale home (`/:locale` via `Accept-Language`, same resolution as `/`) so sitemap legacy paths do not 404.

#### Scenario: Discover page sections

- **WHEN** a guest visits `/de`
- **THEN** they see the hero panel, value cards, event preview grid, membership categories, and partner venues sections

#### Scenario: Live event grid

- **WHEN** at least one future event exists in the catalog
- **THEN** up to six EventCard components render with guest CTA labels "Bin dabei" (DE) or "Book Now" (EN) when capacity remains, ordered by ascending `date_time`

#### Scenario: Empty event state

- **WHEN** no future events exist in the catalog
- **THEN** the dashed-border empty state message from `static-pages-content.md` is shown

#### Scenario: Guest sold-out Waitlist CTA

- **WHEN** a guest views an EventCard for a sold-out upcoming event on discover
- **THEN** the CTA reads "Waitlist" / "Warteliste"
- **AND** following the CTA opens public `/events/:id` without being forced to log in

#### Scenario: Discover page SEO

- **WHEN** a crawler requests `/de`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

#### Scenario: Legacy discover path redirects home

- **WHEN** a guest visits `/de/discover`
- **THEN** they receive a **301** redirect to `/de`

#### Scenario: Bare discover path redirects to locale home

- **WHEN** a visitor requests `/discover` without a locale segment
- **THEN** they receive a **301** to `/:locale` (locale from `Accept-Language`, fallback `de`)

### Requirement: Discover partner venues section

The Discover locale home SHALL include a Partner venues section with a small uppercase eyebrow (“Partnerorte” / “Partner venues”) and a horizontal logo strip of featured partner venues (logo image or initial-letter fallback). The section SHALL NOT present a multi-column grid of address cards as the primary layout. The logo sequence markup SHALL include a duplicated partner sequence (or equivalent dual track) so a later continuous-loop animation can translate without restructuring. Partner addresses SHALL NOT be required as primary marquee cell content.

#### Scenario: Guest sees partner section prefix and logos

- **WHEN** a guest views `/:locale` with at least one featured partner
- **THEN** they see the Partner venues eyebrow and a horizontal sequence of partner logos (or initials)

#### Scenario: Partner strip is not an address card grid

- **WHEN** a guest views the Partner venues section on Discover
- **THEN** partner cells are logo-forward in a horizontal track and do not present address lines as the primary tile content

#### Scenario: Partner logos from catalog

- **WHEN** a partner in the strip has a `logo_image_id`
- **THEN** the strip displays the partner logo using the `medium-640` variant URL (or the existing Discover logo URL helper)

#### Scenario: Missing logo uses initial fallback

- **WHEN** a partner in the strip has no usable logo URL
- **THEN** the cell shows a large initial letter derived from the partner name

### Requirement: Partner venues continuous marquee

When the user does not prefer reduced motion, the Discover partner logo strip SHALL scroll horizontally in a continuous, seamless loop without requiring user interaction. When `prefers-reduced-motion: reduce` is set, the strip SHALL remain static (wrapped or clipped) with no auto-scrolling animation.

#### Scenario: Continuous motion for default preference

- **WHEN** a guest views Discover with multiple partner logos and no reduced-motion preference
- **THEN** the logo strip moves continuously and the sequence appears to loop without a hard cut

#### Scenario: Reduced motion disables auto-scroll

- **WHEN** the user agent prefers reduced motion
- **THEN** partner logos do not auto-scroll

### Requirement: Partner marquee accessibility

The partner logo marquee SHALL expose a single accessible section name (via the visible eyebrow and/or `aria-label` / `aria-labelledby` on the region). Duplicated logo nodes used only for seamless looping SHALL be hidden from the accessibility tree (`aria-hidden` on the duplicate track or clone cells). Logo images SHALL be decorative (`alt=""`) when the venue name is otherwise available to AT or purely ornamental in the strip.

#### Scenario: Duplicate track is not double-read

- **WHEN** a screen reader user lands on the Partner venues section
- **THEN** each partner is not announced twice solely because of the seamless-loop duplicate sequence

#### Scenario: Section has an accessible name

- **WHEN** a screen reader user navigates by region or landmark to Partner venues
- **THEN** the section is announced once using the Partner venues eyebrow (or equivalent accessible name)

### Requirement: Partner venues empty list hides section

When Discover has zero featured partners to show in the strip, the Partner venues section SHALL NOT render (no empty marquee track and no partner-specific empty-state copy).

#### Scenario: No partners hides Partner venues

- **WHEN** a guest views `/:locale` with an empty featured-partners list
- **THEN** the Partner venues eyebrow and logo strip are not shown

### Requirement: Discover to events navigation

The public Discover experience (locale home `/:locale`) SHALL present marketing content and a curated event preview and SHALL provide a clear path into fuller event browsing: preview EventCard CTAs (**Book Now** / **Bin dabei**, or **Waitlist** / **Warteliste** when sold out) link to public `/events/:id` without forcing login, and a primary CTA path leads guests to signup or login that lands on member `/events` after auth (and onboarding if incomplete). Guests SHALL NOT receive a public full upcoming-events list equivalent to `/events` in MVP. Product docs (`docs/product/sitemap/sitemap.md`, `ui/app-shell.md`, `ui/static-pages-content.md`) SHALL document these CTAs without dead ends (doc updates may land in hardening). Phase 5.5 release spot-checks SHALL confirm these CTA hrefs and journeys (or record a named deferral with target phase).

#### Scenario: Discover preview links to public event detail

- **WHEN** a guest follows a Discover preview event CTA ("Book Now" / "Bin dabei")
- **THEN** they land on public `/events/:id` without being forced to log in

#### Scenario: Discover CTA path to the full member events feed

- **WHEN** a guest follows the primary browse-all-events CTA path to signup or login
- **THEN** they are taken to signup or login and after auth (and onboarding if incomplete) land on `/events`, never receiving a public full feed equivalent

#### Scenario: Guest has no public full feed

- **WHEN** a guest is not signed in
- **THEN** product docs and Discover CTAs do not offer an ungated `/events` browse list; the full feed remains member-gated

#### Scenario: Guest journey matches sitemap

- **WHEN** a guest follows Discover preview CTAs and auth CTAs during Phase 5.5 release verification
- **THEN** preview CTAs open public `/events/:id` and the full-browse path goes through signup/login toward member `/events` without exposing a public full feed

### Requirement: Legal pages

The routes `/:locale/impressum`, `/:locale/privacy`, and `/:locale/terms` SHALL render structured legal content in the visitor's selected language and be linked from the site footer on every page. Body copy SHALL use foreground contrast (not muted gray).

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

### Requirement: Legal page section body content

The system SHALL render each legal page section with a title and one or more body paragraphs sourced from localized content modules (not a single `placeholder` field). Each body entry SHALL be rendered as its own HeroUI `Paragraph` with foreground color on Impressum, Privacy, and Terms routes.

#### Scenario: Legal section shows body paragraphs

- **WHEN** a visitor opens Impressum, Privacy, or Terms
- **THEN** each listed section shows its title and at least one body paragraph from the content module
- **AND** the page does not rely on a `placeholder` field name in the content model

### Requirement: Impressum shows operator identity

The system SHALL publish a bilingual Impressum/Imprint page with operator name, representatives, postal address in Berlin, contact phone and email, content-responsibility statement, and standard liability/copyright notices — without placeholder copy. Privacy and Terms MAY refer to Impressum for operator identity instead of repeating full contact blocks.

#### Scenario: Impressum linked from footer shows real identity

- **WHEN** a visitor opens Impressum / Imprint from the footer LEGAL column
- **THEN** they see unveiled GmbH operator details (representatives, Greifswalder Straße 1, 10405 Berlin, phone, support email)
- **AND** the page language matches the URL locale (`de` or `en`)

#### Scenario: Impressum has no placeholder body copy

- **WHEN** a visitor views `/de/impressum` or `/en/impressum`
- **THEN** impressum section bodies do not contain Platzhalter or “Placeholder —” / “pending legal review” strings

### Requirement: Privacy policy describes membership data processing

The system SHALL publish a bilingual Privacy Policy that identifies the controller (or refers to Impressum), categories of personal data, purposes/legal bases at a high level, key processors, cookie/consent behavior for non-essential map tiles, retention overview, and data-subject rights — without placeholder copy.

#### Scenario: Privacy page covers controller and rights

- **WHEN** a visitor opens Privacy / Datenschutz
- **THEN** they see a reference to the Berlin operator identity and contact email
- **AND** they see coverage of processing purposes, cookies/consent, and GDPR rights
- **AND** the page language matches the URL locale

#### Scenario: Privacy page has no placeholder body copy

- **WHEN** a visitor views `/de/privacy` or `/en/privacy`
- **THEN** privacy section bodies do not contain Platzhalter or “Placeholder —” / “pending legal review” strings

### Requirement: Terms describe membership credits and booking

The system SHALL publish bilingual Terms of Service / AGB covering membership subscription, credit allotment and expiry (no rollover), booking/admission via partner venues, cancellation at a high level, liability, and governing law — without placeholder copy.

#### Scenario: Terms state credits do not roll over

- **WHEN** a visitor reads the Terms / AGB page
- **THEN** the copy states that unused credits do not roll over to the next period
- **AND** the page language matches the URL locale

#### Scenario: Terms page has no placeholder body copy

- **WHEN** a visitor views `/de/terms` or `/en/terms`
- **THEN** terms section bodies do not contain Platzhalter or “Placeholder —” / “pending legal review” strings

#### Scenario: Terms cover membership booking and cancellation

- **WHEN** a visitor opens Terms / AGB
- **THEN** they see coverage of membership/subscription, credits, bookings/admission, and cancellation
- **AND** the page language matches the URL locale

### Requirement: Legal pages are complete and regression-tested

The system SHALL keep Impressum, Privacy Policy, and Terms of Service linked from the footer LEGAL column, fully localized, free of placeholder copy, and covered by e2e assertions that verify distinctive body content on each page.

#### Scenario: Legal pages exist and are linked from the footer

- **WHEN** I visit the Impressum, Privacy Policy, or Terms of Service page
- **THEN** I see the corresponding legal content in my selected language
- **AND** each page shows non-placeholder body sections (not “pending legal review” stubs)
- **AND** each is linked from the site footer on every page

#### Scenario: Legal page body content is distinctive and non-placeholder

- **WHEN** a visitor opens `/de|en/impressum`, `/de|en/privacy`, or `/de|en/terms`
- **THEN** the page shows at least one distinctive real body string for that page type (e.g. Berlin address on Impressum, rights cue on Privacy, credits no-rollover cue on Terms)
- **AND** the rendered page does not contain `Platzhalter` or `pending legal review`

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

### Requirement: Site-wide Open Graph fallback

The application SHALL provide a site-wide Open Graph/Twitter fallback image used for marketing and legal pages that have no page-specific image. The asset SHALL be PNG **1200×630** on brand yellow `#FAFF86` at `/og-default-v2.png`. The Unveiled Berlin wordmark (logo SVG paths, black on yellow) SHALL fit entirely within the **center 630×630** of that canvas, with padding, so a 1:1 center crop (Telegram and similar) still shows the full mark. The public URL SHALL change when the artwork changes so crawlers refetch.

The SSR HTML SHALL include `og:image` (absolute URL of that fallback), `og:image:width` (`1200`), `og:image:height` (`630`), `og:image:type` (`image/png`), `og:image:alt`, and matching `twitter:image` with `twitter:card` = `summary_large_image`. Event detail SHALL continue to override `og:image` / `twitter:image` with the event `og-1200x630` variant URL when present (and SHALL set `og:image:type` to `image/webp` for that override).

#### Scenario: Default OG image on FAQ

- **WHEN** a crawler inspects Open Graph tags on `/de/faq` (or `/en/faq`)
- **THEN** `og:image` references the site-wide fallback image URL (`/og-default-v2.png`)

#### Scenario: Marketing page default OG includes dimension tags

- **WHEN** I view source on `/en/faq` (or another indexable marketing page)
- **THEN** `og:image` is the absolute site-wide fallback URL
- **AND** `og:image:width` is 1200 and `og:image:height` is 630
- **AND** `og:image:type` is `image/png`
- **AND** `og:image:alt` is present
- **AND** `twitter:card` is `summary_large_image` and `twitter:image` matches `og:image`

#### Scenario: Event page keeps event OG

- **WHEN** I view source on a bookable `/events/:id`
- **THEN** `og:image` is that event's `og-1200x630.webp` variant URL, not the site-wide fallback

#### Scenario: Fallback asset is served

- **WHEN** I GET the path in `og:image` for a marketing page
- **THEN** the response is 200 with Content-Type `image/png`

### Requirement: Automated browser coverage for static pages

Each Gherkin scenario in `docs/product/features/static-pages.feature` SHALL have a Playwright test in `e2e/specs/static-pages.spec.ts` whose title matches the scenario line (including the `Scenario:` prefix). Tests SHALL use proximity-only selectors and default locale `de` unless the scenario requires bilingual coverage. Coverage SHALL include Discover preview→public detail and Discover CTA→auth→member `/events` in addition to home, how-it-works, FAQ, legacy `/discover`, bilingual, legal, and cookie scenarios. The declining-consent map scenario SHALL assert against a real map surface (consent fallback shown, no OpenStreetMap tile requests) on a public event detail page that mounts `EventMap`. The FAQ scenario SHALL additionally verify, against the refreshed Q&A copy and in both locales, the support header (eyebrow, H1, support-email link), two representative questions from the refreshed item set, the second item's answer text, and single-expand accordion behavior (opening item 2 collapses item 1) — using role/proximity selectors only, with no assertions coupling to the pre-refresh copy.

#### Scenario: Marketing and legal flows are E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/static-pages.spec.ts`
- **THEN** discover home, Discover preview→detail, Discover CTA→auth→`/events`, how-it-works, FAQ, legacy `/discover` redirect, bilingual toggle, legal footer links, and cookie consent behaviors are asserted in a real browser (or listed as named deferrals in the coverage matrix)

#### Scenario: Cookie first-visit isolation

- **WHEN** a static-pages cookie scenario requires a first visit
- **THEN** the test clears the `unveiled:cookie-consent` decision before asserting the banner

#### Scenario: Declining consent disables map embed

- **WHEN** the user has declined non-essential cookies and views a public event detail page with coordinates
- **THEN** the map embed is not loaded, a static fallback (including an external OpenStreetMap link) is shown, and no OpenStreetMap tile requests are made

#### Scenario: FAQ scenario passes on refreshed copy

- **WHEN** the Playwright `Scenario: FAQ` test runs against the refreshed FAQ content (de locale run with bilingual assertions covering en copy)
- **THEN** it passes, asserting item 1 ("Wie funktioniert die unveiled Mitgliedschaft?" / "How does the unveiled membership work?") and item 2 ("Wofür kann ich meine Credits nutzen?" / "What can I use my Credits for?") as expandable buttons, item 2's answer visible after clicking it, and item 1's answer no longer visible (single-expand)

### Requirement: FAQ page content

The system SHALL render `/faq` (per locale) as the existing hero + support-card layout, with an accordion of 11 Q&As covering membership mechanics, Credits usage and pricing, rollover, booking cancellation, no-show, event cancellation, rescheduling, membership cancellation, account sharing, and partner-organised experiences, in the visitor's locale, with only one item expanded at a time and the first item expanded by default. Question and answer copy SHALL match the approved copy in `.dev-plan/FAQs.md` (EN) and its DE translation; layout and interaction remain unchanged. The hero subheadline SHALL read (DE) "Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort." and (EN) "Everything important about membership, credits, booking, and cancellation in one place.". Answers SHALL be plain text; support email addresses inside answers render as the literal text `support@unveiled.berlin` (the clickable support link remains only in the help-card description). The 2-month Credits rollover promise in the FAQ is deliberate interim forward copy: the credit-engine rollover behavior ships in a later iteration (tracked as a separate follow-up feature) and support fulfills it manually until then. Canonical documentation (`docs/product/ui/static-pages-content.md` §FAQ) SHALL match the shipped copy, and `docs/product/extras/gaps-and-decisions.md` SHALL record the intentional interim inconsistency against Terms/billing copy and the follow-up feature.

#### Scenario: FAQ shows refreshed content

- **WHEN** a visitor opens `/de/faq` or `/en/faq`
- **THEN** the accordion lists the 11 approved Q&As in order, first item expanded
- **AND** the page hero, support email link, and accordion behavior are visually unchanged

#### Scenario: FAQ JSON-LD mirrors content

- **WHEN** `/faq` is rendered in a locale
- **THEN** the `schema.org/FAQPage` JSON-LD `mainEntity` contains exactly the same 11 questions and answers as the visible accordion

#### Scenario: Rollover answer ships as approved promise

- **WHEN** a visitor expands "What happens to unused Credits?" (EN) or "Was passiert mit ungenutzten Credits?" (DE)
- **THEN** the answer states that unused Credits roll over to the next month and can be saved up to 2 months' worth, verbatim per approved copy

#### Scenario: Docs match shipped FAQ

- **WHEN** an implementer reads `docs/product/ui/static-pages-content.md` §FAQ
- **THEN** the quoted DE/EN copy, subheadline, and item count equal the shipped FAQ content module

#### Scenario: Rollover decision recorded

- **WHEN** a reader compares the FAQ rollover promise against Terms/billing copy
- **THEN** `docs/product/extras/gaps-and-decisions.md` records the intentional interim inconsistency and the follow-up feature that will align the credit engine and legal copy

### Requirement: FAQ content guard

The system SHALL keep a unit test that asserts the FAQ content module exposes 11 non-empty Q&A items per locale (DE and EN) and that the `FAQPage` JSON-LD builder emits exactly those 11 entities. The test SHALL run without any external services.

#### Scenario: Guard test fails on drift

- **WHEN** the item count or copy shape of the FAQ content module changes unintentionally (missing/empty question or answer, or a per-locale count other than 11)
- **THEN** `bun test apps/web` fails on the FAQ guard test

#### Scenario: JSON-LD entity count matches content

- **WHEN** the FAQ guard test builds JSON-LD from the shipped FAQ items
- **THEN** the resulting `mainEntity` array contains exactly 11 entries
