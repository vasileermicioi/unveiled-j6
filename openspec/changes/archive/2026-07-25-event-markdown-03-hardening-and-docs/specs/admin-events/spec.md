## ADDED Requirements

### Requirement: Admin Markdown description acceptance scenarios

The admin event feature file (`docs/product/features/admin-events.feature`) SHALL describe Markdown authoring on create/edit (and series via shared base fields) and that the stored value is Markdown source. Scenarios SHALL state that guests see rendered Markdown on the public event detail page. Playwright coverage, if added, SHALL use proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin authors Markdown description

- **WHEN** an admin creates or edits an event and enters Markdown in the description editor
- **THEN** the event is saved with that Markdown source
- **AND** guests see rendered Markdown on the public event detail page

#### Scenario: Product feature file documents Markdown description

- **WHEN** an agent reads `docs/product/features/admin-events.feature` after this step
- **THEN** it includes scenarios covering Markdown authoring on create/edit (and series via shared base fields) and public render of the stored Markdown

## MODIFIED Requirements

### Requirement: Admin edits event description as Markdown

The system SHALL provide an MDXEditor-based Markdown editor on admin event create, edit, and series forms for the description field. The editor SHALL submit Markdown source through the existing SSR form field `description`. Stored descriptions SHALL remain Markdown text in `events.description` and SHALL be shown on the public event detail page per the `event-catalog` Markdown rendering requirements. Creating or editing an event with a description SHALL accept Markdown source for the description field (toolbar-assisted via MDXEditor) while other required fields remain unchanged. When an admin updates an event's title, description, image, price, or redemption configuration, the description value MAY include Markdown. Product Gherkin in `docs/product/features/admin-events.feature` SHALL include acceptance scenarios for Markdown authoring and public render.

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

#### Scenario: Create required fields unchanged

- **WHEN** an admin creates an event with a Markdown description plus the existing required fields (title, partner, credit price, capacity, image, dateTime, redemption config as applicable)
- **THEN** validation and persistence rules for those other fields remain unchanged
