## ADDED Requirements

### Requirement: Docs and e2e cover locale event copy

`docs/product/features/event-discovery.feature` SHALL include scenarios titled `Guest sees English title on /en` and `Guest sees German title on /de`. Playwright in `e2e/specs/event-discovery.spec.ts` SHALL use those titles verbatim (`test("Scenario: …")`). Those scenarios SHALL assert the public identity heading shows the English title on `/en/events/:id` and the German title on `/de/events/:id` for the same event with distinct `title_en` and `title_de`. Playwright SHALL use proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); the system SHALL NOT add `data-testid` for these scenarios.

`docs/product/extras/seo-and-metadata.md` SHALL state that event document `<title>`, meta description, and JSON-LD `name` / `description` follow the page locale (resolved copy for that URL). `docs/product/ui/ui-component-map.md` SHALL state that Event detail identity title + Markdown description and EventCard title are locale-resolved for `/:locale`. `docs/product/database/schema-overview.md` SHALL document `title_de` / `title_en` / `description_de` / `description_en` plus canonical DE sync and title-search OR. Coverage-matrix rows SHALL map the new Gherkin titles to Playwright (`pass` when `DATABASE_URL` is set, or a named env skip — never “UI not built”).

Seed/demo data SHALL include at least one upcoming event whose German and English titles are **distinct non-empty** strings so these scenarios can assert locale without colliding with `DEMO_DISCOVERY_TITLES.tonight` (and other identical-string demo titles that existing tests still look up on both locales).

#### Scenario: Guest sees English title on /en

- **WHEN** I open `/en/events/:id` as a guest
- **THEN** I see the event's English title

#### Scenario: Guest sees German title on /de

- **WHEN** I open `/de/events/:id` as a guest
- **THEN** I see the event's German title

#### Scenario: SEO docs state locale-resolved event meta

- **WHEN** a reader opens `docs/product/extras/seo-and-metadata.md`
- **THEN** event `<title>` and meta description are specified as following the page locale

#### Scenario: Schema overview documents four locale columns

- **WHEN** a reader opens `docs/product/database/schema-overview.md`
- **THEN** `title_de` / `title_en` / `description_de` / `description_en` are documented as required text
- **AND** canonical `title` / `description` are documented as DE write-time copies
- **AND** title search is documented as matching either locale column

### Requirement: Feed title filter matches either locale

Product Gherkin MAY include a scenario that a booking-eligible member on `/de/events` filtering `title=` by a substring unique to `title_en` still sees that event. If included, Playwright SHALL use the Gherkin title verbatim. Domain title ILIKE already ORs both locale columns (step 01); this requirement is documentation and e2e only.

#### Scenario: Filter by English title on /de

- **WHEN** a booking-eligible member on `/de/events` applies an event-name filter that matches only `title_en`
- **THEN** the event is included in the feed
- **AND** the EventCard title shown is the German title
