## ADDED Requirements

### Requirement: Subscription invoice email is specified and operable

Product Gherkin, integrations extras, i18n inventory, decisions log, coverage matrix, and `DEPLOYMENT.md` SHALL describe the first-paid-subscription invoice email (Stripe PDF attachment, `SITE_URL` links, DE/EN copy, post-apply send, no renewal send). Staging operators SHALL be told to disable Stripe Dashboard customer invoice/receipt emails to avoid duplicates. Playwright MAY skip inbox assertion with an explicit no-harness reason; unit tests remain the default proof.

#### Scenario: Subscription invoice email after first successful payment

- **WHEN** I complete Stripe Checkout successfully for the Basic Berlin plan
- **AND** Stripe reports the first subscription invoice as paid
- **THEN** I receive an email with the Stripe invoice PDF attached
- **AND** the email includes basic instructions and links to events, My Tickets, billing, how-it-works, FAQ, and support
- **AND** unused credits are described as not rolling over

#### Scenario: Operator docs mention invoice email and Stripe Dashboard overlap

- **WHEN** an operator follows `DEPLOYMENT.md` for Stripe + Resend
- **THEN** they can confirm the invoice email on a test Checkout
- **AND** they are instructed to turn off Stripe-hosted customer invoice/receipt emails in the Dashboard
