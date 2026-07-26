## ADDED Requirements

### Requirement: Legal page section body content
The system SHALL render each legal page section with a title and one or more body paragraphs sourced from localized content modules (not a single `placeholder` field). Each body entry SHALL be rendered as its own HeroUI `Paragraph` on Impressum, Privacy, and Terms routes.

#### Scenario: Legal section shows body paragraphs
- **WHEN** a visitor opens Impressum, Privacy, or Terms
- **THEN** each listed section shows its title and at least one body paragraph from the content module
- **AND** the page does not rely on a `placeholder` field name in the content model
