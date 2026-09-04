## MODIFIED Requirements

### Requirement: Guest marketing home renders v3 content with live teasers

The system SHALL render the membership conversion landing on `/:locale` from one `LandingPageV3` composition (hero + 29 € offer card, live rail of up to 3 upcoming teasers, credits, flexibility/partners, community, final CTA) sourced from the v3 content model, with the events rail sourced from the first 3 upcoming published events via a guest-safe teaser (title, description, date/time labels, place, image only — no credit prices, capacity, redemption, or event-detail URLs) and a static fallback when no upcoming events exist. `/:locale/regular` and bare `/regular` SHALL NOT exist (route files deleted; both return 404). Rail cards SHALL NOT link to `/events/:id`; the only clickable elements on rail cards SHALL be action buttons to registration (`/:locale/signup`). Rail cards SHALL NOT display credit prices or other guest-hidden details.

#### Scenario: Landing rail uses live upcoming teasers without guest-hidden details

- **WHEN** a guest opens `/:locale` with 3+ upcoming published events
- **THEN** the rail shows the 3 soonest teasers with no credit labels and no links to `/events/:id`

#### Scenario: Teaser list is limited and soonest-first

- **WHEN** more than 3 upcoming published events exist
- **THEN** only the first 3 ordered by ascending `date_time` are exposed to the landing rail

#### Scenario: Guest-safe teaser exposes no restricted fields

- **WHEN** a landing teaser is built from a catalog event row
- **THEN** it contains only id, title, description, dateLabel, time, place, and image — without credit price, capacity, redemption, or event-detail URL data

#### Scenario: Static fallback when no upcoming events exist

- **WHEN** a guest opens `/:locale` with zero upcoming published events or an unreachable catalog query
- **THEN** the rail renders the static fallback items (existing rail copy minus credits) instead of failing the build or rendering an empty rail

#### Scenario: V3 content is available in both locales

- **WHEN** the `landing-v3` content model is loaded for `de` or `en`
- **THEN** all v3 sections (hero + 29 € offer, events rail copy, credits, flexibility/partners, community, final CTA) are present with locale-matched copy ported from the mock

#### Scenario: Guest rail cards lead only to registration

- **WHEN** a guest opens `/:locale` and activates any rail-card action
- **THEN** they land on `/:locale/signup`, never on `/events/:id`

#### Scenario: /regular is gone

- **WHEN** anyone opens `/:locale/regular` or `/regular`
- **THEN** the response is 404

#### Scenario: Landing page SEO

- **WHEN** a crawler requests `/de`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

## ADDED Requirements

### Requirement: Legacy discover redirects

Legacy discover paths SHALL keep redirecting to the locale home (which now renders the v3 landing) so sitemap legacy paths do not 404. The `/:locale/discover` and bare `/discover` routes themselves are unchanged.

#### Scenario: Legacy discover path redirects home

- **WHEN** a guest visits `/de/discover`
- **THEN** they receive a **301** redirect to `/de`

#### Scenario: Bare discover path redirects to locale home

- **WHEN** a visitor requests `/discover` without a locale segment
- **THEN** they receive a **301** to `/:locale` (locale from `Accept-Language`, fallback `de`)

### Requirement: Landing CTA path to the member events feed

The v3 landing SHALL send guests to registration and SHALL NOT offer a public full upcoming-events list equivalent to `/events`. A primary CTA path leads guests to signup or login that lands on member `/events` after auth (and onboarding if incomplete). Product docs (`docs/product/sitemap/sitemap.md`, `ui/app-shell.md`, `ui/static-pages-content.md`) SHALL document these CTAs without dead ends (doc updates may land in hardening). Phase 5.5 release spot-checks SHALL confirm these CTA hrefs and journeys (or record a named deferral with target phase).

#### Scenario: Landing CTA path to the full member events feed

- **WHEN** a guest follows the primary browse-all-events CTA path to signup or login
- **THEN** they are taken to signup or login and after auth (and onboarding if incomplete) land on `/events`, never receiving a public full feed equivalent

#### Scenario: Guest has no public full feed

- **WHEN** a guest is not signed in
- **THEN** product docs and landing CTAs do not offer an ungated `/events` browse list; the full feed remains member-gated

#### Scenario: Guest journey matches sitemap

- **WHEN** a guest follows landing rail CTAs and auth CTAs during Phase 5.5 release verification
- **THEN** rail CTAs open `/:locale/signup` and the full-browse path goes through signup/login toward member `/events` without exposing a public full feed

## REMOVED Requirements

### Requirement: Discover marketing preview page

**Reason**: The locale home no longer renders the Discover marketing preview (hero stats, value cards, 6-event preview grid with detail links); it renders the single v3 conversion landing. The preview-grid, empty-state, and sold-out scenarios are obsolete.

**Migration**: Home rendering moves to `Requirement: Guest marketing home renders v3 content with live teasers` (including its SEO scenario); the legacy `/discover` redirect scenarios move to `Requirement: Legacy discover redirects`.

### Requirement: Discover to events navigation

**Reason**: Locale-home preview CTAs no longer link to public `/events/:id`; the v3 rail is signup-only, so the preview-to-detail navigation contract is obsolete for the landing.

**Migration**: Registration and member-feed gating move to `Requirement: Landing CTA path to the member events feed` and the signup-only scenario in `Requirement: Guest marketing home renders v3 content with live teasers`.

### Requirement: Separate founding/deposit locale home, static-credit regular variant, and /regular routes

**Reason**: Replaced by the single v3 membership conversion landing on `/:locale`; the founding-deposit offer block, static 5-item credit-tagged teaser lists, both `/regular` route files, the `regular` PageKey, and the legacy landing components are git-deleted with no archive.

**Migration**: Guests use `/:locale` (v3 hero + 29 € offer + signup-only rail). Any bookmark or link to `/:locale/regular` or `/regular` now returns 404; no redirect is provided (hard delete per parent guide). Legacy `/:locale/discover` 301 redirects are unaffected.
