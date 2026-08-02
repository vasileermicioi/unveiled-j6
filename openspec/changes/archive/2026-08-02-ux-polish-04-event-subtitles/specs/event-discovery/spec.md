## ADDED Requirements

### Requirement: Public detail shows subtitles metadata

When `has_subtitles` is true, the public event detail DETAILS metadata SHALL show subtitles availability and the subtitle language label (allowlisted code or equivalent display consistent with spoken-language codes on the same page). When `has_subtitles` is false, the page SHALL omit subtitles chrome (no “no subtitles” row). Subtitles display SHALL NOT replace or alter the spoken-languages / language-independent DETAILS row.

#### Scenario: Subtitled event shows language on detail

- **WHEN** a guest or member opens a public event detail page for an event with `has_subtitles = true` and an allowlisted `subtitle_language`
- **THEN** the DETAILS metadata includes a subtitles row that indicates subtitles are available
- **AND** the subtitle language is shown

#### Scenario: Non-subtitled event omits subtitles chrome

- **WHEN** a guest or member opens a public event detail page for an event with `has_subtitles = false`
- **THEN** the DETAILS metadata does not include a subtitles row
