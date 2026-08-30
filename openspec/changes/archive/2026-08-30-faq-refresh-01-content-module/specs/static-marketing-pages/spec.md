# Static Marketing Pages - Delta Spec (faq-refresh-01-content-module)

## ADDED Requirements

### Requirement: FAQ page content

The system SHALL render `/faq` (per locale) as the existing hero + support-card layout, with an accordion of 11 Q&As covering membership mechanics, Credits usage and pricing, rollover, booking cancellation, no-show, event cancellation, rescheduling, membership cancellation, account sharing, and partner-organised experiences, in the visitor's locale, with only one item expanded at a time and the first item expanded by default. Question and answer copy SHALL match the approved copy in `.dev-plan/FAQs.md` (EN) and its DE translation; layout and interaction remain unchanged. The hero subheadline SHALL read (DE) "Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort." and (EN) "Everything important about membership, credits, booking, and cancellation in one place.". Answers SHALL be plain text; support email addresses inside answers render as the literal text `support@unveiled.berlin` (the clickable support link remains only in the help-card description).

#### Scenario: FAQ shows refreshed content

- **WHEN** a visitor opens `/de/faq` or `/en/faq`
- **THEN** the accordion lists the 11 approved Q&As in order, first item expanded
- **AND** the page hero, support email link, and accordion behavior are visually unchanged

#### Scenario: FAQ JSON-LD mirrors content

- **WHEN** `/faq` is rendered in a locale
- **THEN** the `schema.org/FAQPage` JSON-LD `mainEntity` contains exactly the same 11 questions and answers as the visible accordion

#### Scenario: Rollover answer ships as approved promise

- **WHEN** a visitor expands "What happens to unused Credits?" (EN) or "Was passiert mit ungenutzten Credits?" (DE)
- **THEN** the answer states that unused Credits roll over to the next month and can be saved up to 2 months' worth, verbatim per approved copy
