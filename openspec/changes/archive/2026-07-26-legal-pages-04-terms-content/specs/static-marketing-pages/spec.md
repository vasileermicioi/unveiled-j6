## ADDED Requirements

### Requirement: Terms describe membership credits and booking
The system SHALL publish bilingual Terms of Service / AGB covering membership subscription, credit allotment and expiry (no rollover), booking/admission via partner venues, cancellation at a high level, liability, and governing law — without placeholder copy.

#### Scenario: Terms state credits do not roll over
- **WHEN** a visitor reads the Credits section of Terms / AGB
- **THEN** the copy states that unused credits do not roll over to the next period
- **AND** the page language matches the URL locale

#### Scenario: Terms page has no placeholder body copy
- **WHEN** a visitor views `/de/terms` or `/en/terms`
- **THEN** terms section bodies do not contain Platzhalter or “Placeholder —” / “pending legal review” strings

#### Scenario: Terms cover membership booking and cancellation
- **WHEN** a visitor opens Terms / AGB
- **THEN** they see sections covering membership/subscription, credits, bookings/admission, and cancellation
- **AND** the page language matches the URL locale
