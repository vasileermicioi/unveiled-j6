## Why

Billing already activates membership on Checkout webhooks and Resend already sends booking / waitlist mail with attachments, but nothing yet builds a membership-invoice message. This first increment of **subscription invoice email** adds DE/EN copy and a send helper in `@unveiled/email` so later steps can attach a Stripe PDF and wire the webhook without inventing email content there.

## What Changes

- Add `buildSubscriptionInvoiceContent({ locale, siteUrl })` in `@unveiled/email` with verbatim DE/EN subjects and bodies (instructions + locale-prefixed `SITE_URL` links; unused credits do not roll over).
- Add `sendSubscriptionInvoice` wrapping `sendResendEmail` with one caller-supplied PDF attachment (`application/pdf`).
- Export types and functions from `packages/email/src/index.ts`.
- Extend `packages/email/src/email.test.ts` (no live network): DE + EN content assertions and a mocked Resend payload with the PDF attachment.
- Out of scope: Stripe PDF download, webhook wiring, Checkout metadata, `docs/product/` / Gherkin (step 03), renewal emails.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `credits-subscription`: The system SHALL be able to build and send a transactional membership invoice email in `de` or `en` via `@unveiled/email`, with a single caller-supplied PDF attachment, next-step instructions, absolute `SITE_URL` links, and no-rollover credit copy. Send helpers return Resend success/failure and MUST NOT throw on HTTP errors.

## Impact

- **Package (`packages/email`):** new `subscription-invoice.ts` and `send-subscription-invoice.ts`; public exports on `index.ts`; unit tests in `email.test.ts`.
- **Dependencies:** reuse existing `sendResendEmail` / `ResendAttachment`. `@unveiled/email` MUST NOT import `stripe` or `@unveiled/billing`.
- **Callers:** none in this step — step 02 (`subscription-invoice-email-02-stripe-pdf-and-webhook`) will call `sendSubscriptionInvoice` after a successful first subscription payment.
- **Env:** from-address remains `DAILY_CODES_FROM_EMAIL` at call time; this step does not read env. No new secrets.
- **Source brief:** `.dev-plan/current-iteration/subscription-invoice-email-01-email-content-and-send.md`
- **Parent:** `.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `subscription-invoice-email-02-stripe-pdf-and-webhook`
- **Canonical product docs:** wait for step 03 (do not edit `docs/product/` here)
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/email && bun test`
