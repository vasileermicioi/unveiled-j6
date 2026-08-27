## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/subscription-invoice-email-03-hardening.md`, parent guide Release Criteria / non-goals, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 02 artifacts exist: `sendSubscriptionInvoice` / `buildSubscriptionInvoiceContent`, `downloadStripeInvoicePdf`, `maybeSendSubscriptionInvoiceEmail`, Checkout `subscription_data.metadata.locale`, webhook post-apply send
- [x] 1.3 Skim stale surfaces: `credits-subscription.feature` (no invoice-email scenario); `integrations-and-config.md` Resend = booking/waitlist only and `invoice.paid` = cycle refill only; i18n inventory missing invoice copy; `DEPLOYMENT.md` webhook table + smoke; coverage matrix missing the new scenario

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/credits-subscription.feature`: DECISIONS note (Unveiled branded invoice email with Stripe PDF after first paid invoice; no renewal send; disable Stripe Dashboard customer invoice/receipt emails); add `Scenario: Subscription invoice email after first successful payment` immediately after Checkout activation (WHEN Checkout succeeds AND first invoice paid THEN PDF email + instructions/links + no rollover). Do not add an operator-docs Scenario to the feature file
- [x] 2.2 Update `docs/product/extras/integrations-and-config.md`: Resend row includes first-paid-subscription invoice PDF email; `invoice.paid` purpose split (`subscription_cycle` = refill; `subscription_create` = invoice email, no second refill). Same five Dashboard events
- [x] 2.3 Add a **Transactional emails — subscription invoice** section to `docs/product/extras/content-i18n-inventory.md` with verbatim EN/DE subjects and bodies from step 01 (no-rollover wording, `{SITE_URL}/{locale}/…` links, `support@unveiled.berlin`); cite `packages/email/src/subscription-invoice.ts`
- [x] 2.4 Add a Payments & billing row to `docs/product/extras/gaps-and-decisions.md`: first-paid-subscription invoice email via Resend + Stripe PDF; Dashboard customer invoice/receipt emails off to avoid duplicates; no renewal send
- [x] 2.5 Update `apps/web/DEPLOYMENT.md`: `invoice.paid` purpose split; `DAILY_CODES_FROM_EMAIL` also sends the invoice; staging smoke Checkout → Resend invoice with `invoice-*.pdf`; instruct turning off Stripe-hosted customer invoice/receipt emails in **test and live**; no new secrets; do not rewrite the event-voucher PDF in-app-download note

## 3. Playwright, coverage matrix, and unit-test gaps

- [x] 3.1 Add `test("Scenario: Subscription invoice email after first successful payment")` in `e2e/specs/credits-subscription.spec.ts` immediately after Checkout activation; `test.skip(true, "No email capture harness in Playwright; assert via Resend dashboard on staging smoke (DEPLOYMENT.md Phase 6)")`; no Mailosaur / inbox harness
- [x] 3.2 Update `docs/product/testing/coverage-matrix.md`: new credits-subscription row `skip` (no inbox harness; staging Resend; unit tests in email/billing/orchestrator); add a Phase 8 named-deferral line next to Booking confirmation email
- [x] 3.3 Audit unit tests (copy, skip, idempotency, cycle-does-not-send). Add only missing cases — likely `missing_recipient` skip in `apps/web/app/lib/subscription-invoice-email.test.ts`. Do not duplicate already-passing 01–02 tests

## 4. Cleanup and parent close-out

- [x] 4.1 Grep `docs/product` and `apps/web/DEPLOYMENT.md` for stale wording (Resend booking/waitlist-only, `invoice.paid` refill-only with no `subscription_create` email mention)
- [x] 4.2 Confirm `docs/product` contains the scenario title and `integrations-and-config.md` mentions invoice PDF email on `subscription_create` only (cycle still refill-only, no second refill)
- [x] 4.3 Mark `subscription-invoice-email-03-hardening` done in `.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md` and walk parent **Release Criteria** (feature released). Canonical SoT is `docs/product/`; do not treat `openspec/specs/` as product behavior; no new AGENTS.md rule

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run `cd packages/email && bun test` — exits 0
- [x] 5.4 Run `cd packages/billing && bun test` — exits 0
- [x] 5.5 Prepare PR/handoff linking this change ID and the parent guide
