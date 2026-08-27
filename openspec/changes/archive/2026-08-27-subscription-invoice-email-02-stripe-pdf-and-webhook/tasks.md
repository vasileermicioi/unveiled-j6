## 1. Setup

- [x] 1.1 Confirm step 01 exports exist: `sendSubscriptionInvoice`, `buildSubscriptionInvoiceContent` from `@unveiled/email`; `applyStripeEvent` / `subscriptionIdFromInvoice` in `packages/billing/src/webhooks.ts`; `createCheckoutSession`; `apps/web/app/lib/stripe-webhook.ts`; `membership.tsx`; `getSiteUrl()`; `users.email` + `users.profile.language`
- [x] 1.2 Skim parent guide release criteria and non-goals (no R2/Postgres PDF store, no renewal emails, no `docs/product/`, no new secrets, billing MUST NOT import `@unveiled/email`)

## 2. Invoice PDF download (`@unveiled/billing`)

- [x] 2.1 Add `downloadStripeInvoicePdf({ stripe, invoiceId, fetchImpl? })` that always `invoices.retrieve`s, then GETs the retrieved `invoice_pdf` URL (never the webhook payload URL)
- [x] 2.2 Return `{ ok: true, pdfBase64, filename, invoice }` with `filename` `invoice-${number ?? id}.pdf` and Workers-safe `arrayBuffer` → base64 (`btoa`, not Node `Buffer`); typed `{ ok: false, reason: "missing_pdf_url" | "retrieve_failed" | "fetch_failed", status? }` otherwise
- [x] 2.3 Export the helper and types from `packages/billing/src/index.ts`; do not add `@unveiled/email` as a billing dependency

## 3. Checkout locale metadata

- [x] 3.1 Add `locale: "de" | "en"` to `CreateCheckoutSessionInput` and set `subscription_data.metadata` to `{ userId, locale }` (keep session `metadata.userId`)
- [x] 3.2 Pass the membership route locale from `apps/web/app/routes/[locale]/membership.tsx` into `createCheckoutSession`

## 4. Optional Resend Idempotency-Key

- [x] 4.1 If it stays a small header, add optional `idempotencyKey` on `sendResendEmail` / `sendSubscriptionInvoice` that sets `Idempotency-Key`; otherwise skip and rely on invoice metadata alone

## 5. Webhook orchestration (`apps/web`)

- [x] 5.1 Add `apps/web/app/lib/subscription-invoice-email.ts`: after guards, resolve toEmail (`invoice.customer_email` else `subscriptionIdFromInvoice` → `subscriptions.userId` → `users.email`), locale (subscription metadata `locale` → `users.profile.language` `EN`→`en` else `de` → `de`), and `getSiteUrl()`
- [x] 5.2 Skip+log (not retry) when Resend env unset, recipient missing, `invoice_pdf` null, or invoice metadata `unveiled_invoice_email=sent`; download+`sendSubscriptionInvoice` only for `invoice.paid` + `billing_reason === "subscription_create"`
- [x] 5.3 After Resend `ok`, `invoices.update` with **merged** metadata `{ ...existing, unveiled_invoice_email: "sent" }`; pass invoice id as Resend idempotency key if 4.1 landed
- [x] 5.4 In `stripe-webhook.ts`, call `applyStripeEvent` first (unchanged); then the orchestrator. Skip → HTTP 200 with apply result; retryable download/send/retrieve failure → HTTP 500; never send on `subscription_cycle`, `checkout.session.completed`, or failed payments. Do not throw past a successful apply in a way that duplicates refill

## 6. Tests

- [x] 6.1 Billing unit tests (mocked Stripe retrieve + mocked PDF `fetchImpl`, no live Stripe): success uses retrieved URL and expected filename; `missing_pdf_url`; fetch failure; Checkout session includes `subscription_data.metadata.locale`
- [x] 6.2 Assert existing `invoice.paid` cycle refill still applies and `subscription_create` still returns `ignored_invoice_paid_reason` (no extra refill)
- [x] 6.3 Orchestrator tests (injected mocks in `apps/web` and/or billing): `subscription_create` triggers download+send; `subscription_cycle` does not; second call with metadata already `sent` does not send; missing env skips (not retry); send/download failure returns retry
- [x] 6.4 Run `cd packages/billing && bun test` and `cd packages/email && bun test` after each major area

## 7. Cleanup and verification

- [x] 7.1 Run `bun run lint` — exits 0
- [x] 7.2 Run `bun run typecheck` — exits 0
- [x] 7.3 Confirm billing + email package tests still pass
- [x] 7.4 Mark `subscription-invoice-email-02-stripe-pdf-and-webhook` done in `.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`
- [x] 7.5 Do not edit `docs/product/` or AGENTS.md (canonical specs wait for step 03)
