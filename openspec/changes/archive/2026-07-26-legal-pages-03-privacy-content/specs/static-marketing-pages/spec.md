## ADDED Requirements

### Requirement: Privacy policy describes membership data processing
The system SHALL publish a bilingual Privacy Policy that identifies the controller, categories of personal data, purposes/legal bases at a high level, key processors (auth, database, payments, email, hosting, error tracking), cookie/consent behavior for non-essential map tiles, retention overview, and data-subject rights — without placeholder copy.

#### Scenario: Privacy page covers controller and rights
- **WHEN** a visitor opens Privacy / Datenschutz
- **THEN** they see the Berlin controller identity and contact email
- **AND** they see sections covering processing purposes, cookies/consent, and their GDPR rights
- **AND** the page language matches the URL locale

#### Scenario: Privacy page has no placeholder body copy
- **WHEN** a visitor views `/de/privacy` or `/en/privacy`
- **THEN** privacy section bodies do not contain Platzhalter or “Placeholder —” / “pending legal review” strings
