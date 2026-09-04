## 1. Setup and prerequisite check

- [x] 1.1 Confirm step 01 conventions and cancel-path prerequisites exist by reading `packages/email/src/subscription-invoice.ts`, `send-subscription-invoice.ts`, `resend-client.ts`, `index.ts`, `apps/web/app/lib/subscription-invoice-email.ts`, `stripe-webhook.ts`, and `packages/billing/src/{webhooks,subscription-lifecycle,cancel-subscription}.ts`, verified by listing the exact files and trigger points for the task summary
- [x] 1.2 Confirm spec/design contract (subjects, transition-only trigger, skip/retry mapping, exclusions) matches this change's specs and design, verified by quoting the requirement name and trigger predicate in the implementation notes

## 2. Cancellation content and sender

- [x] 2.1 Add `packages/email/src/subscription-cancellation.ts` (`buildSubscriptionCancellationContent`, DE/EN, subjects `Deine Unveiled Berlin Mitgliedschaft endet` / `Your Unveiled Berlin membership is ending`, Berlin locale-formatted end date, unused-credits-expire + tickets-valid notes, resubscribe `/{locale}/membership` + billing/support links, text mirror, escaped mail-client-safe table HTML), verified by unit test asserting both locales' subjects, end date, expiry note, links, and text/HTML parity
- [x] 2.2 Add `packages/email/src/send-subscription-cancellation.ts` (same `sendResendEmail` wrapper shape: `apiKey/from/toEmail/locale/siteUrl/endDate/resubscribeUrl`, optional `idempotencyKey` = Stripe event id, `fetchImpl` injection, no attachment, never throws on HTTP errors) plus index exports, verified by unit test with mocked fetch asserting Resend payload and `Idempotency-Key` header

## 3. Webhook orchestrator and wiring

- [x] 3.1 Add cancellation orchestrator beside the invoice one (post-`applyStripeEvent`, fires only on the transition into `CANCELLED_PENDING`, skips already-pending/deleted/freeze-unfreeze/past-due/non-cancel events and missing env/recipient with HTTP 200 semantics, retries transient failures with HTTP 500 semantics, never throws into the ledger apply; reuses subscription lookup, locale rule, `DAILY_CODES_FROM_EMAIL`, `getSiteUrl()`), verified by unit tests covering transition-only send, already-pending no-resend, deletion/freeze/past-due skips, missing env/recipient skips, and send-failure retry without throw
- [x] 3.2 Wire the orchestrator into `apps/web/app/lib/stripe-webhook.ts` alongside `maybeSendSubscriptionInvoiceEmail` (ledger result still returned; `retry` maps to HTTP 500, `sent`/`skipped` to HTTP 200), verified by webhook-level test or manual probe showing a scheduled-cancel event returns the cancellation result while invoice/deletion events are unaffected

## 4. Verification

- [x] 4.1 Run `bun run lint` and verify it exits 0
- [x] 4.2 Run `bun run typecheck` and verify it exits 0
- [x] 4.3 Run `bun test packages/email` and verify it exits 0 with the new cancellation content + send cases green
- [x] 4.4 Run `bun test packages/billing` and verify it exits 0 with webhook apply paths unchanged
