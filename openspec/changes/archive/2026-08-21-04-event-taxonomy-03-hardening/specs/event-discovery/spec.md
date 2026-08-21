## MODIFIED Requirements

### Requirement: Filter by category

The member feed and map category filter SHALL use `EVENT_CATEGORIES` keys as option values and locale labels as visible text, in the taxonomy table order. Filtering SHALL match `events.category` to the key. Legacy query values from member `INTERESTS` (`Theater`, `Kino`, `Museum`, `Ausstellung`, `Konzert`, `Talk/Lesung`, `Comedy`, `Tanz/Performance`, `Other`) SHALL be rewritten to the mapped keys from the parent guide so old URLs keep working. Unknown category query values SHALL be left unchanged and SHALL still filter by exact match (matching nothing when no row stores that string). Allowlisted keys in the query SHALL pass through unchanged.

The Browse events category `<select>` SHALL list the event-category taxonomy labels for the active locale and SHALL NOT list member onboarding interests (`Other`, `Talk/Lesung`, …) unless those strings also exist as taxonomy labels (they do not, except coincidental overlaps such as Theater / Kino / Museum). Product Gherkin SHALL keep the scenario titled `Filter by category` and SHALL include `Category filter lists venue types`. Playwright in `e2e/specs/event-discovery.spec.ts` SHALL use those titles verbatim (`test("Scenario: …")`). Playwright SHALL select the category control by locale label (`getByLabel` for Kategorie/Category) and pick a visible option by locale label (e.g. Ausstellungshalle / Exhibition hall, or Kino / Cinema). Playwright SHALL use proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); the system SHALL NOT add `data-testid` for these scenarios. Coverage-matrix rows SHALL map the Gherkin titles to Playwright (`pass` when `DATABASE_URL` is set, or a named env skip — never “UI not built”).

#### Scenario: Filter by category

- **WHEN** I select a category filter
- **THEN** only events matching that category key are shown
- **AND** the visible options are venue-category labels (e.g. Kino / Cinema), not onboarding interest chips

#### Scenario: Category filter lists venue types

- **WHEN** a booking-eligible member opens the Browse events category `<select>`
- **THEN** the options include taxonomy locale labels (e.g. Kino / Cinema, Ausstellungshalle / Exhibition hall)
- **AND** the options do not include onboarding-only interest ids (`Other`, `Talk/Lesung`, `Tanz/Performance`, exact `Ausstellung`, exact `Konzert`)

#### Scenario: Legacy category query still filters

- **WHEN** the feed URL is `?category=Theater`
- **THEN** the parsed filter is `theater`
- **AND** events stored as `theater` are shown

#### Scenario: Legacy Kino query maps to cinema

- **WHEN** the feed or map URL is `?category=Kino`
- **THEN** the parsed filter is `cinema`
- **AND** events stored as `cinema` are shown

#### Scenario: Unknown category query matches nothing

- **WHEN** the feed URL is `?category=NotARealCategory`
- **THEN** the parsed filter is `NotARealCategory`
- **AND** no events are shown unless a row stores that exact string

#### Scenario: Category options use keys and locale labels in table order

- **WHEN** a booking-eligible member opens the feed or map filter
- **THEN** each category option value is an `EVENT_CATEGORIES` key
- **AND** the visible option text is that key’s label for the active locale
- **AND** option order matches the parent taxonomy table (not alphabetical, not onboarding `INTERESTS` order)
