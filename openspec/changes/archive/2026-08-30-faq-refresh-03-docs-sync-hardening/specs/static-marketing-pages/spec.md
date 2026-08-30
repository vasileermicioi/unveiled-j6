## ADDED Requirements

### Requirement: FAQ content guard

The system SHALL keep a unit test that asserts the FAQ content module exposes 11 non-empty Q&A items per locale (DE and EN) and that the `FAQPage` JSON-LD builder emits exactly those 11 entities. The test SHALL run without any external services.

#### Scenario: Guard test fails on drift

- **WHEN** the item count or copy shape of the FAQ content module changes unintentionally (missing/empty question or answer, or a per-locale count other than 11)
- **THEN** `bun test apps/web` fails on the FAQ guard test

#### Scenario: JSON-LD entity count matches content

- **WHEN** the FAQ guard test builds JSON-LD from the shipped FAQ items
- **THEN** the resulting `mainEntity` array contains exactly 11 entries

## MODIFIED Requirements

### Requirement: FAQ page content

The system SHALL render `/faq` (per locale) as the existing hero + support-card layout, with an accordion of 11 Q&As covering membership mechanics, Credits usage and pricing, rollover, booking cancellation, no-show, event cancellation, rescheduling, membership cancellation, account sharing, and partner-organised experiences, in the visitor's locale, with only one item expanded at a time and the first item expanded by default. Question and answer copy SHALL match the approved copy in `.dev-plan/FAQs.md` (EN) and its DE translation; layout and interaction remain unchanged. The hero subheadline SHALL read (DE) "Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort." and (EN) "Everything important about membership, credits, booking, and cancellation in one place.". Answers SHALL be plain text; support email addresses inside answers render as the literal text `support@unveiled.berlin` (the clickable support link remains only in the help-card description). The 2-month Credits rollover promise in the FAQ is deliberate interim forward copy: the credit-engine rollover behavior ships in a later iteration (tracked as a separate follow-up feature) and support fulfills it manually until then. Canonical documentation (`docs/product/ui/static-pages-content.md` §FAQ) SHALL match the shipped copy, and `docs/product/extras/gaps-and-decisions.md` SHALL record the intentional interim inconsistency against Terms/billing copy and the follow-up feature.

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

#### Scenario: Docs match shipped FAQ

- **WHEN** an implementer reads `docs/product/ui/static-pages-content.md` §FAQ
- **THEN** the quoted DE/EN copy, subheadline, and item count equal the shipped FAQ content module

#### Scenario: Rollover decision recorded

- **WHEN** a reader compares the FAQ rollover promise against Terms/billing copy
- **THEN** `docs/product/extras/gaps-and-decisions.md` records the intentional interim inconsistency and the follow-up feature that will align the credit engine and legal copy
