## ADDED Requirements

### Requirement: Discovery feature documents checkout dropdown
`docs/product/features/event-discovery.feature` SHALL include a booking-eligible checkout dropdown scenario and SHALL keep guest omit-credits behavior. Compact cards SHALL continue to show next upcoming datetime and denormalized `credit_price` (no price range). Playwright in `e2e/specs/event-discovery.spec.ts` SHALL include tests titled exactly `Scenario: Dropdown changes credits` and `Scenario: Guest checkout omits slot picker`. The checkout datetime control SHALL be a native `<select>` asserted with `getByLabel` (`Datum und Uhrzeit` / `Date and time`). Guests SHALL NOT see the dropdown or credit totals. `docs/product/ui/ui-component-map.md` Event detail entry SHALL mention the eligible-member datetime select. DETAILS MAY continue to list all datetimes in a separate scenario.

#### Scenario: Coverage traces checkout dropdown
- **WHEN** the coverage matrix is updated for this feature
- **THEN** it includes a row for the dropdown changing displayed credits (pass or explicit environment skip)
- **AND** it includes a row for guest checkout omitting the slot picker
- **AND** neither row uses `@skip-no-ui`

#### Scenario: Dropdown changes credits
- **GIVEN** an upcoming event with a morning slot priced 1 and an evening slot priced 4
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open `/events/:id` and choose the evening datetime
- **THEN** the checkout total uses 4 credits per ticket

#### Scenario: Guest checkout omits slot picker
- **WHEN** a guest opens the same event
- **THEN** the checkout card does not show a datetime dropdown or credit totals

## MODIFIED Requirements

### Requirement: Guest and member discovery behaviors are specified in Gherkin

`docs/product/features/event-discovery.feature` SHALL specify guest Discover as a curated **featured** upcoming preview (not an automatic catalog slice), public event detail (unauthenticated access to `/:locale/events/:id`), guest path to full browse via signup/login **and** booking-eligible subscription, non-booking-eligible USER Discover access with redirect away from `/events`, booking-eligible USER Browse events → `/events`, and authenticated member feed/filter/saved/map behaviors aligned with `docs/product/sitemap/sitemap.md`. Guests SHALL NOT be specified as having a public full upcoming-events list equivalent to `/events`. Discover-to-browse navigation SHALL be consistent with the sitemap and with `static-pages.feature` / user journeys. Shipped Playwright titles for in-scope guest and featured/browse-gate scenarios SHALL match Gherkin `Scenario:` lines verbatim where the BDD contract requires it. The feature file SHALL also specify the booking-eligible checkout datetime dropdown (two or more future occurrences) and that guests omit that dropdown and credit totals. Compact EventCard / map popup scenarios SHALL keep next upcoming datetime + denormalized `credit_price`.

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

#### Scenario: Feature file documents checkout dropdown
- **WHEN** a reader opens `event-discovery.feature`
- **THEN** it includes `Dropdown changes credits` and `Guest checkout omits slot picker`
- **AND** card/map scenarios still specify next upcoming datetime rather than a credit price range
