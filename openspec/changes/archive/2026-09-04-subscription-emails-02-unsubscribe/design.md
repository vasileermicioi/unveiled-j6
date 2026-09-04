## Context

See proposal.md (Why) for motivation. Current state: `handleBillingCancelPost` sets Stripe `cancel_at_period_end` (via `cancelSubscriptionAtPeriodEnd`, same `applySubscriptionUpdated` writer the webhook uses); the webhook `customer.subscription.updated` → `CANCELLED_PENDING` path in `applyStripeEvent` sends no mail. Step 01 established the conventions to reuse: branded table-based mail layout with inline styles (600px, system-font stack, `mailto:support@unveiled.berlin`), DE/EN content builders with text mirror and escaped interpolation, `sendResendEmail` wrapper with `Idempotency-Key` + `fetchImpl` injection, post-`applyStripeEvent` orchestrator in `apps/web/app/lib/` returning `sent | skipped | retry`, and HTTP mapping (skip → 200, retry → 500, never throw into the ledger apply). Recipient pattern (`invoice.customer_email` else `users.email` via `subscriptions.userId`), locale rule (subscription metadata `locale` → `profile.language` → `de`), `DAILY_CODES_FROM_EMAIL` From, and `getSiteUrl()` origin are all in place beside the invoice orchestrator.

## Goals / Non-Goals

**Goals:**
- Exactly-one unsubscribe mail on the scheduled-cancel transition, reusing step 01 layout/locale/idempotency conventions with no new secrets.
- Skip-vs-retry wiring that never blocks or rolls back the ledger apply.

**Non-Goals:**
- Changing the cancel/billing lifecycle itself (`CANCELLED_PENDING` → `INACTIVE` + `EXPIRY`, `UNPAID` freeze semantics) — webhook apply paths stay untouched.
- Invoice-mail trigger changes, subject changes to the invoice mail, docs/e2e/i18n-inventory updates (step 03).

## Decisions

- **Content builder mirrors the invoice builder.** New `packages/email/src/subscription-cancellation.ts` (`buildSubscriptionCancellationContent`) copies the `subscription-invoice.ts` shape — `BuildSubscriptionCancellationInput { locale, siteUrl, endDate }`, branded `invoiceHtml`-style table, preheader/header/summary/CTAs/footer, text mirror, `escapeHtml` on all interpolations. Alternative (shared generic layout helper) rejected: step scope is one mail, and a shared abstraction now would churn the just-hardened invoice builder.
- **Copy contract fixed per step plan.** Subjects `Deine Unveiled Berlin Mitgliedschaft endet` / `Your Unveiled Berlin membership is ending`; body carries the Europe/Berlin locale-formatted access-until date, unused-credits-expire note, tickets-valid-until-end note, resubscribe CTA (`/{locale}/membership`) + billing/support links. Alternative (minimal one-liner) rejected: parent guide requires the professional summary + next-step parity with the subscribe mail.
- **Sender mirrors `sendSubscriptionInvoice`.** New `send-subscription-cancellation.ts` takes `apiKey/from/toEmail/locale/siteUrl/endDate/resubscribeUrl` + optional `idempotencyKey` (= Stripe event id) + `fetchImpl`, no PDF attachment, returns the Resend result without throwing on HTTP errors. Email package stays Stripe-free. Alternative (folding into the invoice sender) rejected: different payload (date/links, no attachment) and trigger.
- **Orchestrator sits beside the invoice one, runs post-apply.** New `maybeSendSubscriptionCancellationEmail` in `apps/web/app/lib/` runs after `applyStripeEvent` returns, alongside `maybeSendSubscriptionInvoiceEmail` in `stripe-webhook.ts`. It fires only when the event is `customer.subscription.updated` whose applied result transitioned into `CANCELLED_PENDING` (skip when the subscription was already pending — idempotent by construction plus Resend key). It explicitly ignores `customer.subscription.deleted`, freeze/unfreeze (`UNPAID`), past-due, and all non-cancel events. Alternative (sending from `handleBillingCancelPost` directly) rejected: the POST path may precede webhook confirmation and would double-send with webhook retries; post-apply is the single send point.
- **Recipient + locale reuse invoice resolution.** Recipient = subscription-lookup email (via `stripeSubscriptionId` → `subscriptions.userId` → `users.email`, falling back to Stripe object email where present); locale = subscription metadata `locale` → `profile.language` (`EN`→`en` else `de`). Alternative (request locale) rejected: webhooks have no request URL; metadata stamping is the established channel.
- **Skip (200) vs retry (500) mapping.** Skip+log: non-cancel event, already-pending, missing env/recipient, admin `UNPAID`. Retry (500): transient Resend/download/lookup failures and send-throw — without rolling back `applyStripeEvent`. The orchestrator never throws; the handler maps `retry` → 500 so Stripe redelivers. Alternative (always 200) rejected: transient failures would silently lose the one mail with no redelivery.

## Risks / Trade-offs

- [Risk] Stripe redelivers the same `customer.subscription.updated` event after a successful send → double mail. → Mitigation: Resend `Idempotency-Key` = event id plus already-pending guard; send is post-commit only.
- [Risk] `periodEnd` missing on the Stripe object → mail without an access-until date. → Mitigation: fall back to the stored subscription `periodEnd` (same `periodEndFromSubscription` helper family); skip+log only if no date is resolvable, still HTTP 200 so billing is unaffected.
- [Risk] Local `applySubscriptionUpdated` no-op (row missing) but event is a genuine cancel → mail to a recipient we cannot resolve. → Mitigation: skip+log (200); booking/billing state is untouched and the member still sees status on next login.
- [Risk] Confusing the scheduled-cancel mail with final-expiry or freeze states. → Mitigation: trigger predicate matches only the transition into `CANCELLED_PENDING`; deletion/`UNPAID`/past-due paths return `skipped` with distinct reasons, covered by unit tests.

## Migration Plan

- Additive only: two new email-package modules + one new orchestrator + handler wiring; no schema, env, or lifecycle migration. Deploy with existing `RESEND_API_KEY` / `DAILY_CODES_FROM_EMAIL`; when unset, the path skips with HTTP 200 by design.
- Rollback: revert the change; ledger/billing state is unaffected (send is post-commit, no ledger writes added).
- Verification: `bun run lint`, `bun run typecheck`, `bun test packages/email` (new cancellation content + send cases), `bun test packages/billing` (webhook apply paths unchanged).
