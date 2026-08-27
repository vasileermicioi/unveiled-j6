## Context

See `proposal.md` for motivation. Parent feature: subscription invoice email (`.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`), step 02 of 03. Step 01 is done: `sendSubscriptionInvoice` / `buildSubscriptionInvoiceContent` exist on `@unveiled/email` and do not import Stripe.

Current billing/webhook state:

- `applyStripeEvent` in `packages/billing/src/webhooks.ts` handles `checkout.session.completed` (activation + refill), `invoice.paid` only when `billing_reason === "subscription_cycle"` (renewal refill), payment failed, and subscription updated/deleted. Non-cycle `invoice.paid` returns `{ handled: false, action: "ignored_invoice_paid_reason" }` — first payment does **not** write credits (avoids double refill with Checkout).
- `apps/web/app/lib/stripe-webhook.ts` verifies the signature, calls `applyStripeEvent`, returns HTTP 200 or 500. No email today.
- `createCheckoutSession` sets `metadata.userId` and `subscription_data.metadata.userId` only — no locale.
- `invoice_pdf` is a short-lived Stripe-hosted URL on **finalized** invoices. Do not persist the URL.
- Booking/waitlist mail skip when Resend env is unset (`console.warn`, no throw). Invoice mail follows that skip for missing env, but **unlike** booking mail, transient send/download failures after env + PDF URL exist MUST 500 so Stripe retries.

Constraints: `@unveiled/billing` MUST NOT depend on `@unveiled/email`. Do not store PDFs in R2/Postgres. No new env vars. Product Gherkin / `DEPLOYMENT.md` wait for step 03. Cloudflare Workers runtime (no Node-only APIs in the PDF path).

## Goals / Non-Goals

**Goals:**

- Download Stripe invoice PDF bytes in `@unveiled/billing`; send via existing `@unveiled/email` helper; orchestrate in `apps/web` **after** a successful `applyStripeEvent`.
- One email per Stripe invoice id for `subscription_create` only; retries are idempotent.
- Keep credit ledger / activation behavior identical (`applyStripeEvent` first and unchanged).
- Stamp Checkout locale so the webhook can localize without a request URL.

**Non-Goals:**

- Changing `applyStripeEvent`'s `invoice.paid` credit rules (cycle-only refill stays).
- Renewal / `subscription_cycle` emails, other `billing_reason` values, or `checkout.session.completed` mail.
- Canonical `docs/product/` / Gherkin / `DEPLOYMENT.md` (step 03).
- A member-facing invoice list or R2 archive.
- Extracting a shared `EmailLocale` type.

## Decisions

1. **Domain split: billing = bytes, email = copy, web = orchestrate**
   - `packages/billing/src/invoice-pdf.ts` (name may vary) exports `downloadStripeInvoicePdf`.
   - `apps/web/app/lib/subscription-invoice-email.ts` (thin orchestrator) is called from `stripe-webhook.ts` **after** `applyStripeEvent` returns.
   - `@unveiled/web` already depends on both packages. Do **not** add `@unveiled/email` to `@unveiled/billing`.
   - **Rationale:** AGENTS.md package boundaries; step plan forbids billing→email.
   - **Alternatives:** Put send inside `applyStripeEvent` (rejected — billing would import email and mix ledger writes with Resend); inline fetch in the webhook file (rejected — one-off Stripe I/O in a route helper).

2. **Always retrieve the invoice before downloading the PDF**
   - `downloadStripeInvoicePdf({ stripe, invoiceId, fetchImpl? })` always calls `stripe.invoices.retrieve(invoiceId)`, then `fetch`es **that** `invoice_pdf` URL. Do not use the webhook payload URL (it can be missing or stale).
   - Filename: `invoice-${invoice.number ?? invoice.id}.pdf`.
   - Convert `arrayBuffer` → base64 with a Workers-safe loop + `btoa` (same pattern as `utf8ToBase64` in booking confirmation), not Node `Buffer`.
   - Typed result, e.g. `{ ok: true, pdfBase64, filename, invoice }` | `{ ok: false, reason: "missing_pdf_url" | "retrieve_failed" | "fetch_failed", status?: number }`. Mock `stripe.invoices.retrieve` and `fetchImpl` in tests.
   - **Rationale:** Spec requires a freshly retrieved URL; retrieve also yields current metadata + number.
   - **Alternatives:** Fetch the event object's URL when present (rejected — stale/expired); cache URL in Postgres (out of scope).

3. **Webhook HTTP flow: apply first, then maybe-send**
   - Keep today's verify → `applyStripeEvent` → 200/500 for apply failures.
   - After apply succeeds (including `ignored_invoice_paid_reason`), if `event.type === "invoice.paid"` and `billing_reason === "subscription_create"`, run the orchestrator.
   - Orchestrator outcomes:
     - **skip** (missing env, missing recipient, null `invoice_pdf`, already `unveiled_invoice_email=sent`, wrong billing reason): log, HTTP **200** with apply JSON (optionally `invoiceEmail: "skipped"`).
     - **sent**: stamp metadata, HTTP **200**.
     - **retry** (PDF fetch HTTP failure, Resend `{ ok: false }` or throw, Stripe retrieve/update network error after env+URL exist): log, HTTP **500** so Stripe retries. Apply has already finished; `subscription_create` does not refill, so retries cannot duplicate credits.
   - Do not send on `subscription_cycle`, `subscription_update`, `checkout.session.completed`, or `invoice.payment_failed`.
   - **Rationale:** Email failure must not roll back billing; Stripe retries need a 5xx; missing PDF must not 500 forever.
   - **Alternatives:** Always 200 and log (no retry — members silently miss invoices); send inside the apply transaction (rejected).

