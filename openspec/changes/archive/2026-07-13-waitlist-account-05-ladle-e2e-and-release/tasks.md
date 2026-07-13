## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/waitlist-account-05-ladle-e2e-and-release.md`, parent guide, `proposal.md`, `design.md`, and delta specs
- [x] 1.2 Confirm steps 02 and 04 are done; smoke waitlist join → capacity bump promote and billing cancel locally or on staging
- [x] 1.3 Inventory Gherkin scenarios from `waitlist.feature`, `profile.feature`, and Phase 7 rows in `credits-subscription.feature` / booking waitlist offer → in-scope vs Phase 8 deferral list
- [x] 1.4 Skim existing `e2e/specs/{credits-subscription,booking}.spec.ts`, `e2e/README.md`, `coverage-matrix.md`, and Ladle story patterns (`BookEventPage.stories.tsx`)

## 2. Ladle stories

- [x] 2.1 Add `WaitlistJoinPage.stories.tsx` — form, status created, status existing/duplicate
- [x] 2.2 Add `WaitlistCancelPage.stories.tsx` — confirm state
- [x] 2.3 Add `BillingPage.stories.tsx` — ACTIVE, PAST_DUE, CANCELLED_PENDING, INACTIVE (and missing-customer if distinct)
- [x] 2.4 Add `BillingCancelPage.stories.tsx` — confirm state
- [x] 2.5 Add preferences (and profile if useful) stories for default/filled states using existing fixtures/content helpers

## 3. Playwright — waitlist

- [x] 3.1 Create `e2e/specs/waitlist.spec.ts` with verbatim `Scenario:` titles from `waitlist.feature`
- [x] 3.2 Implement member flows: join, auth redirect, duplicate, cancel (seed sold-out event `Sold Out: Waitlist Demo Night`)
- [x] 3.3 Implement auto-promotion via admin capacity increase; skip/ineligible and queue/partial as far as harness allows
- [x] 3.4 `test.skip` admin visibility / manual promote with explicit Phase 8 reason; assert user-scoped visibility as UI allows
- [x] 3.5 Add thin fixtures/helpers only if needed (resolve sold-out event, admin capacity bump)

## 4. Playwright — profile

- [x] 4.1 Create `e2e/specs/profile.spec.ts` with verbatim titles from `profile.feature`
- [x] 4.2 Implement identity edit, preferences save, wallet view, refill → membership
- [x] 4.3 Implement billing view, portal update entry (redirect or opt-in), cancel → `CANCELLED_PENDING`
- [x] 4.4 Password-change entry via security/auth UI; GDPR export/delete → assert links if present, defer page mechanics to Phase 8

## 5. Playwright — un-skip Phase 7 credits/booking

- [x] 5.1 Un-skip/implement `Recovering from past due`, `Cancelling a subscription`, `Cancellation takes effect at period end`, `Reactivating after cancellation` in `credits-subscription.spec.ts`
- [x] 5.2 Un-skip/implement `Sold out — automatic waitlist offer` in `booking.spec.ts`
- [x] 5.3 Keep monthly EXPIRY and admin credit/freeze/comp as documented skip/deferred; document portal deep-interaction policy in `e2e/README.md`

## 6. Docs and release

- [x] 6.1 Update `docs/product/testing/coverage-matrix.md` — waitlist/profile/booking/credits Phase 7 rows to `pass` / `skip` / `deferred` (no lingering Phase 7 “UI not built”)
- [x] 6.2 Update `e2e/README.md` — spec inventory + skip inventory for waitlist/profile and revised credits/booking rows
- [x] 6.3 Update `apps/web/DEPLOYMENT.md` Phase 7: sold-out seed title, Customer Portal dashboard config, demo script, stop before Phase 8
- [x] 6.4 Staging deploy + run Phase 7 demo walkthrough; record result in `DEPLOYMENT.md`

## 7. Validation

- [x] 7.1 Run `bun run lint` — exits 0
- [x] 7.2 Run `bun run typecheck` — exits 0
- [x] 7.3 Run `bun run stories` (or `@unveiled/web` Ladle) — waitlist/profile stories load
- [x] 7.4 Run focused `bun run test:e2e` for waitlist/profile/credits-subscription/booking Phase 7 scope — green or only named deferrals
- [x] 7.5 Confirm no Phase 8 admin waitlist/GDPR/SEO features were implemented

## 8. Wrap-up

- [x] 8.1 Mark step 05 done in `waitlist-account-parent-guide.md`; note Phase 7 release-ready
- [x] 8.2 Ensure coverage matrix matches shipped vs deferred rows
- [x] 8.3 Do not open Phase 8 step plans in this change
