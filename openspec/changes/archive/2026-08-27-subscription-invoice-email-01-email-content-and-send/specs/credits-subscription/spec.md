## ADDED Requirements

### Requirement: Subscription invoice email content

The system SHALL be able to build and send a transactional membership invoice email in `de` or `en` via the existing Resend client (`@unveiled/email`), with a single PDF attachment supplied by the caller. The body SHALL include basic next-step instructions and absolute links derived from `SITE_URL` (no trailing slash) plus the email locale. Unused credits SHALL be described as not rolling over. HTML SHALL be simple escaped markup (not HeroUI). Send helpers SHALL return Resend success/failure and MUST NOT throw on HTTP errors.

EN subject SHALL be `Your Unveiled Berlin invoice`. DE subject SHALL be `Deine Unveiled Berlin Rechnung`.

EN text SHALL be (one sentence per line, blank line between blocks; `{SITE_URL}` is the caller-supplied origin):

```
Your Unveiled Berlin membership is active.

Plan: Basic Berlin — 29€/month
Credits: 17 per month (unused credits do not roll over)

Your invoice is attached as a PDF.

What to do next:
1. Browse events: {SITE_URL}/en/events
2. Book with your credits — tickets and door details land in My Tickets: {SITE_URL}/en/bookings
3. Manage billing: {SITE_URL}/en/profile/billing
4. How it works: {SITE_URL}/en/how-it-works
5. FAQ: {SITE_URL}/en/faq

Support: support@unveiled.berlin
```

DE text SHALL be:

```
Deine Unveiled Berlin Mitgliedschaft ist aktiv.

Abo: Basic Berlin — 29€/Monat
Credits: 17 pro Monat (ungenutzte Credits verfallen)

Deine Rechnung ist als PDF angehängt.

Nächste Schritte:
1. Events entdecken: {SITE_URL}/de/events
2. Mit Credits buchen — Tickets und Einlassdetails findest du unter Meine Tickets: {SITE_URL}/de/bookings
3. Abrechnung verwalten: {SITE_URL}/de/profile/billing
4. So funktioniert's: {SITE_URL}/de/how-it-works
5. FAQ: {SITE_URL}/de/faq

Support: support@unveiled.berlin
```

HTML SHALL be a paragraph-equivalent of the same content with anchor tags on each URL and `mailto:support@unveiled.berlin`.

#### Scenario: EN invoice email includes instructions and site links

- **WHEN** invoice email content is built with locale `en` and `siteUrl` `https://example.test`
- **THEN** the subject is `Your Unveiled Berlin invoice`
- **AND** the text and HTML mention that membership is active, plan **Basic Berlin** at **29€/month**, **17 credits** per month, and that unused credits do not roll over
- **AND** they include links `https://example.test/en/events`, `https://example.test/en/bookings`, `https://example.test/en/profile/billing`, `https://example.test/en/how-it-works`, `https://example.test/en/faq`
- **AND** they include `support@unveiled.berlin`
- **AND** they state that the invoice PDF is attached

#### Scenario: DE invoice email includes instructions and site links

- **WHEN** invoice email content is built with locale `de` and `siteUrl` `https://example.test`
- **THEN** the subject is `Deine Unveiled Berlin Rechnung`
- **AND** the text and HTML mention that the membership is active, plan **Basic Berlin** at **29€/Monat**, **17 Credits** pro Monat, and that unused credits do not roll over (`ungenutzte Credits verfallen` / equivalent no-rollover wording)
- **AND** they include links `https://example.test/de/events`, `https://example.test/de/bookings`, `https://example.test/de/profile/billing`, `https://example.test/de/how-it-works`, `https://example.test/de/faq`
- **AND** they include `support@unveiled.berlin`
- **AND** they state that the invoice PDF is attached

#### Scenario: Send attaches the caller-supplied PDF

- **WHEN** `sendSubscriptionInvoice` is called with base64 PDF bytes and filename `invoice-in_test.pdf`
- **THEN** the Resend payload includes one attachment with that filename, those bytes, and content type `application/pdf`
- **AND** no Stripe API is called from `@unveiled/email`
