## ADDED Requirements

### Requirement: Event subtitles metadata

Events SHALL support `has_subtitles` (boolean, **not nullable**, default `false`) and nullable `subtitle_language` (single allowlisted code from `EVENT_LANGUAGES`, or null). Catalog create/update SHALL require a valid allowlisted `subtitle_language` when `has_subtitles` is true, and SHALL persist `subtitle_language = null` when `has_subtitles` is false (coercing any submitted language away). Subtitle fields SHALL be independent of spoken `languages` / `language_independent` — any combination is valid. `cloneEvent` SHALL copy `has_subtitles` and `subtitle_language` from the source event. The product schema overview SHALL document both columns.

#### Scenario: Create with subtitles requires allowlisted language

- **WHEN** `createEvent` is called with `hasSubtitles = true` and a missing or non-allowlisted `subtitleLanguage`
- **THEN** the create is rejected with a validation error

#### Scenario: Create without subtitles clears language

- **WHEN** `createEvent` is called with `hasSubtitles = false` and a non-null `subtitleLanguage`
- **THEN** the persisted event has `has_subtitles = false` and `subtitle_language = null`

#### Scenario: Subtitles independent of language-independent

- **WHEN** `createEvent` succeeds with `languageIndependent = true`, `hasSubtitles = true`, and an allowlisted `subtitleLanguage`
- **THEN** the event is persisted with `languages = null`, `has_subtitles = true`, and the given `subtitle_language`

#### Scenario: Clone copies subtitle metadata

- **WHEN** `cloneEvent` is called for a source event with `has_subtitles = true` and a subtitle language
- **THEN** the cloned event has the same `has_subtitles` and `subtitle_language` values
