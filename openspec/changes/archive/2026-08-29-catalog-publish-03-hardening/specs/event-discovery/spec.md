## ADDED Requirements

### Requirement: Canonical discovery Gherkin hides unpublished catalog and featured
`docs/product/features/event-discovery.feature` SHALL add the titles below (do not invent parallel titles for the same behavior). Existing Discover/Browse scenarios that already assume seeded published rows SHALL keep their titles; their fixtures SHALL publish catalog events and featured rows when asserting Discover. Playwright `e2e/specs/event-discovery.spec.ts` SHALL map 1:1. Public unpublished detail SHALL render the same not-found page as a missing id (HTTP 404). Selectors SHALL be proximity/layout only. Europe/Berlin for displayed dates. The system SHALL NOT add `@skip-no-ui` for these MVP scenarios.

#### Scenario: Unpublished featured event stays off Discover
- **WHEN** a featured event row is unpublished (or the catalog event is unpublished)
- **THEN** a guest on `/:locale/discover` does not see that event

#### Scenario: Unpublished featured partner stays off Discover
- **WHEN** a featured partner row is unpublished
- **THEN** a guest on `/:locale/discover` does not see that partner in Partner venues

#### Scenario: Unpublished events are hidden from Browse events
- **WHEN** a booking-eligible member views `/events` or `/events/map`
- **THEN** unpublished events do not appear

#### Scenario: Published featured event with unpublished catalog stays off Discover
- **WHEN** a featured event row is published and the catalog event is unpublished
- **THEN** a guest on `/:locale/discover` does not see that event

#### Scenario: Unpublished event public detail is not found
- **WHEN** a guest opens `/:locale/events/:id` for an unpublished event
- **THEN** the response is the same not-found page as a missing event
- **AND** the unpublished title is not shown in public metadata

#### Scenario: Saved list hides unpublished events
- **WHEN** a member has a save row for an event that is now unpublished
- **THEN** `/saved` omits that event
- **AND** the `saved_events` row remains
