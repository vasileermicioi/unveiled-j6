## Why

Cancelling today is silent: the scheduled-cancel path (`cancel_at_period_end` → `CANCELLED_PENDING`) updates status and ledger but sends no mail, leaving members unsure when access ends and what happens to unused credits and tickets.

## What Changes

- Add a branded, mail-client-safe unsubscribe email (DE/EN) stating the Berlin access-until date, that unused credits expire at period end, that tickets stay valid until end, plus a resubscribe CTA (`/{locale}/membership`) and billing/support links with a plain-text mirror.
- Wire the send post-`applyStripeEvent` in the webhook path: fire exactly once on the transition into `CANCELLED_PENDING` (Resend `Idempotency-Key` = Stripe event id; already-pending → no resend).
- Apply skip-vs-retry semantics: skip+log with HTTP 200 on missing Resend env/recipient, non-cancel events, or admin `UNPAID` freeze; HTTP 500 retry on transient send failures; never throw into or roll back the ledger apply. `customer.subscription.deleted` → `INACTIVE` expiry sends nothing.

## Capabilities

### New Capabilities

- None — this change adds a requirement to an existing capability.

### Modified Capabilities

- `credits-subscription`: add single-unsubscribe-email-on-scheduled-cancel requirement (transition into `CANCELLED_PENDING` only; exactly-once; skip/retry contract; no mail on final `INACTIVE` expiry or admin freeze).

## Impact

- `packages/email/src/`: new `subscription-cancellation.ts` content builder + `send-subscription-cancellation.ts` sender (same `sendResendEmail` wrapper shape), index exports, unit tests with mocked fetch. Email package stays Stripe-free; From = `DAILY_CODES_FROM_EMAIL`; no new secrets.
- `apps/web/app/lib/`: new cancellation orchestrator beside `subscription-invoice-email.ts` (`maybeSendSubscriptionCancellationEmail`) + `stripe-webhook.ts` wiring post-`applyStripeEvent`; reuses `getSiteUrl()`, subscription lookup (`subscriptions.userId` → `users.email` + `profile.language`), and locale rule (metadata → profile → `de`).
- `packages/billing/src/`: no lifecycle changes — cancel/billing semantics (`CANCELLED_PENDING` → `INACTIVE` + `EXPIRY`, `UNPAID` freeze) untouched; webhook apply paths unchanged.
