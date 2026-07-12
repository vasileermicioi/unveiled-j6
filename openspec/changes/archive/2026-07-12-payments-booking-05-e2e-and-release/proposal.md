## Why

Steps 01–04 shipped Stripe Checkout, webhooks, atomic booking, My Tickets, and Ladle shells, but Phase 6 is not releasable until Playwright mirrors the in-scope `credits-subscription.feature` and `booking.feature` scenarios, Stripe test/mock gaps are documented, and staging deploy docs make the client demo (“subscribe with test card, spend credits, get your door code”) repeatable.

## What Changes

- Add `e2e/specs/credits-subscription.spec.ts` and `e2e/specs/booking.spec.ts` with `test()` titles matching Gherkin `Scenario:` lines for **in-scope** Phase 6 member flows
- Prefer Stripe test mode + webhook forwarding where local/CI allows; **mock Checkout only where Playwright cannot drive it**; document stubs and policy in `e2e/README.md`
- Record named deferrals (scenario + reason + target phase) for waitlist offer, Customer Portal recovery / in-app cancel, and admin credit/freeze/comp/cancel scenarios
- Update `docs/product/testing/coverage-matrix.md` rows for credits-subscription + booking from `unshipped` → mapped specs / explicit deferrals
- Update `apps/web/DEPLOYMENT.md` with Phase 6 Stripe/Resend env vars, webhook URL, test card, and demo/subscription notes; record staging deploy smoke checklist
- Keep product Gherkin unchanged unless shipped behavior diverged (expected: no product edits)

## Capabilities

### New Capabilities

- _(none)_ — e2e coverage and staging payment docs extend existing `bdd-and-e2e` and `credits-subscription`

### Modified Capabilities

- `bdd-and-e2e`: Phase 6 Playwright specs for credits-subscription and booking with verbatim Scenario titles, proximity selectors, Stripe mock-only-where-needed policy, and named deferrals for out-of-phase scenarios
- `credits-subscription`: Staging/local deployment docs SHALL list Stripe + Resend env vars and the Stripe test card used for the Phase 6 demo

## Impact

- **E2E:** new `e2e/specs/credits-subscription.spec.ts`, `e2e/specs/booking.spec.ts`; possible fixtures under `e2e/fixtures/` (subscription state seed, Stripe stub helpers); `e2e/README.md` Stripe mock policy + env table
- **Docs:** `docs/product/testing/coverage-matrix.md`; `apps/web/DEPLOYMENT.md`; parent guide step 05 → done / feature releasable
- **App:** no new product features — fixture hooks or test-only env paths only if required to drive ACTIVE / PAST_DUE / insufficient-credits states without full Checkout
- **Out of scope:** Phase 7 waitlist/profile/portal UI; Phase 8 admin ops; partner portal; new booking/Stripe product behavior
