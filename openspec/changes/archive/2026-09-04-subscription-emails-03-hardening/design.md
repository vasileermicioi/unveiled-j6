## Context

See proposal.md (Why) for motivation. Current state: step 01 professionalized `buildSubscriptionInvoiceContent` + `sendSubscriptionInvoice` (branded 600px table layout, DE/EN, neutral resub reuse, `email.test.ts` cases) and step 02 added `buildSubscriptionCancellationContent` + `sendSubscriptionCancellation` plus `maybeSendSubscriptionCancellationEmail` wired post-`applyStripeEvent` in `apps/web/app/lib/stripe-webhook.ts` (transition-into-`CANCELLED_PENDING` only, `Idempotency-Key` = Stripe event id, skip→200 / retry→500, never throws into the ledger apply). `maybeSendSubscriptionInvoiceEmail` (`apps/web/app/lib/subscription-invoice-email.ts`) already handles `invoice.paid` + `subscription_create` with `unveiled_invoice_email=sent` metadata. Constraints: `@unveiled/email` stays Stripe-free; From = `DAILY_CODES_FROM_EMAIL`; locale = subscription metadata `locale` → `profile.language` → `de`; Stripe Dashboard customer mails stay OFF in test+live; e2e stays opt-in (`E2E_STRIPE_CHECKOUT=1` + `stripe listen`), default CI seeds state. See `specs/credits-subscription/spec.md` for the normative release-coverage contract.

## Goals / Non-Goals

**Goals:**
- Verify the full webhook mail matrix (sends, once-only, skips, retries, no-mail cases) with unit tests as default proof.
- Produce staging delivery proof (Resend dashboard IDs for invoice + unsubscribe mails) via `stripe listen` + test Checkout/cancel/expiry.
- Sync Gherkin, i18n inventory, integrations config, coverage matrix, e2e README, and `DEPLOYMENT.md` so docs match what ships.

**Non-Goals:**
- Template redesign, subject changes, new triggers, Checkout/portal UI, renewal-send behavior, R2/new env vars (all out per step plan).

## Decisions

- **Matrix verification is a unit-test audit, not new runtime logic.** Walk the existing orchestrators against the 9-row matrix (`checkout.session.completed`→no mail; `invoice.paid`+`subscription_create`→once; `subscription.updated`→once on entering `CANCELLED_PENDING`, already-pending→no resend; `deleted`→no mail; freeze/past-due→no cancel mail; missing env/recipient→skip 200; transient→500 retry) and add only missing cases — likely `missing_recipient` / already-pending / `deleted`-no-mail gaps if not already covered in `subscription-invoice-email.test.ts` / `subscription-cancellation-email.test.ts` and `packages/email` + `packages/billing` suites. Alternative (new integration harness with live Stripe/Resend) rejected: step conventions forbid new live-network hard dependencies in unit tests.
- **Staging proof reuses the Phase 6 forward pattern.** `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (or staging URL) + test Checkout (card `4242…`) → assert Resend shows invoice mail with `invoice-*.pdf`; profile-billing cancel-at-period-end → assert single unsubscribe mail with correct locale links; wait for period expiry / `customer.subscription.deleted` → assert no further mail. Record both Resend message IDs in the handoff. Alternative (Mailosaur/inbox harness in Playwright) rejected: matches booking-confirmation precedent — no inbox harness, Resend dashboard is SoT.
- **Gherkin gets two minimal professional-mail updates, titles verbatim.** Extend the existing `Subscription invoice email after first successful payment` scenario note (branded layout + resub reuse) and add `Scenario: Cancelling member is told access runs until period end` (WHEN →`CANCELLED_PENDING` THEN unsubscribe mail with Berlin end date/expiry note/resubscribe link) plus a `no second mail at final expiry` line; short DECISIONS note covers Stripe-Dashboard-OFF. Alternative (new feature file) rejected: both mails belong to `credits-subscription.feature`.
- **i18n inventory mirrors the step-01 invoice section.** Add a `Transactional emails — subscription cancellation` block beside the existing invoice block with verbatim DE/EN subjects (`Deine Unveiled Berlin Mitgliedschaft endet` / `Your Unveiled Berlin membership is ending`) and body lines (access-until date, credits-expire, tickets-valid, `/{locale}/membership` resubscribe CTA, billing/support links), citing `packages/email/src/subscription-cancellation.ts`; extend the invoice block only if resub wording drifted. Alternative (link-only, no verbatim copy) rejected: inventory rule requires verbatim subjects/body lines.
- **Integrations + DEPLOYMENT stay surgical.** `integrations-and-config.md` Resend row gains the unsubscribe mail (`customer.subscription.updated` → `CANCELLED_PENDING` once; `deleted` → nothing) alongside the existing invoice-PDF line; `DEPLOYMENT.md` gains resub + cancel smoke steps (test subscribe → invoice+PDF; cancel → single mail; expiry → no mail) while keeping the test+live Dashboard-OFF instruction and the 5-event webhook table unchanged. Alternative (rewriting the webhook table) rejected: event list is stable.
- **E2E follows the opt-in/seed split.** New/updated `credits-subscription.spec.ts` scenarios (resub professional mail, single-unsubscribe) skip without `E2E_STRIPE_CHECKOUT=1` (same reason as Checkout activation) and otherwise assert seeded `CANCELLED_PENDING`/`INACTIVE` states with proximity selectors; `coverage-matrix.md` maps both to `skip` (no inbox harness; staging Resend; unit tests in email/billing/orchestrator) and `e2e/README.md` documents the opt-in + `stripe listen` flow next to the existing Checkout row. Alternative (driving hosted cancel in CI) rejected: needs webhook forwarding + secrets, same as Checkout.

## Risks / Trade-offs

- [Risk] Audit finds the matrix already fully covered → empty code diff looks like no-op. → Mitigation: the value is the verified matrix + staging IDs + docs sync; state the audit result explicitly in the handoff.
- [Risk] Staging Resend dashboard unavailable (keys/forwarding misconfigured) → no delivery proof. → Mitigation: keep unit tests as default proof; record the blocker with env reason and still land the docs sync (same deferral style as booking email).
- [Risk] Doc drift across 6 surfaces (feature, i18n, integrations, matrix, e2e README, DEPLOYMENT). → Mitigation: grep for stale wording (`booking/waitlist-only Resend`, `invoice.paid refill-only`, missing unsubscribe) before/after; verify scenario titles verbatim.
- [Risk] Double-mail if Stripe Dashboard customer emails are left on. → Mitigation: keep the OFF instruction in both test+live sections; staging proof explicitly checks only Unveiled mails appear.

## Migration Plan

- Docs + test-only change on top of steps 01–02 sends: no schema, env, or lifecycle migration. Deploy with existing `RESEND_API_KEY` / `DAILY_CODES_FROM_EMAIL`; unset → skip-200 by design.
- Rollback: revert docs/tests; ledger/billing unaffected (sends are post-commit, no ledger writes added).
- Verification: `bun run lint`, `bun run typecheck`, `bun test packages/email packages/billing`, plus staging subscribe/cancel/expiry with Resend IDs recorded.
