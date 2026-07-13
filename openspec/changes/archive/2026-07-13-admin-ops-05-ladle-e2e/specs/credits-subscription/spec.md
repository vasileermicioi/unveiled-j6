## ADDED Requirements

### Requirement: Admin credits-ops Playwright coverage
The system SHALL implement Playwright coverage in `e2e/specs/credits-subscription.spec.ts` for admin adjust, zero-amount rejection, manual refund, freeze, unfreeze, and complimentary ticket scenarios now that Membership HQ mutation pages exist. Specs SHALL use verbatim Gherkin titles and proximity selectors (navigating `/:locale/admin/users/:id/*` as needed). Skips SHALL only use documented env prerequisites — not “Phase 8 — admin … UI.”

#### Scenario: Admin credit and freeze scenarios are executable
- **WHEN** `bun run test:e2e` runs the credits-subscription admin scenarios with `DATABASE_URL` and admin credentials available
- **THEN** adjust, zero rejection, refund, freeze, unfreeze, and comp-ticket scenarios pass via Membership HQ SSR forms, or skip only with documented env reasons

## MODIFIED Requirements

### Requirement: Phase 7 credits-subscription Playwright close-out
The system SHALL implement (or replace Phase 7 “UI not built” skips with) Playwright coverage in `e2e/specs/credits-subscription.spec.ts` for Customer Portal recovery CTA, in-app cancel → `CANCELLED_PENDING`, period-end access until cancel takes effect, and reactivation from `INACTIVE` via membership Checkout, now that `/profile/billing` exists. Specs SHALL use verbatim Gherkin titles and proximity selectors. Deep Stripe Customer Portal hosted interaction MAY follow an opt-in/seed pattern documented in `e2e/README.md` (analogous to `E2E_STRIPE_CHECKOUT`). Monthly renewal EXPIRY MAY remain covered by package/webhook tests with an explicit skip note. Admin credit/freeze/comp scenarios are covered under admin-ops (Membership HQ mutation pages) and MUST NOT remain deferred solely as “Phase 8 — UI not built.”

#### Scenario: Portal recovery and cancel scenarios are executable
- **WHEN** `bun run test:e2e` runs the credits-subscription Phase 7 scenarios with `DATABASE_URL` available
- **THEN** recovering-from-past-due, cancelling, period-end, and reactivating scenarios pass via seeded state + profile billing UI, or skip only with documented env/opt-in reasons

#### Scenario: Admin credits scenarios covered by admin-ops
- **WHEN** admin-ops step 05 completes
- **THEN** admin adjust/freeze/comp/refund scenarios are `pass` or env-named `skip` / `deferred` → `seo-launch-polish-03` in the coverage matrix — not left as Phase 8 “UI not built”
