## Why

The first-payment subscription invoice email (`buildSubscriptionInvoiceContent` + `sendSubscriptionInvoice`, triggered on `invoice.paid` with `subscription_create`) is plain unbranded paragraphs with no preheader, header hierarchy, or summary block, so it reads as an afterthought next to the app. Resubscription (new `subscription_create` after `INACTIVE`) additionally has no explicit content contract. This step professionalizes that one mail while keeping its existing send contract intact.

## What Changes

- Rework `buildSubscriptionInvoiceContent` (DE + EN, subjects unchanged) into a mail-client-safe branded layout: preheader, branded header block, greeting, membership summary (Basic Berlin, 29 €, 17/month, no-rollover), "invoice attached (PDF)" note, next-steps list reusing the 5 existing locale links, support footer; table-based layout with inline styles, max-width 600, mirrored plain-text part; escape all interpolated values.
- Keep `sendSubscriptionInvoice` signature (one caller-supplied PDF, `application/pdf`, optional idempotency key) and the `subscription_create`-only trigger unchanged; no new send path or idempotency logic.
- Establish the resub-reuse contract: a resubscription (new `subscription_create` after `INACTIVE`) reuses this same neutral-active template with no welcome / welcome-back copy fork.
- Extend `email.test.ts` invoice cases (preheader, summary lines, links, text/HTML parity, no-rollover wording, both locales; `fetchImpl` mock, no live network).

## Capabilities

### New Capabilities

- None — no new product capability; this is a content/layout refresh of an existing email plus an explicit reuse contract.

### Modified Capabilities

- `credits-subscription`: Requirement "Subscription invoice email content" changes from simple escaped paragraph markup to a branded mail-client-safe layout (preheader, header, membership summary with plan/price/monthly credits/no-rollover note, next steps with locale-prefixed links, support footer, plain-text mirror) with unchanged subjects and single-PDF contract, reused unchanged for resubscription.

## Impact

- Affected code: `packages/email/src/subscription-invoice.ts` (content builder), `packages/email/src/send-subscription-invoice.ts` (unchanged signature, HTML passthrough), `packages/email/src/email.test.ts` (extended assertions). No changes to `apps/web/app/lib/subscription-invoice-email.ts` orchestrator, Stripe/billing lifecycle, Checkout, portal, or webhook idempotency.
- Dependencies: none new; `@unveiled/email` still MUST NOT import Stripe/`@unveiled/billing`; From stays caller-supplied (`DAILY_CODES_FROM_EMAIL` at webhook).
- Consumer: `subscription-emails-02-unsubscribe` reuses the layout/locale/idempotency conventions established here.
