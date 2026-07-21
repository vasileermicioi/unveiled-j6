## ADDED Requirements

### Requirement: Automated coverage for featured Discover and browse gate

The system’s BDD/e2e suite SHALL cover featured-only Discover, non-active Discover access, active-only `/events`, and the Discover vs Browse events nav labels. Playwright SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`. Demo seed SHALL create a small set of `featured_events` rows for upcoming catalog events so Discover is non-empty after `seed:demo`. When the featured upcoming list is empty, Discover SHALL show a clear empty state (DE/EN) that does not imply the full catalog is empty solely because nothing is featured.

#### Scenario: Guest sees featured Discover

- **WHEN** a guest visits Discover with at least one featured upcoming event
- **THEN** that featured event appears
- **AND** a non-featured upcoming catalog event does not appear solely for being soon

#### Scenario: Inactive member is redirected from browse

- **WHEN** a USER without a booking-eligible subscription opens `/events`
- **THEN** they are redirected to Discover

#### Scenario: Active member nav shows Browse events

- **WHEN** an active member views the app shell
- **THEN** the primary nav shows Browse events linking to `/events`

#### Scenario: Empty featured Discover state

- **WHEN** a guest visits Discover and no featured upcoming events exist
- **THEN** the page shows a clear empty state (localized)
- **AND** it does not present the full member `/events` feed

### Requirement: Product docs match featured Discover and browse split

`docs/product/` SHALL document Discover as admin-featured upcoming events only; Discover audience as guests and non-booking-eligible members; `/events` and `/events/map` as booking-eligible USER only (with redirects from step 03); and public `/events/:id` as ungated. Sitemap, static Discover copy, component map, i18n inventory, and gaps-and-decisions SHALL be updated to match shipped behavior (including ADMIN Discover QA access and footer Discover → `/discover` unless product later chooses parity).

#### Scenario: Feature file documents featured and access rules

- **WHEN** a reader opens `docs/product/features/event-discovery.feature`
- **THEN** it includes scenarios for featured-only Discover, non-active Discover access, and active-only member browse

#### Scenario: Sitemap and static docs match redirects

- **WHEN** a reader opens sitemap, app-shell, and static Discover copy docs
- **THEN** they describe the Discover ↔ Browse events split and redirects consistent with the parent guide step 03 table

## MODIFIED Requirements

### Requirement: Guest and member discovery behaviors are specified in Gherkin

`docs/product/features/event-discovery.feature` SHALL specify guest Discover as a curated **featured** upcoming preview (not an automatic catalog slice), public event detail (unauthenticated access to `/:locale/events/:id`), guest path to full browse via signup/login **and** booking-eligible subscription, non-booking-eligible USER Discover access with redirect away from `/events`, booking-eligible USER Browse events → `/events`, and authenticated member feed/filter/saved/map behaviors aligned with `docs/product/sitemap/sitemap.md`. Guests SHALL NOT be specified as having a public full upcoming-events list equivalent to `/events`. Discover-to-browse navigation SHALL be consistent with the sitemap and with `static-pages.feature` / user journeys. Shipped Playwright titles for in-scope guest and featured/browse-gate scenarios SHALL match Gherkin `Scenario:` lines verbatim where the BDD contract requires it.

#### Scenario: Feature file matches public detail

- **WHEN** a reader opens `event-discovery.feature` in `docs/product/features/`
- **THEN** it includes scenarios for unauthenticated event detail access and Discover-to-browse navigation consistent with the sitemap

#### Scenario: Guest preview without public full feed

- **WHEN** a reader reviews guest scenarios in `event-discovery.feature`
- **THEN** guests are specified with Discover curated **featured** preview and public detail, not a public full `/events` feed

#### Scenario: Member feed and saved/map remain gated

- **WHEN** a reader reviews member scenarios in `event-discovery.feature`
- **THEN** member feed, filters, saved list, and map behaviors are specified as authenticated USER flows under `/events`, `/saved`, and `/events/map`
- **AND** non-booking-eligible USER access to `/events` / `/events/map` is specified as redirect to Discover

#### Scenario: Guest Scenario titles are covered in Playwright

- **WHEN** featured-discover step 04 completes
- **THEN** `e2e/specs/event-discovery.spec.ts` (and related specs) includes coverage for public discovery preview, guest public detail, guest path to full browse, featured-only Discover, and browse/nav gate scenarios (or the coverage matrix lists a named deferral with owner)
