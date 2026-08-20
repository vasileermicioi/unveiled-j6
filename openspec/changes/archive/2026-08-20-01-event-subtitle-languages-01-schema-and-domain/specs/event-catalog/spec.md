## MODIFIED Requirements

### Requirement: Event subtitles metadata
Events SHALL support `has_subtitles` (boolean, not nullable, default `false`) and nullable `subtitle_languages` (`text[]` of unique uppercase ISO 639-1 alpha-2 codes). Catalog create/update SHALL require a non-empty valid ISO 639-1 list when `has_subtitles` is true, and SHALL persist `subtitle_languages = null` when `has_subtitles` is false (coercing any submitted codes away). Duplicate codes SHALL be collapsed case-insensitively, preserving first-seen order. Subtitle languages are **not** limited to spoken-event `EVENT_LANGUAGES`. Subtitle fields SHALL remain independent of spoken `languages` / `language_independent`. `cloneEvent` SHALL copy `has_subtitles` and `subtitle_languages`. A migration SHALL copy each existing non-null `subtitle_language` into a one-element `subtitle_languages` array before dropping `subtitle_language`. The product schema overview SHALL document `has_subtitles` and `subtitle_languages`.

#### Scenario: Create with subtitles requires allowlisted language
- **WHEN** `createEvent` is called with `hasSubtitles = true` and a missing, empty, or non-allowlisted `subtitleLanguages` list
- **THEN** the call is rejected with `INVALID_SUBTITLE_LANGUAGE`

#### Scenario: Create without subtitles clears language
- **WHEN** `createEvent` is called with `hasSubtitles = false` and a non-null `subtitleLanguages` list
- **THEN** the persisted event has `has_subtitles = false` and `subtitle_languages = null`

#### Scenario: Duplicate codes are unique-cased
- **WHEN** `createEvent` is called with `hasSubtitles = true` and `subtitleLanguages = ["en", "DE", "EN"]`
- **THEN** the persisted `subtitle_languages` is `{EN,DE}`

#### Scenario: Existing single language becomes a one-element list
- **WHEN** the migration runs for a row with `has_subtitles = true` and `subtitle_language = 'EN'`
- **THEN** the row has `subtitle_languages = {EN}`

#### Scenario: Language filter matches any subtitle code
- **WHEN** an admin list `language=EN` filter is applied
- **THEN** events whose spoken `languages` contain `EN` **or** whose `subtitle_languages` contain `EN` (case-insensitive) are included

#### Scenario: Subtitles independent of language-independent
- **WHEN** `createEvent` succeeds with `languageIndependent = true`, `hasSubtitles = true`, and a valid `subtitleLanguages` list
- **THEN** the event is persisted with `languages = null`, `has_subtitles = true`, and the given `subtitle_languages`

#### Scenario: Clone copies subtitle metadata
- **WHEN** `cloneEvent` is called for a source event with `has_subtitles = true` and `subtitle_languages = {DE,EN}`
- **THEN** the cloned event has the same `has_subtitles` and `subtitle_languages` values

### Requirement: Admin event list discovery aids

The admin events list at `/:locale/admin/events` SHALL support GET filters and pagination (`?title=&partner=&language=&page=`, page size 25) per `docs/product/extras/pagination-and-search.md`. Title and partner SHALL be case-insensitive substring filters on event title and denormalized partner name. Language (`language`, ISO 639-1 alpha-2) SHALL match events whose spoken `languages` array contains the code **or** whose `subtitle_languages` array contains the code (case-insensitive). Default list order SHALL be `created_at` descending, then `id` descending (URL omits `sort`/`dir` for that default). The list SHALL offer server-driven sorting by Title, Partner, Date, Created, and Capacity via **clickable table column headers** (not search-bar controls), using query params `sort` (`title` | `partner` | `date` | `created` | `capacity`) and `dir` (`asc` | `desc`). Filter submit SHALL preserve active sort via hidden fields; column sort SHALL preserve `title`/`partner`/`language`. A **Reset filters** control SHALL clear filters and sort params. The list SHALL display a `small-320` thumbnail for each event's image when present, plus title, partner, languages (or language-independent label), subtitle language (or em dash when none), date/time (Europe/Berlin), created timestamp, capacity, and row actions for edit, delete, codes export, and clone. The list SHALL NOT include a series create CTA.

#### Scenario: Paginated admin event list

- **WHEN** an ADMIN opens `/admin/events?page=1`
- **THEN** events are listed with SSR-rendered pagination controls and a server-side total count

#### Scenario: Admin event list search

- **WHEN** an ADMIN opens `/admin/events?q=berghain`
- **THEN** only events whose title or denormalized partner name matches the query (case-insensitive) are listed and pagination totals reflect the filtered count

#### Scenario: Admin event list newest first

- **WHEN** an ADMIN opens `/admin/events` without filters
- **THEN** events appear with the most recently created row first

#### Scenario: Sort by title ascending

- **WHEN** an ADMIN clicks the Title column header on the event list
- **THEN** the list orders by title ascending (or toggles direction if Title is already active)

#### Scenario: Search preserves sort

- **WHEN** an ADMIN has a non-default sort and submits a title/partner search
- **THEN** the resulting URL retains `sort` and `dir` together with `q`

#### Scenario: Reset filters clears search and sort

- **WHEN** an ADMIN follows Reset filters with an active query and/or non-default sort
- **THEN** the list returns to `/admin/events` with default last-created ordering and no search query

#### Scenario: Event list page clamp

- **WHEN** an ADMIN opens `/admin/events?page=99` and fewer than 99 pages of results exist
- **THEN** the server redirects to the last valid page or equivalent clamp so the table is not empty solely due to an out-of-range page number

#### Scenario: Event list shows image thumbnail

- **WHEN** an ADMIN views `/admin/events` and an event has an image
- **THEN** the list displays a thumbnail using the `small-320` variant URL

#### Scenario: List offers clone action

- **WHEN** an ADMIN views the events list with at least one event
- **THEN** each row includes a Clone action to `/:locale/admin/events/:id/clone`

#### Scenario: Language filter matches any subtitle code

- **WHEN** an ADMIN lists events with `language=EN`
- **THEN** events whose spoken `languages` contain `EN` **or** whose `subtitle_languages` contain `EN` (case-insensitive) are included
