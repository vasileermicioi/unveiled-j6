## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/payments-booking-05-e2e-and-release.md`, this change’s design.md/specs, `docs/product/testing/bdd-and-e2e.md`, and confirm parent guide steps 01–04 are done
- [x] 1.2 Inventory Gherkin scenarios into Phase 6 in-scope vs deferred (waitlist → Phase 7; portal/cancel UX → Phase 7; admin ops → Phase 8) and note seed/catalog prerequisites for a bookable event
- [x] 1.3 Confirm Stripe webhook path is `POST /api/webhooks/stripe` and list which membership/book/confirm/`/bookings` UI strings specs will assert via proximity selectors

## 2. Harness fixtures and Stripe policy docs

- [x] 2.1 Add `e2e/fixtures/billing.ts` helpers (subscription status + credit balance via `DATABASE_URL` + `@unveiled/db` when available; skip-friendly guards when unset) without adding production test-activate routes
- [x] 2.2 Document Stripe test-mode vs mock/seed policy, required env vars, webhook forward command, and activation skip rules in `e2e/README.md`; add the two new specs to the inventory table
- [x] 2.3 Record named deferrals in README skip inventory (and/or coverage matrix notes) for waitlist offer, Customer Portal recovery / in-app cancel, admin credit/freeze/comp/cancel, and any outline/email/idempotency rows not automated

## 3. Playwright specs

- [x] 3.1 Add `e2e/specs/credits-subscription.spec.ts` with verbatim Scenario titles for in-scope flows (inactive signup credits if assertable, activation or documented skip, frozen checkout, already-active, booking gate / past-due messaging as designed)
- [x] 3.2 Add `e2e/specs/booking.spec.ts` with verbatim Scenario titles for auth gate, subscription gate, successful booking + redemption, insufficient credits, past-due freeze, post-booking actions, no self-cancel; skip/defer waitlist, admin cancel, and email/idempotency when harness cannot cover them
- [x] 3.3 Use proximity/layout selectors only; reuse auth/onboarding fixtures; prefer seeded Discover/member events for booking targets

## 4. Coverage matrix and deployment docs

- [x] 4.1 Update `docs/product/testing/coverage-matrix.md` booking + credits-subscription rows from `unshipped` to `pass` / `skip` / `deferred` with Playwright file + title (or `—`) and correct target phases (waitlist → Phase 7, not Phase 6)
- [x] 4.2 Expand `apps/web/DEPLOYMENT.md` Phase 6 block: Stripe/Resend required on staging, test card `4242…`, webhook URL `{SITE_URL}/api/webhooks/stripe`, demo accounts/subscription notes, and staging smoke checklist (subscribe → ACTIVE → book → ticket → email)
- [x] 4.3 Ensure no secrets are committed; `.env.example` placeholders only if new e2e vars are introduced

## 5. Validation and release

- [x] 5.1 Run `bun run lint` and `bun run typecheck` until exit 0
- [x] 5.2 Run `bun run test:e2e` for credits-subscription + booking specs (or document CI secrets/skip path); fix locator/a11y gaps in UI only if selectors cannot assert without them
- [x] 5.3 Deploy to staging; complete smoke checklist; record staging notes in `DEPLOYMENT.md`
- [x] 5.4 Mark `payments-booking-05-e2e-and-release` done in `payments-booking-parent-guide.md` (feature releasable); confirm Phase 7 was not started; leave `docs/product/` features unchanged unless behavior diverged
