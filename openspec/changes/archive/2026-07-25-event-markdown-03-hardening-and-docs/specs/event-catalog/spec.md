## ADDED Requirements

### Requirement: Demo seed includes Markdown description

Demo seed data SHALL include at least one upcoming event whose description uses multi-block Markdown (heading, list, and a link) so staging demos exercise the render pipeline. The seed path remains the Abundo fixture consumed by `@unveiled/db` catalog seed (`fixtures/abundo-berlin-demo.json` via `seed-data.ts`).

#### Scenario: Seeded Markdown event

- **WHEN** demo seed runs on an empty catalog
- **THEN** at least one seeded event description contains Markdown structure beyond a single plain paragraph (heading, list, and a link)

### Requirement: Product schema documents Markdown description

Product schema documentation (`docs/product/database/schema-overview.md`) SHALL state that `events.description` is Markdown text at rest, rendered with GFM on public detail and authored via MDXEditor in admin. Canonical UI docs SHALL record the public `MarkdownContent` surface and the admin MDXEditor form-control exception (`ui-component-map.md`, `design-system.md`, `docs/COMPONENTS.md`) and SHALL log the decision in `gaps-and-decisions.md`.

#### Scenario: Schema overview notes Markdown at rest

- **WHEN** an agent reads the `events.description` field documentation in `schema-overview.md`
- **THEN** it states that the value is Markdown text at rest

#### Scenario: Design system lists MDXEditor exception

- **WHEN** an agent reads `docs/product/ui/design-system.md` form-control exceptions
- **THEN** MDXEditor is listed alongside the existing image-upload / geo-picker / `@better-auth-ui/*` exceptions

## MODIFIED Requirements

### Requirement: Event description is Markdown at rest

The system SHALL store each event's `description` as Markdown text in `events.description` (existing text column; no separate HTML column). Product schema documentation SHALL state that `events.description` is Markdown text at rest, rendered with GFM on public detail and authored via MDXEditor in admin.

#### Scenario: Plain text remains valid

- **WHEN** an event description contains only plain paragraphs without Markdown syntax
- **THEN** public rendering shows the same readable text as before

#### Scenario: Schema documentation matches storage

- **WHEN** an implementer reads `docs/product/database/schema-overview.md` for `events.description`
- **THEN** the field is documented as Markdown at rest (not opaque plain-only text)
