## MODIFIED Requirements

### Requirement: Discover to events navigation
The public Discover experience (locale home `/:locale`) SHALL present marketing content and a curated event preview and SHALL provide a clear path into fuller event browsing: preview EventCard CTAs ("See details" / "Mehr sehen") link to public `/events/:id` without forcing login, and a primary CTA path leads guests to signup or login that lands on member `/events` after auth (and onboarding if incomplete). Guests SHALL NOT receive a public full upcoming-events list equivalent to `/events` in MVP. Product docs (`docs/product/sitemap/sitemap.md`, `ui/app-shell.md`, `ui/static-pages-content.md`) SHALL document these CTAs without dead ends.

#### Scenario: Discover preview links to public event detail
- **WHEN** a guest follows a Discover preview event CTA ("See details" / "Mehr sehen")
- **THEN** they land on public `/events/:id` without being forced to log in

#### Scenario: Discover CTA path to the full member events feed
- **WHEN** a guest follows the primary browse-all-events CTA path to signup or login
- **THEN** they are taken to signup or login and after auth (and onboarding if incomplete) land on `/events`, never receiving a public full feed equivalent

#### Scenario: Guest has no public full feed
- **WHEN** a guest is not signed in
- **THEN** product docs and Discover CTAs do not offer an ungated `/events` browse list; the full feed remains member-gated

### Requirement: Automated browser coverage for static pages
Each Gherkin scenario in `docs/product/features/static-pages.feature` SHALL have a Playwright test in `e2e/specs/static-pages.spec.ts` whose title matches the scenario line (including the `Scenario:` prefix). Tests SHALL use proximity-only selectors and default locale `de` unless the scenario requires bilingual coverage. Coverage SHALL include Discover preview→public detail and Discover CTA→auth→member `/events` in addition to home, how-it-works, FAQ, legacy `/discover`, bilingual, legal, and cookie scenarios. The declining-consent map scenario SHALL assert against a real map surface (consent fallback shown, no OpenStreetMap tile requests) on a public event detail page that mounts `EventMap`.

#### Scenario: Marketing and legal flows are E2E-verified
- **WHEN** `bun run test:e2e` executes `e2e/specs/static-pages.spec.ts`
- **THEN** discover home, Discover preview→detail, Discover CTA→auth→`/events`, how-it-works, FAQ, legacy `/discover` redirect, bilingual toggle, legal footer links, and cookie consent behaviors are asserted in a real browser (or listed as named deferrals in the coverage matrix)

#### Scenario: Cookie first-visit isolation
- **WHEN** a static-pages cookie scenario requires a first visit
- **THEN** the test clears the `unveiled:cookie-consent` decision before asserting the banner

#### Scenario: Declining consent disables map embed
- **WHEN** the user has declined non-essential cookies and views a public event detail page with coordinates
- **THEN** the map embed is not loaded, a static fallback (including an external OpenStreetMap link) is shown, and no OpenStreetMap tile requests are made
