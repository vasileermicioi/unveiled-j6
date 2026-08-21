## ADDED Requirements

### Requirement: Admin authors Markdown description
Admin create/edit SHALL present **two** Markdown description editors and **two** title fields, one per locale (`de`, `en`), stacked German then English on the General step (no nested locale tablist). Submitting SHALL persist `description_de` / `description_en` / `title_de` / `title_en`. Canonical `title` / `description` remain DE-derived on write. Empty or whitespace-only values for either locale SHALL be rejected. Both description editors SHALL submit hidden native Markdown fields; the Markdown/MDX pipeline SHALL NOT change.

#### Scenario: Admin authors both locale titles
- **WHEN** I create an event with title DE "Konzert" and title EN "Concert" plus both descriptions
- **THEN** the event is saved with those locale fields
- **AND** canonical `title` is "Konzert"

#### Scenario: Admin authors both locale descriptions
- **WHEN** I create an event with a German Markdown description and a distinct English Markdown description
- **THEN** both `description_de` and `description_en` are persisted
- **AND** canonical `description` equals the German Markdown

#### Scenario: Missing English title is rejected
- **WHEN** I submit create or edit with a German title and an empty English title
- **THEN** the event is not saved
- **AND** the form re-renders on General with a title-required error for the English field

## MODIFIED Requirements

### Requirement: Event title and description have DE and EN fields

Events SHALL store `title_de`, `title_en`, `description_de`, and `description_en` (non-null text). Catalog create/update SHALL require non-empty trimmed titles and non-empty descriptions for **both** locales. Canonical `title` and `description` SHALL be denormalized on write from the German fields (`title_de` / `description_de`). A migration SHALL copy each existing `title` into both `title_de` and `title_en`, and each existing `description` into both description locale columns. `cloneEvent` SHALL copy all four locale columns plus canonical `title` / `description`. Title substring search (admin `title=`, member feed `title=`, and other catalog title ILIKE filters) SHALL match `title_de` or `title_en` (case-insensitive). `@unveiled/db` SHALL export `resolveEventCopy` that returns title and description for a requested locale, falling back to the other locale, then to canonical `title` / `description`. Admin create/update SHALL post locale field names (`title_de`, `title_en`, `description_de`, `description_en`) and SHALL pass those locale fields into catalog create/update (no single `title` / `description` wrap on the admin write path). Non-admin callers (seed, tests) MAY still pass a single `title` / `description` into the domain coerce.

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

#### Scenario: Admin form posts locale field names

- **WHEN** an admin submits create or edit
- **THEN** the parser reads `title_de`, `title_en`, `description_de`, and `description_en`
- **AND** posted `title` / `description` are ignored

### Requirement: Admin event create and edit use a three-step form

Admin create (`/:locale/admin/events/new`) and edit (`/:locale/admin/events/:id/edit`) SHALL present fields in three steps with visible progress: (1) general — partner, **German then English title**, **German then English Markdown description**, structured location, category, event type, tags, language metadata; (2) Date & tickets — Timing mode; then Capacity allocation and the capacity number (visible for every ticket type); then ticket type, secret code or voucher inventory; then the range builder and editable datetime list; then totals (credits, datetime capacity, and available codes/tickets for voucher types); (3) image — primary image upload (required on create; optional replace on edit). The system SHALL keep all fields in a single SSR `POST` form. Inactive steps SHALL remain in the document so their values submit. Clone SHALL remain a separate dates/inventory form but SHALL expose Timing mode and Capacity allocation as editable controls (not hidden-only fields) so All day vs Time slot and Shared vs Per date UI matches create/edit. General SHALL NOT use a nested locale tablist for title/description.

#### Scenario: Create walks three steps

- **WHEN** I open new-event
- **THEN** I see step 1 General with progress indicating step 1 of 3
- **AND** I do not see the datetime list or image uploader until I go to those steps

#### Scenario: Create submit is on the image step

- **WHEN** I am on new-event step 3
- **THEN** I can submit the form
- **AND** earlier steps' values are included in the POST

#### Scenario: Edit can jump to image

- **WHEN** I open edit-event
- **THEN** I can move to step 3 without posting
- **AND** saving posts the full form including unchanged dates and image id

#### Scenario: Missing image returns to step 3

- **WHEN** I create an event and submit without a primary image
- **THEN** the form is rejected
- **AND** the re-rendered form shows the image step

#### Scenario: Timing mode is first on Date & tickets

- **WHEN** I open create or edit event and go to step 2
- **THEN** Timing mode is shown before the datetime list and range builder

#### Scenario: Capacity allocation follows Timing mode

- **WHEN** I am on create or edit step 2
- **THEN** Capacity allocation and the capacity number are shown after Timing mode and before ticket type

#### Scenario: Datetime list is last on Date & tickets

- **WHEN** I am on create or edit step 2
- **THEN** the range builder and datetime rows are below ticket type and redemption fields
- **AND** totals are below the datetime rows

#### Scenario: General stacks DE then EN copy fields

- **WHEN** I open create or edit event on General
- **THEN** I see German title and description fields above English title and description fields
- **AND** I do not see a nested locale tablist for those fields
