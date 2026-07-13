## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/waitlist-account-04-billing-portal-and-cancel.md`, parent guide, `proposal.md`, `design.md`, and delta specs
- [x] 1.2 Confirm step 03 `/profile` exists and links to `/:locale/profile/billing`
- [x] 1.3 Review `subscription-lifecycle.ts` EXPIRY / `cancelAtPeriodEnd` → `CANCELLED_PENDING` and existing `billing.test.ts` coverage
- [x] 1.4 Skim `docs/product/features/profile.feature` (billing + cancel) and `credits-subscription.feature` (portal recovery, cancel, period end)

## 2. Billing package — portal and cancel

- [x] 2.1 Add `createBillingPortalSession({ stripe, customerId, returnUrl })` (and types) in `@unveiled/billing`; export from package index
- [x] 2.2 Add `cancelSubscriptionAtPeriodEnd({ stripe, stripeSubscriptionId })` setting Stripe `cancel_at_period_end: true`
- [x] 2.3 After successful Stripe cancel update, align local status via `applySubscriptionUpdated` (and/or document webhook-only path) so UI reaches `CANCELLED_PENDING` without a parallel status writer
- [x] 2.4 Document portal/cancel helpers + Customer Portal dashboard config notes in `packages/billing` README or handoff comment for step 05

## 3. Package tests

- [x] 3.1 Unit-test portal session creation with Stripe mocked (`billingPortal.sessions.create`)
- [x] 3.2 Unit-test cancel helper sets `cancel_at_period_end` and yields `CANCELLED_PENDING` via lifecycle (mocked Stripe + existing DB test pattern)
- [x] 3.3 Confirm renewal / period-end EXPIRY assertions still pass; ensure no second EXPIRY insert path was added

## 4. Profile billing UI and routes

- [x] 4.1 Add HeroUI-only billing components under `apps/web/app/components/profile/` (plan, status, period end, payment/address summary when known; status-specific CTAs)
- [x] 4.2 Implement `/:locale/profile/billing` GET — load subscription by session user id; PAST_DUE messaging + portal CTA; INACTIVE → membership Checkout CTA; no rollover copy
- [x] 4.3 Implement SSR POST to open Customer Portal (resolve `stripeCustomerId` from subscription row only; 302 to portal URL; error if missing customer id)
- [x] 4.4 Implement `/:locale/profile/billing/cancel` confirm page + POST → cancel helper → redirect to billing
- [x] 4.5 Hide cancel CTA when already `CANCELLED_PENDING`; do not clear `UNPAID` via portal optimism

## 5. Validation

- [x] 5.1 Run `cd packages/billing && bun test` — portal/cancel + EXPIRY tests pass without live Stripe
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run `bun run lint` — exits 0
- [x] 5.4 Confirm no second EXPIRY ledger implementation, no GDPR/admin ops, no Playwright/Ladle suite in this change

## 6. Wrap-up

- [x] 6.1 Update `docs/product/` only if behavior diverges from feature files
- [x] 6.2 Note Stripe Customer Portal dashboard requirements (payment method update + cancel at period end) for step 05 `DEPLOYMENT.md`
- [x] 6.3 Mark step 04 done in `waitlist-account-parent-guide.md` when ready to archive
- [x] 6.4 Hand off to `waitlist-account-05-ladle-e2e-and-release` with change ID + parent guide link
