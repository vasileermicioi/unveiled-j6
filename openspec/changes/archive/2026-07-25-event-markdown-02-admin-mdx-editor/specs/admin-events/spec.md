## ADDED Requirements

### Requirement: Admin edits event description as Markdown

The system SHALL provide an MDXEditor-based Markdown editor on admin event create, edit, and series forms for the description field. The editor SHALL submit Markdown source through the existing SSR form field `description`. Stored descriptions SHALL remain Markdown text in `events.description` and SHALL be shown on the public event detail page per the `event-catalog` Markdown rendering requirements. When an admin updates an event's title, description, image, price, or redemption configuration, the description value MAY include Markdown.

#### Scenario: Create with Markdown description

- **WHEN** an admin creates an event and authors a description with headings and a list in the Markdown editor
- **THEN** the saved `events.description` value is the Markdown source
- **AND** the public event detail page renders that Markdown

#### Scenario: Edit preserves Markdown source

- **WHEN** an admin opens an existing event edit page
- **THEN** the Markdown editor is initialized with the stored description source
- **AND** saving without intentional edits does not strip the Markdown structure

#### Scenario: Series create uses the same editor

- **WHEN** an admin opens the series create form
- **THEN** the shared base fields include the same MDXEditor-based description control

### Requirement: Description mutations stay SSR form POST

The system SHALL continue to persist description changes only via dedicated admin page form POST (create/edit/series). Client-side-only save APIs for description are out of scope.

#### Scenario: Submit uses form field

- **WHEN** an admin submits the event form
- **THEN** the request body includes `description` as Markdown text from the editor sync field
