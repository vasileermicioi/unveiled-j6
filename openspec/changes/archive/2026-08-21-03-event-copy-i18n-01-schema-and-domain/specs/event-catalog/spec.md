## ADDED Requirements

### Requirement: Event title and description have DE and EN fields

Events SHALL store `title_de`, `title_en`, `description_de`, and `description_en` (non-null text). Catalog create/update SHALL require non-empty trimmed titles and non-empty descriptions for **both** locales. Canonical `title` and `description` SHALL be denormalized on write from the German fields (`title_de` / `description_de`). A migration SHALL copy each existing `title` into both `title_de` and `title_en`, and each existing `description` into both description locale columns. `cloneEvent` SHALL copy all four locale columns plus canonical `title` / `description`. Title substring search (admin `title=`, member feed `title=`, and other catalog title ILIKE filters) SHALL match `title_de` or `title_en` (case-insensitive). `@unveiled/db` SHALL export `resolveEventCopy` that returns title and description for a requested locale, falling back to the other locale, then to canonical `title` / `description`. Until the admin form posts locale field names, catalog create/update MAY copy a single posted `title` / `description` into both locales.

#### Scenario: Backfill copies the existing title into both locales

- **WHEN** the migration runs for an event titled "Jazz Night"
- **THEN** `title_de` and `title_en` are both "Jazz Night"
- **AND** canonical `title` remains "Jazz Night"

#### Scenario: Backfill copies the existing description into both locales

- **WHEN** the migration runs for an event whose `description` is "Live set"
- **THEN** `description_de` and `description_en` are both "Live set"
- **AND** canonical `description` remains "Live set"

#### Scenario: Create requires both locales

- **WHEN** `createEvent` is called with only `titleDe` and an empty `titleEn`
- **THEN** the call is rejected

#### Scenario: Create requires both descriptions

- **WHEN** `createEvent` is called with a non-empty `descriptionDe` and an empty `descriptionEn`
- **THEN** the call is rejected

#### Scenario: Canonical title is German

- **WHEN** `createEvent` succeeds with `titleDe = "Konzert"` and `titleEn = "Concert"`
- **THEN** persisted `title` is "Konzert"

#### Scenario: Canonical description is German

- **WHEN** `createEvent` succeeds with `descriptionDe = "Auf Deutsch"` and `descriptionEn = "In English"`
- **THEN** persisted `description` is "Auf Deutsch"

#### Scenario: Legacy single title is copied into both locales

- **WHEN** `createEvent` is called with `title = "Jazz Night"` and `description = "Live set"` and without locale fields
- **THEN** `title_de` and `title_en` are both "Jazz Night"
- **AND** `description_de` and `description_en` are both "Live set"
- **AND** canonical `title` is "Jazz Night"

#### Scenario: Title search matches either locale

- **WHEN** an admin or member title filter is `Concert`
- **THEN** an event whose `title_en` contains "Concert" is included even if `title_de` does not

#### Scenario: Clone copies locale columns

- **WHEN** `cloneEvent` is called for a source with `title_de = "Konzert"` and `title_en = "Concert"`
- **THEN** the cloned event has the same `title_de`, `title_en`, `description_de`, `description_en`, and canonical `title` / `description`

#### Scenario: Resolve prefers the requested locale

- **WHEN** `resolveEventCopy` is called with locale `en` for an event with `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the resolved title is "Concert"

#### Scenario: Resolve falls back to the other locale then canonical

- **WHEN** `resolveEventCopy` is called with locale `en` for an event whose `title_en` is empty and `title_de` is "Konzert"
- **THEN** the resolved title is "Konzert"
- **AND** when both locale titles are empty the resolved title is canonical `title`

## MODIFIED Requirements

### Requirement: Admin event list discovery aids

The admin events list at `/:locale/admin/events` SHALL support GET filters and pagination (`?title=&partner=&language=&page=`, page size 25) per `docs/product/extras/pagination-and-search.md`. Title SHALL be a case-insensitive substring filter matching `title_de` **or** `title_en`. Partner SHALL be a case-insensitive substring filter on denormalized partner name. Language (`language`, ISO 639-1 alpha-2) SHALL match events whose spoken `languages` array contains the code **or** whose `subtitle_languages` array contains the code (case-insensitive). Default list order SHALL be `created_at` descending, then `id` descending (URL omits `sort`/`dir` for that default). The list SHALL offer server-driven sorting by Title, Partner, Date, Created, and Capacity via **clickable table column headers** (not search-bar controls), using query params `sort` (`title` | `partner` | `date` | `created` | `capacity`) and `dir` (`asc` | `desc`). Title column sort SHALL use canonical `title` (German denormalized copy). Filter submit SHALL preserve active sort via hidden fields; column sort SHALL preserve `title`/`partner`/`language`. A **Reset filters** control SHALL clear filters and sort params. The list SHALL display a `small-320` thumbnail for each event's image when present, plus title, partner, languages (or language-independent label), subtitle language (or em dash when none), date/time (Europe/Berlin), created timestamp, capacity, and row actions for edit, delete, codes export, and clone. The list SHALL NOT include a series create CTA.

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

#### Scenario: Title filter matches either locale

- **WHEN** an ADMIN lists events with `title=Concert`
- **THEN** events whose `title_en` contains "Concert" are included even if `title_de` does not
