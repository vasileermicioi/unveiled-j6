## ADDED Requirements

### Requirement: Canonical admin-events Gherkin records publish and draft
`docs/product/features/admin-events.feature` SHALL include the publish/unpublish confirm, Published/Draft chip, optional `published=` filter, create-as-draft, and unpublish-keeps-featured scenarios with the titles below. Playwright `e2e/specs/admin-events.spec.ts` SHALL map 1:1 (`test("Scenario: <exact title>")`). Existing titles SHALL keep their names; their steps MAY be updated so create stays draft on the admin list and featured-add does not claim Discover is live. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim. Selectors SHALL be proximity/layout only. Env skips (`E2E_ADMIN_*`, R2, `DATABASE_URL`) MAY remain as named `test.skip` reasons. The system SHALL NOT add `@skip-no-ui` for these MVP scenarios.

#### Scenario: Publish confirm goes live on Browse
- **WHEN** an admin confirms publish for a draft event
- **THEN** the Events catalog shows Published / Veröffentlicht
- **AND** a booking-eligible member sees that event on `/events`

#### Scenario: Unpublish confirm hides from Browse
- **WHEN** an admin confirms unpublish for a published event
- **THEN** the Events catalog still lists the event as Draft / Entwurf
- **AND** that event does not appear on member `/events`

#### Scenario: Create does not appear on Browse
- **WHEN** an admin creates an event and does not publish it
- **THEN** the event is on `/admin/events` as Draft
- **AND** it does not appear on member `/events`

#### Scenario: Event list shows Published or Draft status
- **WHEN** an admin opens `/admin/events` with both a draft and a published event
- **THEN** each row shows Published / Veröffentlicht or Draft / Entwurf

#### Scenario: Event list filters by published
- **WHEN** an admin opens `/admin/events?published=no`
- **THEN** only unpublished events are listed
- **AND** sort, title, partner, and language params are preserved when changing the filter

#### Scenario: Unpublish does not delete or drop featured membership
- **WHEN** an admin unpublishes a catalog event that has a featured row
- **THEN** the event remains on `/admin/events`
- **AND** the featured row remains on `/admin/featured`
- **AND** Discover omits the event until both flags are true

### Requirement: Featured-add Gherkin does not imply Discover is live
`docs/product/features/admin-events.feature` Scenario **Add by searching existing events** SHALL state that submitting add creates an unpublished featured row and points the admin at the featured publish confirm (not a silent “now on Discover” list redirect). Scenario **Admin remove from featured keeps catalog event** SHALL still assert Discover no longer lists the event after remove. Playwright SHALL keep those existing titles; only the steps and assertions change.

#### Scenario: Add by searching existing events
- **WHEN** an admin adds a catalog event to featured
- **THEN** a featured row exists as Draft
- **AND** Discover does not list that event until the featured row is published and the catalog event is published
