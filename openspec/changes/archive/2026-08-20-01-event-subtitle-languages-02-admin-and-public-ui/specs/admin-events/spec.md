## RENAMED Requirements

- FROM: `### Requirement: Admin subtitles checkbox and language`
- TO: `### Requirement: Admin subtitles checkbox and languages`

## MODIFIED Requirements

### Requirement: Admin subtitles checkbox and languages
Admin create and edit event forms SHALL offer a native Subtitles checkbox (`has_subtitles`) and, when that checkbox is checked, a required searchable checkbox multi-select (`subtitle_languages`) whose options are the full ISO 639-1 language list (not limited to spoken-event `EVENT_LANGUAGES`). The control SHALL use the same checkbox multi-select pattern as spoken event languages (search filter; selected values remain in the POST when hidden by the filter). At least one language SHALL be required when Subtitles is checked. The subtitle controls SHALL remain available regardless of Language-independent / spoken-languages state. When Subtitles is unchecked, the multi-select SHALL be hidden or non-required and the submitted state MUST persist `subtitle_languages = null`. Forms MUST NOT use HeroUI `Select`, `Checkbox`, or `Switch` for these fields, and MUST NOT use a native `<select>` or `<select multiple>` for subtitle languages. DE+EN admin copy SHALL label the language field in the plural (Subtitle languages / Untertitelsprachen or equivalent) and SHALL state that one or more languages may be chosen.

Admin Events catalog and Featured add-results Subtitles cells SHALL list every stored subtitle language as locale labels (same formatter as spoken Languages on those tables), joined, or an em dash when subtitles are off / empty.

#### Scenario: Checking subtitles reveals required language select
- **WHEN** an ADMIN checks Subtitles on create or edit
- **THEN** a searchable subtitle-languages checkbox multi-select with the full ISO 639-1 list is shown and at least one language is required

#### Scenario: Check Subtitles reveals language multi-select
- **WHEN** I open create or edit event and check Subtitles
- **THEN** a searchable subtitle-languages checkbox multi-select with the full ISO 639-1 list is shown and at least one language is required

#### Scenario: Save event with Subtitles and multiple languages
- **WHEN** I create an event with Subtitles checked and DE plus EN selected
- **THEN** the saved event has `has_subtitles` true and `subtitle_languages` containing DE and EN
- **AND** the public detail DETAILS metadata shows subtitles availability and those languages

#### Scenario: Unchecking subtitles omits language requirement
- **WHEN** an ADMIN leaves Subtitles unchecked and submits a valid event form
- **THEN** the saved event has `has_subtitles` = false and `subtitle_languages` = null

#### Scenario: Subtitles controls available when language-independent
- **WHEN** an ADMIN checks Language-independent on the event form
- **THEN** the Subtitles checkbox remains available
- **AND** checking Subtitles still shows the subtitle-languages checkbox multi-select

#### Scenario: Admin list shows all subtitle languages
- **WHEN** an ADMIN views the events list or Featured add-results for an event with `has_subtitles` true and `subtitle_languages` containing DE and EN
- **THEN** the Subtitles cell shows both languages as locale labels
