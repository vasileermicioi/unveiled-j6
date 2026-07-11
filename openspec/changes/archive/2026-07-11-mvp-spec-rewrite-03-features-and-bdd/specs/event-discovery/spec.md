## ADDED Requirements

### Requirement: Guest and member discovery behaviors are specified in Gherkin

`docs/product/features/event-discovery.feature` SHALL specify guest Discover preview, public event detail (unauthenticated access to `/:locale/events/:id`), and authenticated member feed/filter/saved/map behaviors aligned with `docs/product/sitemap/sitemap.md`. Guests SHALL NOT be specified as having a public full upcoming-events list equivalent to `/events`. Discover-to-browse navigation (auth CTA → member `/events`) SHALL be consistent with the sitemap and with `static-pages.feature` / user journeys.

#### Scenario: Feature file matches public detail

- **WHEN** a reader opens `event-discovery.feature` in `docs/product/features/`
- **THEN** it includes scenarios for unauthenticated event detail access and Discover-to-browse navigation consistent with the sitemap

#### Scenario: Guest preview without public full feed

- **WHEN** a reader reviews guest scenarios in `event-discovery.feature`
- **THEN** guests are specified with Discover curated preview and public detail, not a public full `/events` feed

#### Scenario: Member feed and saved/map remain gated

- **WHEN** a reader reviews member scenarios in `event-discovery.feature`
- **THEN** member feed, filters, saved list, and map behaviors are specified as authenticated USER flows under `/events`, `/saved`, and `/events/map`
