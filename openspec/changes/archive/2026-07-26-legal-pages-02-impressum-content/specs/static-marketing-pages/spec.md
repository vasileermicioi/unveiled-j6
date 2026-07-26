## ADDED Requirements

### Requirement: Impressum shows operator identity
The system SHALL publish a bilingual Impressum/Imprint page with operator name, representatives, postal address in Berlin, contact phone and email, content-responsibility statement, and standard liability/copyright notices — without placeholder copy. A short privacy note MAY point to the Privacy Policy route; full privacy policy text lives on `/privacy`.

#### Scenario: Impressum linked from footer shows real identity
- **WHEN** a visitor opens Impressum / Imprint from the footer LEGAL column
- **THEN** they see unveiled berlin operator details (representatives, Berlin address, phone, support email)
- **AND** the page language matches the URL locale (`de` or `en`)

#### Scenario: Impressum has no placeholder body copy
- **WHEN** a visitor views `/de/impressum` or `/en/impressum`
- **THEN** impressum section bodies do not contain Platzhalter or “Placeholder —” / “pending legal review” strings
