## MODIFIED Requirements

### Requirement: Discover marketing preview page

The locale home route `/:locale` SHALL render the Discover marketing preview with hero stats, three value proposition cards, a preview grid of up to six upcoming catalog events (soonest first), membership category highlights, partner venue highlights with logos where available, and a "missing venue" callout, using verbatim static copy from `static-pages-content.md` for hero and value sections while sourcing event and partner preview data from the database. Legacy `/:locale/discover` SHALL **301** redirect to `/:locale`. Bare `/discover` (no locale segment), when requested, SHALL **301** to the visitor's locale home (`/:locale` via `Accept-Language`, same resolution as `/`) so sitemap legacy paths do not 404.

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
- **THEN** they receive a **301** redirect to `/de`

#### Scenario: Bare discover path redirects to locale home

- **WHEN** a visitor requests `/discover` without a locale segment
- **THEN** they receive a **301** to `/:locale` (locale from `Accept-Language`, fallback `de`)

#### Scenario: Partner logos from catalog

- **WHEN** a partner in the venue grid has a `logo_image_id`
- **THEN** the grid displays the partner logo using the `medium-640` variant URL

### Requirement: Discover to events navigation

The public Discover experience (locale home `/:locale`) SHALL present marketing content and a curated event preview and SHALL provide a clear path into fuller event browsing: preview EventCard CTAs ("See details" / "Mehr sehen") link to public `/events/:id` without forcing login, and a primary CTA path leads guests to signup or login that lands on member `/events` after auth (and onboarding if incomplete). Guests SHALL NOT receive a public full upcoming-events list equivalent to `/events` in MVP. Product docs (`docs/product/sitemap/sitemap.md`, `ui/app-shell.md`, `ui/static-pages-content.md`) SHALL document these CTAs without dead ends. Phase 5.5 release spot-checks SHALL confirm these CTA hrefs and journeys (or record a named deferral with target phase).

#### Scenario: Discover preview links to public event detail

- **WHEN** a guest follows a Discover preview event CTA ("See details" / "Mehr sehen")
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
