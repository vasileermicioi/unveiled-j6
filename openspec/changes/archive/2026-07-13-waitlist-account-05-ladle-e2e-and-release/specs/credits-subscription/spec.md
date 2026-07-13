## ADDED Requirements

### Requirement: Phase 7 credits-subscription Playwright close-out
The system SHALL implement (or replace Phase 7 “UI not built” skips with) Playwright coverage in `e2e/specs/credits-subscription.spec.ts` for Customer Portal recovery CTA, in-app cancel → `CANCELLED_PENDING`, period-end access until cancel takes effect, and reactivation from `INACTIVE` via membership Checkout, now that `/profile/billing` exists. Specs SHALL use verbatim Gherkin titles and proximity selectors. Deep Stripe Customer Portal hosted interaction MAY follow an opt-in/seed pattern documented in `e2e/README.md` (analogous to `E2E_STRIPE_CHECKOUT`). Monthly renewal EXPIRY MAY remain covered by package/webhook tests with an explicit skip note. Admin credit/freeze/comp scenarios remain deferred to Phase 8.

#### Scenario: Portal recovery and cancel scenarios are executable
- **WHEN** `bun run test:e2e` runs the credits-subscription Phase 7 scenarios with `DATABASE_URL` available
- **THEN** recovering-from-past-due, cancelling, period-end, and reactivating scenarios pass via seeded state + profile billing UI, or skip only with documented env/opt-in reasons

#### Scenario: Admin credits scenarios stay Phase 8
- **WHEN** Phase 7 closes
- **THEN** admin adjust/freeze/comp scenarios remain `deferred` → Phase 8 in the coverage matrix

## MODIFIED Requirements

### Requirement: Staging payment configuration
Staging and local operator docs SHALL list Stripe and Resend environment variables and the Stripe test card used for membership demos. `apps/web/DEPLOYMENT.md` SHALL document webhook endpoint URL expectations, demo accounts, Phase 6 subscribe→book→door-code smoke, **and** a Phase 7 section covering Stripe Customer Portal dashboard settings (payment method + billing address updates; cancellation **at period end**), profile billing cancel → `CANCELLED_PENDING`, sold-out waitlist demo seed, and an explicit note that Phase 7 is complete — do **not** start Phase 8. No new app secrets are required for portal beyond existing `STRIPE_SECRET_KEY` and `SITE_URL` for `return_url`.

#### Scenario: Operator can configure staging payments
- **WHEN** an operator follows `DEPLOYMENT.md`
- **THEN** they can set Stripe + Resend vars and run the Phase 6 client demo path on staging

#### Scenario: Phase 6 demo stops before Phase 7 work
- **WHEN** Phase 6 release notes are read in isolation
- **THEN** they still describe the subscribe→book smoke without requiring waitlist/profile implementation in that historical section

#### Scenario: Phase 7 portal and stop gate documented
- **WHEN** an operator reads the Phase 7 section of `DEPLOYMENT.md` after this change
- **THEN** they find Customer Portal dashboard requirements, billing cancel demo notes, and “do not start Phase 8”
