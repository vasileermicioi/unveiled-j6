## ADDED Requirements

### Requirement: Credits-subscription and booking e2e coverage
The system SHALL ship Playwright specs at `e2e/specs/credits-subscription.spec.ts` and `e2e/specs/booking.spec.ts` for Phase 6 member payment and booking behavior aligned to `docs/product/features/credits-subscription.feature` and `docs/product/features/booking.feature`. Specs SHALL use verbatim Gherkin `Scenario:` titles as `test()` titles and proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`. Stripe Checkout SHALL be driven in Stripe test mode where the harness can complete it; Checkout MAY be mocked or subscription state seeded only where Playwright cannot drive real test-mode Checkout, and that policy SHALL be documented in `e2e/README.md`. Out-of-phase scenarios SHALL be omitted or skipped with an explicit deferral name, reason, and target phase. The coverage matrix SHALL map each affected Scenario to `pass`, `skip`, or `deferred` (not `unshipped` once Phase 6 closes).

#### Scenario: In-scope scenarios are executable
- **WHEN** `bun run test:e2e` runs the credits-subscription and booking specs against the configured test environment
- **THEN** in-scope Phase 6 scenarios pass, or are skipped only when documented CI/env prerequisites (Stripe secrets, DATABASE_URL fixture access) are missing

#### Scenario: Deferred scenarios are named
- **WHEN** a feature Scenario is out of Phase 6 (waitlist offer, Customer Portal / in-app cancel UX, admin credit/freeze/comp/cancel ops)
- **THEN** it is omitted or `test.skip`ped with an explicit deferral name, reason, and target phase in the spec and/or coverage matrix

#### Scenario: Stripe mock policy is documented
- **WHEN** an operator reads `e2e/README.md` after this change
- **THEN** they find the Stripe test-mode vs mock/seed policy, required env vars for payment/booking specs, and how activation is proven on staging when Checkout cannot run in CI

#### Scenario: Coverage matrix reflects Phase 6 booking and credits rows
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** `booking.feature` and `credits-subscription.feature` Phase 6 in-scope rows point at the new Playwright files/titles (or named deferrals) instead of remaining `unshipped`
