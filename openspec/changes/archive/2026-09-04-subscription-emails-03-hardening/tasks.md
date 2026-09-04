## 1. Setup

- [x] 1.1 Read the step plan `.dev-plan/current-iteration/12-subscription-emails-03-hardening.md`, the parent guide `09-subscription-emails-parent-guide.md` release criteria, and this change's proposal/design/specs, and verify steps 01–02 sends exist (`subscription-invoice-email.ts`, `subscription-cancellation-email.ts`, `stripe-webhook.ts` post-apply wiring)
- [x] 1.2 Skim stale surfaces (`credits-subscription.feature` invoice-only note, `content-i18n-inventory.md` transactional-emails invoice-only section, `integrations-and-config.md` Resend row, `coverage-matrix.md` + `e2e/specs/credits-subscription.spec.ts` + `e2e/README.md`, `DEPLOYMENT.md` webhook table/smoke) and verify the 9-row webhook matrix is testable

## 2. Webhook matrix verification

- [x] 2.1 Audit `maybeSendSubscriptionInvoiceEmail` + `maybeSendSubscriptionCancellationEmail` against the matrix (`checkout.session.completed`→no mail; `invoice.paid`+`subscription_create`→once with `sent` metadata + event-id key; `subscription.updated`→once on entering `CANCELLED_PENDING`, already-pending→no resend; `deleted`→no mail; freeze/past-due→no cancel mail; missing env/recipient→skip 200; transient→500 retry) and verify each row maps to an existing unit case in `subscription-invoice-email.test.ts` / `subscription-cancellation-email.test.ts` or `packages/email` + `packages/billing` suites
- [x] 2.2 Add only missing matrix cases (likely `missing_recipient` skip, already-pending no-resend, `deleted`-no-mail) with mocked fetch/Stripe objects and verify `bun test packages/email packages/billing` passes with no new live-network dependency

## 3. Staging delivery proof

- [x] 3.1 Run staging proof via `stripe listen --forward-to <staging>/api/webhooks/stripe` + test Checkout (card `4242…`) and verify Resend dashboard shows the invoice mail with `invoice-*.pdf` and correct locale links
- [x] 3.2 Run cancel-at-period-end on staging and verify Resend shows exactly one unsubscribe mail with Berlin end date + `/{locale}/membership` links, then confirm period expiry / `customer.subscription.deleted` sends nothing, and record both Resend message IDs in the handoff (no secrets)

## 4. Docs and e2e sync

- [x] 4.1 Update `docs/product/features/credits-subscription.feature` (professional-mail note + resub reuse on the invoice scenario; add `Scenario: Cancelling member is told access runs until period end` + no-mail-at-expiry line with verbatim titles) and verify Gherkin titles match the Playwright titles exactly
- [x] 4.2 Update `docs/product/extras/content-i18n-inventory.md` (new cancellation block with verbatim DE/EN subjects/body lines citing `subscription-cancellation.ts`; extend invoice block only on drift) + `docs/product/extras/integrations-and-config.md` Resend row (unsubscribe once on `CANCELLED_PENDING`, nothing on `deleted`) and verify `grep` shows no invoice-only / booking-waitlist-only stale wording
- [x] 4.3 Update `apps/web/DEPLOYMENT.md` (resub + cancel smoke steps, keep test+live Dashboard-OFF instruction, 5-event table unchanged) + `e2e/specs/credits-subscription.spec.ts` resub/cancel scenarios (opt-in `E2E_STRIPE_CHECKOUT=1` skip, seeded `CANCELLED_PENDING`/`INACTIVE` otherwise, proximity selectors) + `coverage-matrix.md` + `e2e/README.md` (both rows `skip` with no-inbox-harness / staging-Resend rationale) and verify matrix titles point at the spec titles

## 5. Verification

- [x] 5.1 Run `bun run lint` and verify it exits 0
- [x] 5.2 Run `bun run typecheck` and verify it exits 0
- [x] 5.3 Run `bun test packages/email packages/billing` and verify it exits 0
- [x] 5.4 Confirm staging IDs are recorded and prepare a PR/handoff linking this change ID and the parent guide, and verify the parent `09-subscription-emails-parent-guide.md` can be marked done
