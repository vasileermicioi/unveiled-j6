## Why

Steps 01–02 shipped `sendSubscriptionInvoice`, `downloadStripeInvoicePdf`, Checkout locale metadata, and the post-`applyStripeEvent` webhook send, but canonical product docs still describe Resend as booking/waitlist-only and `invoice.paid` as refill-only. Until Gherkin, extras, i18n, coverage matrix, and `DEPLOYMENT.md` match that send, operators can double-mail members via Stripe Dashboard emails and the parent feature cannot close.

## What Changes

- Add Gherkin **Subscription invoice email after first successful payment** to `docs/product/features/credits-subscription.feature` (Playwright-ready title) plus a short DECISIONS note.
- Update `extras/integrations-and-config.md`: Resend also sends the first-paid-subscription invoice PDF; `invoice.paid` purpose split — `subscription_cycle` = refill only; `subscription_create` = invoice email, no second refill. Do not add new Dashboard webhook event types.
- Add a transactional invoice-email section to `extras/content-i18n-inventory.md` with verbatim DE/EN copy from step 01.
- Log a Payments & billing row in `extras/gaps-and-decisions.md`.
- Update `apps/web/DEPLOYMENT.md`: Checkout → webhook → Resend-with-PDF smoke; instruct operators to **disable Stripe Dashboard customer invoice/receipt emails** in test + live; no new secrets.
- Coverage matrix: new scenario → Playwright `skip` with the same “no inbox harness; staging Resend checklist” rationale as booking confirmation. Add a skipped `test("Scenario: …")` in `e2e/specs/credits-subscription.spec.ts` (file-mapping rule). Do **not** add Mailosaur or an inbox harness.
- Audit unit tests from steps 01–02; add only missing skip / idempotency / copy / cycle-does-not-send cases (likely `missing_recipient`; copy/send/idempotency/cycle already exist).
- Mark step 03 done and the parent feature released. Prefer `docs/product/` as SoT; sync `openspec/specs/credits-subscription/spec.md` only via this change’s delta / archive, not as a parallel product spec.
- Out of scope: new UI routes, R2 storage, new env vars, Partner emails, renewal invoice emails, changing the Stripe Dashboard webhook event list.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `credits-subscription`: Product Gherkin, integrations extras, i18n inventory, decisions log, coverage matrix, and `DEPLOYMENT.md` SHALL describe the first-paid-subscription invoice email (Stripe PDF attachment, `SITE_URL` links, DE/EN copy, post-apply send, no renewal send). Staging operators SHALL be told to disable Stripe Dashboard customer invoice/receipt emails. Playwright MAY skip inbox assertion with an explicit no-harness reason; unit tests remain the default proof.

## Impact

- **Product SoT:** `docs/product/features/credits-subscription.feature`, `docs/product/extras/integrations-and-config.md`, `docs/product/extras/content-i18n-inventory.md`, `docs/product/extras/gaps-and-decisions.md`, `docs/product/testing/coverage-matrix.md`, `apps/web/DEPLOYMENT.md`.
- **E2E:** `e2e/specs/credits-subscription.spec.ts` — one skipped Scenario test (no inbox harness). Pattern: `e2e/specs/booking.spec.ts` `Scenario: Booking confirmation email`.
- **Runtime:** no intended behavior change. Steps 01–02 already send after `invoice.paid` + `subscription_create`. Close unit-test gaps only if an audit finds missing skip/idempotency/copy cases.
- **Env / Stripe Dashboard:** reuse existing Resend + Stripe secrets. Operators must turn off Stripe-hosted customer invoice/receipt emails so members are not double-mailed. Webhook event list stays the same five events.
- **Parent close-out:** `.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md` mark `subscription-invoice-email-03-hardening` done; walk Release Criteria.
- **Source brief:** `.dev-plan/current-iteration/subscription-invoice-email-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`
- **Depends on:** `subscription-invoice-email-02-stripe-pdf-and-webhook` (done / archived)
- **Consumed by:** closes the subscription-invoice-email parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/email && bun test`; `cd packages/billing && bun test`; grep `docs/product` for the scenario title and confirm `integrations-and-config.md` mentions invoice PDF email on `subscription_create` only
