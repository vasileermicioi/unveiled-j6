## ADDED Requirements

### Requirement: Admin subtitles checkbox and language

Admin create and edit event forms SHALL offer a native Subtitles checkbox (`has_subtitles`) and, when that checkbox is checked, a required native language `<select>` (`subtitle_language`) whose options are the event language allowlist (`EVENT_LANGUAGES`). The subtitle controls SHALL remain available regardless of the Language-independent checkbox / spoken-languages multi-select state. When Subtitles is unchecked, the language select SHALL be hidden or non-required and the submitted state MUST persist `subtitle_language = null`. Forms MUST NOT use HeroUI `Select`, `Checkbox`, or `Switch` for these fields (native checkbox + native select / existing admin native wrappers only). DE+EN admin copy SHALL label the controls clearly (Subtitles / Untertitel or equivalent).

#### Scenario: Checking subtitles reveals required language select

- **WHEN** an ADMIN checks Subtitles on create or edit
- **THEN** a native language select from the event language allowlist is shown and required

#### Scenario: Unchecking subtitles omits language requirement

- **WHEN** an ADMIN leaves Subtitles unchecked and submits a valid event form
- **THEN** the saved event has `has_subtitles = false` and `subtitle_language = null`

#### Scenario: Subtitles controls available when language-independent

- **WHEN** an ADMIN checks Language-independent on the event form
- **THEN** the Subtitles checkbox (and language select when Subtitles is checked) remain available
