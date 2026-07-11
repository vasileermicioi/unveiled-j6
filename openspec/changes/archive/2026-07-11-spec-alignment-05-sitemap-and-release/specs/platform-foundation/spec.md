## ADDED Requirements

### Requirement: Phase 5.5 release gate

Phase 6 (Stripe/booking) SHALL NOT start until Phase 5.5 release criteria in `.dev-plan/current-iteration/spec-alignment-parent-guide.md` are met, or only **named** deferrals remain (each with scenario/debt id + reason + target phase) documented in the parent guide and/or `docs/product/testing/coverage-matrix.md`. Completing Phase 5.5 step 05 SHALL update staging, record the phase in `apps/web/DEPLOYMENT.md`, and SHALL NOT introduce `packages/billing`, booking mutation routes, Stripe checkout, or Resend as part of this feature.

#### Scenario: Hard stop before payments

- **WHEN** Phase 5.5 step 05 completes
- **THEN** staging is updated, `DEPLOYMENT.md` notes Phase 5.5, parent release criteria are checked (or only named deferrals remain), and no billing/booking implementation has been started as part of this feature

#### Scenario: Verification baseline passes

- **WHEN** an implementer finishes step 05
- **THEN** `bun run lint`, `bun run typecheck`, `bun run stories` (Theme Overview reachable), and in-scope `bun run test:e2e` pass (respecting named skips/deferrals)
