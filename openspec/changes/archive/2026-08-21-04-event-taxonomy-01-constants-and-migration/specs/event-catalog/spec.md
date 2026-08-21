## ADDED Requirements

### Requirement: Event category and type are allowlisted keys

`events.category` and `events.event_type` SHALL be locale-invariant keys from the product taxonomy (`EVENT_CATEGORIES` and `EVENT_TYPES` in `.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`). Catalog create and update SHALL reject unknown keys (`INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE`). A migration SHALL map legacy member-interest category strings and the previous event-type strings (and known fixture spellings `Music`, `music`, `Art`, `Film`, `Talk`) to the new keys and SHALL fail if any other distinct value remains. Member onboarding `INTERESTS` SHALL NOT change. Admin category and event-type option lists SHALL emit the new keys (and locale labels) so create/update forms remain submittable.

#### Scenario: Create rejects an unknown category

- **WHEN** `createEvent` is called with `category = "Music"`
- **THEN** the call is rejected with `INVALID_EVENT_CATEGORY`

#### Scenario: Create rejects an unknown event type

- **WHEN** `createEvent` is called with `eventType = "Performance"`
- **THEN** the call is rejected with `INVALID_EVENT_TYPE`

#### Scenario: Create accepts an allowlisted pair

- **WHEN** `createEvent` is called with `category = "theater"` and `eventType = "theater_play"`
- **THEN** the event is persisted with those keys

#### Scenario: Legacy Theater category becomes theater

- **WHEN** the migration runs for a row with `category = "Theater"` and `event_type = "Performance"`
- **THEN** the row has `category = "theater"` and `event_type = "theater_play"`

#### Scenario: Fixture spellings are remapped

- **WHEN** the migration runs for rows with `category` in `Music`, `music`, `Art`, `Film`, `Talk`
- **THEN** those rows have `category` `live_music_venue`, `live_music_venue`, `kunsthalle`, `cinema`, `literature_house` respectively

#### Scenario: Unmapped values fail the migration

- **WHEN** the migration runs and a distinct `category` or `event_type` is neither an allowlisted key nor a mapped legacy value
- **THEN** the migration fails rather than leaving the illegal string stored

#### Scenario: Onboarding interests are unchanged

- **WHEN** a member opens onboarding interests
- **THEN** the allowlist is still the existing `INTERESTS` values including `Other`
