## ADDED Requirements

### Requirement: Legal pages are complete and regression-tested
The system SHALL keep Impressum, Privacy Policy, and Terms of Service linked from the footer LEGAL column, fully localized, free of placeholder copy, and covered by e2e assertions that verify distinctive body content on each page.

#### Scenario: Legal pages exist and are linked from the footer
- **WHEN** I visit the Impressum, Privacy Policy, or Terms of Service page
- **THEN** I see the corresponding legal content in my selected language
- **AND** each page shows non-placeholder body sections (not “pending legal review” stubs)
- **AND** each is linked from the site footer on every page

#### Scenario: Legal page body content is distinctive and non-placeholder
- **WHEN** a visitor opens `/de|en/impressum`, `/de|en/privacy`, or `/de|en/terms`
- **THEN** the page shows at least one distinctive real body string for that page type (e.g. Berlin address on Impressum, processor/rights cue on Privacy, credits no-rollover cue on Terms)
- **AND** the rendered page does not contain `Platzhalter` or `pending legal review`