4. **Idempotency: Stripe invoice metadata is the source of truth**
   - After Resend `ok`, `stripe.invoices.update` with **merged** metadata `{ ...existing, unveiled_invoice_email: "sent" }` (Stripe replaces the whole metadata object if you pass a partial object).
   - Skip when retrieved invoice already has `unveiled_invoice_email === "sent"`.
   - Also add optional `idempotencyKey` on `sendResendEmail` / `sendSubscriptionInvoice` that sets header `Idempotency-Key` (invoice id). This is a few lines on the existing client — not a large refactor — and covers the race of two in-flight Stripe retries before metadata is written. If threading the header proves messy, metadata alone still satisfies the step.
   - **Rationale:** Step plan; no new DB table.
   - **Alternatives:** Store sent flag in Postgres (rejected — extra schema, step 03/non-goal); Resend key only (weaker if Resend is skipped/unset).

5. **Recipient and locale resolution (orchestrator, not billing)**
   - **To:** `invoice.customer_email` if non-empty, else `subscriptionIdFromInvoice` → `subscriptions.userId` → `public.users.email`. If still missing, skip (200).
   - **Locale:** Stripe subscription metadata `locale` (`de` | `en`) → else `users.profile.language` (`EN` → `en`, otherwise `de`) → else `de`. Retrieve the Stripe subscription when metadata is not already on the invoice's subscription_details. Prefer the Checkout-stamped value so the email matches the UI the member used, not onboarding `preferred_languages`.
   - **siteUrl:** `getSiteUrl()` (no trailing slash).
   - Inject DB lookup / Stripe retrieve in the orchestrator so unit tests do not need a live DB.
   - **Rationale:** Step plan; webhook has no `/:locale` param.
   - **Alternatives:** Always `de` (wrong for EN Checkout); use `preferred_languages[0]` (event-interest field, not UI locale).

6. **Checkout stamps `subscription_data.metadata.locale`**
   - `CreateCheckoutSessionInput` adds `locale: "de" | "en"`.
   - `subscription_data.metadata` becomes `{ userId, locale }`. Session-level `metadata` can stay `{ userId }` (activation already uses `client_reference_id` / session `userId`).
   - `membership.tsx` POST already has `locale` from `getLocaleParam` — pass it through.
   - Existing subscriptions created before this ships have no locale metadata; fallback chain in decision 5 covers them if a late `subscription_create` invoice is retried (unlikely) and is required for correctness of the fallback anyway.
   - **Rationale:** Spec modified requirement.
   - **Alternatives:** Put locale only on Checkout Session metadata (invoice webhook does not carry the session); cookie/header on webhook (none).

7. **Tests**
   - **Billing:** mock `invoices.retrieve` + `fetchImpl` — success (base64 + filename from number; uses retrieved URL not a stale one), `missing_pdf_url`, fetch 5xx. Checkout mock: `subscription_data.metadata.locale`. Existing `applyStripeEvent` cycle refill / ignore-non-cycle tests still pass (add an explicit `subscription_create` → `ignored_invoice_paid_reason` assertion if missing).
   - **Web orchestrator:** injected mocks — `subscription_create` calls download+send; `subscription_cycle` does not; metadata already `sent` does not send; missing env skips (not retry); missing PDF skips; send/download failure returns retry.
   - **Email:** existing tests stay green; if `Idempotency-Key` is added, assert the header on the mocked fetch.
   - No live Stripe/Resend.

8. **Logging**
   - Warn/error with `invoiceId`, `billing_reason`, skip/retry reason, Resend status. Never log PDF bytes, Resend API key, or raw `invoice_pdf` query strings if they contain secrets.

## Risks / Trade-offs

- **[Risk] Stripe webhook ~30s timeout** → Mitigation: sequential retrieve + PDF GET + Resend only; no R2 upload; PDFs are small. If this still times out in production, step 03 can document a follow-up (queue) — do not add a queue here.
- **[Risk] Two concurrent Stripe retries both pass the metadata check** → Mitigation: Resend `Idempotency-Key` = invoice id plus metadata stamp after success. Worst case: two identical receipts, still better than silently dropping.
- **[Risk] `invoices.update` metadata clobber** → Mitigation: merge existing `invoice.metadata`.
- **[Risk] Stripe Dashboard also emails invoices** → Mitigation: known parent-guide risk; step 03 documents disabling Stripe customer invoice/receipt emails. Do not change Dashboard from this step.
- **[Risk] `invoice_pdf` null on a paid invoice** → Mitigation: skip + log (200), not 500, so Stripe does not retry forever. Operators can resend later in step 03 notes if needed.
- **[Trade-off] HTTP 500 after successful apply** → Stripe retries the whole event; safe because `subscription_create` does not refill. Do not 500 on other event types from this orchestrator.
- **[Trade-off] Hard-coded metadata key `unveiled_invoice_email=sent`** → Document in a code constant; step 03 can mention it in operator docs.

## Migration Plan

1. Land billing helper + Checkout locale + webhook orchestrator + tests. No schema migration, no new secrets.
2. Deploy: existing Checkout sessions created before deploy will not have `locale` on the subscription; fallback to `profile.language` then `de`. New Checkouts after deploy stamp locale.
3. Run `cd packages/billing && bun test`, `cd packages/email && bun test`, then repo `bun run lint` and `bun run typecheck`.
4. Mark this step done in the parent guide (do not edit `docs/product/`).
5. Rollback: revert the app/package commit. In-flight metadata `sent` flags on Stripe invoices are harmless if send code is removed.

## Open Questions

- None blocking. Whether to thread Resend `Idempotency-Key` is an apply-time preference with a default of **yes** if it stays a small header on `sendResendEmail`.
