## ADDED Requirements

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
