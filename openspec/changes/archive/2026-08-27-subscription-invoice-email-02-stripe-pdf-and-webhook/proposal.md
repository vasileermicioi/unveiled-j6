## Why

Step 01 shipped `sendSubscriptionInvoice` / `buildSubscriptionInvoiceContent` in `@unveiled/email`, but Stripe webhooks still only activate, refill, or mark past-due. After a successful first subscription payment, members do not receive the branded invoice email with the Stripe PDF attached.

## What Changes

- Add `downloadStripeInvoicePdf` on `@unveiled/billing`: retrieve a finalized invoice if needed, `fetch` a **fresh** `invoice_pdf` URL (do not cache it), return `{ pdfBase64, filename }` (`invoice-{number-or-id}.pdf`) or a typed skip/error. Mockable `fetchImpl`.
- Stamp Checkout `subscription_data.metadata.locale` (`de` | `en`) from the membership route locale, keeping existing `userId` metadata.
- After `applyStripeEvent`, if the event is `invoice.paid` with `billing_reason === "subscription_create"`, resolve recipient + locale + `SITE_URL`, download the PDF, and send the step-01 email. Do **not** send on `subscription_cycle`, `subscription_update`, `checkout.session.completed`, or failed payments.
- Idempotency: after a successful Resend, set Stripe invoice metadata `unveiled_invoice_email=sent`. Skip send when that key is already set. Optionally pass Resend `Idempotency-Key` = invoice id if the existing client can take a header without a large refactor; metadata alone is enough if not.
- Missing `RESEND_API_KEY` / `DAILY_CODES_FROM_EMAIL`, missing recipient, or null `invoice_pdf`: log and skip (HTTP 200) so activation is not failed. Transient PDF fetch or Resend failure after env and PDF URL exist: log and return HTTP 500 so Stripe retries. Never throw past a successful ledger apply in a way that duplicates refill.
- Do **not** store the PDF in R2 or Postgres. Do **not** add `@unveiled/email` as a dependency of `@unveiled/billing`.
- Out of scope: Gherkin / `DEPLOYMENT.md` / i18n inventory (step 03); renewal emails; HeroUI; new secrets.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `credits-subscription`: After a verified Stripe `invoice.paid` with `billing_reason` `subscription_create`, download the Stripe invoice PDF from a freshly retrieved `invoice_pdf` URL and send the step-01 subscription invoice email once (Stripe invoice metadata records a successful send). Membership Checkout SHALL copy the UI locale into `subscription_data.metadata.locale`. Credit ledger and `applyStripeEvent` activation/refill behavior stay unchanged. Renewal (`subscription_cycle`) invoices MUST NOT send this email. Missing Resend config or missing `invoice_pdf` SHALL skip the email without failing activation.

## Impact

- **Package (`packages/billing`):** new PDF download helper + export; `createCheckoutSession` accepts `locale` and sets `subscription_data.metadata` to `{ userId, locale }`. Existing `invoice.paid` cycle refill path is unchanged.
- **App (`apps/web`):** `membership.tsx` threads route locale into Checkout; `stripe-webhook.ts` plus a thin `app/lib/` orchestrator run send **after** `applyStripeEvent`. Recipient: `invoice.customer_email`, else `public.users.email` via `subscriptionIdFromInvoice` → `subscriptions.userId`. Locale: subscription metadata `locale` → `users.profile.language` (`EN` → `en`, otherwise `de`) → `de`.
- **Package (`packages/email`):** caller of `sendSubscriptionInvoice` only. Optional small `Idempotency-Key` header if `sendResendEmail` can take it without a large refactor; no copy changes.
- **Dependencies:** `@unveiled/web` already depends on `@unveiled/billing` and `@unveiled/email`. Billing MUST NOT depend on email.
- **Env:** reuse `RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL`, `STRIPE_SECRET_KEY`, `SITE_URL`. No new secrets.
- **Source brief:** `.dev-plan/current-iteration/subscription-invoice-email-02-stripe-pdf-and-webhook.md`
- **Parent:** `.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`
- **Depends on:** `subscription-invoice-email-01-email-content-and-send` (done)
- **Consumed by:** `subscription-invoice-email-03-hardening`
- **Canonical product docs:** wait for step 03 (do not edit `docs/product/` here)
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/billing && bun test`; `cd packages/email && bun test`
