## ADDED Requirements

### Requirement: FAQ page

The route `/:locale/faq` SHALL render a support header, a HelpSection with exactly three FAQ items in an accordion (one open at a time, first open by default), a mailto link to `support@unveiled.berlin`, and a back button, using verbatim DE/EN copy from `static-pages-content.md`.

#### Scenario: FAQ accordion behavior

- **WHEN** a guest expands the second FAQ item on `/de/faq`
- **THEN** only that item is expanded and the previously open item collapses

#### Scenario: Support email visible

- **WHEN** a guest visits `/en/faq`
- **THEN** they see a clickable mailto link to `support@unveiled.berlin`

#### Scenario: FAQPage structured data

- **WHEN** a crawler requests `/de/faq`
- **THEN** the HTML includes `schema.org/FAQPage` JSON-LD wrapping the three Q&A pairs

#### Scenario: FAQ page SEO

- **WHEN** a crawler requests `/en/faq`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML

### Requirement: Membership info page

The route `/:locale/membership` SHALL render plan information (title, subtitle, perks, guarantee, secure-payment line) from the `checkout` content keys without functional Stripe checkout or auth requirement in Phase 1.

#### Scenario: Plan details visible

- **WHEN** a guest visits `/de/membership`
- **THEN** they see the German plan title and subtitle from `content-i18n-inventory.md` checkout keys

#### Scenario: Credits do not roll over

- **WHEN** a guest views membership perks in either locale
- **THEN** the perks list does NOT claim credits roll over; it reflects monthly fresh credits per the corrected copy decision

#### Scenario: No payment processing

- **WHEN** a guest clicks the primary membership CTA in Phase 1
- **THEN** no Stripe checkout session is created and no payment form is shown

#### Scenario: Membership page SEO

- **WHEN** a crawler requests `/de/membership`
- **THEN** the response includes a unique `<title>`, `<meta name="description">`, canonical, hreflang alternates, and Open Graph tags in the initial HTML
