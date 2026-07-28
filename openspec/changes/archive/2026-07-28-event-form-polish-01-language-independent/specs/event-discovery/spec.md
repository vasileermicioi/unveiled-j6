## ADDED Requirements

### Requirement: Language-independent events match any language filter
When event results are filtered or searched by language, events with `language_independent = true` SHALL be included for every language value (equivalent to matching all languages). Events that are not language-independent SHALL match only when their `languages` list intersects the selected language(s). Absence of a language filter UI does not remove this matching rule from the query/helper layer: the system SHALL expose a reusable predicate or helper that implements this rule and SHALL cover it with a unit or integration test.

#### Scenario: Language filter includes language-independent events
- **WHEN** a booking-eligible member applies a language filter (if present) or a query/helper filters by language
- **THEN** language-independent events remain in the result set alongside events that list that language

#### Scenario: Non-independent events require language intersection
- **WHEN** a language filter selects a language code
- **AND** an event is not language-independent and does not list that code
- **THEN** that event is excluded from the filtered result set

### Requirement: Detail shows language-independent clearly
When a guest or member opens a public event detail page for a language-independent event, the DETAILS metadata SHALL NOT imply a specific spoken language list. The page SHALL indicate the event is language-independent (using the Language-independent / Sprachunabhängig label) or omit the languages row rather than showing an empty language list.

#### Scenario: Detail shows language-independent clearly
- **WHEN** a guest or member opens a language-independent event detail page
- **THEN** the details metadata does not imply a specific spoken language list
- **AND** it indicates the event is language-independent (or omits languages rather than showing an empty list)

#### Scenario: Language-specific detail still lists languages
- **WHEN** a guest or member opens an event that is not language-independent and has one or more languages
- **THEN** the details metadata shows those languages as today
