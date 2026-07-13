## ADDED Requirements

### Requirement: Production cutover checklist
The project SHALL maintain a production cutover checklist covering required env vars, Neon Auth trusted domains, Stripe, R2, Resend, optional Sentry, DNS/Workers routing, and admin provisioning, referenced from `apps/web/DEPLOYMENT.md`. Phase 8 close-out SHALL also record the staging guest→member→book→admin walkthrough (or an explicit blocker) in `DEPLOYMENT.md`.

#### Scenario: Checklist exists
- **WHEN** Phase 8 closes
- **THEN** operators can follow a written cutover checklist for production from `apps/web/DEPLOYMENT.md` (or a doc linked from it)

#### Scenario: Staging walkthrough is recorded
- **WHEN** Phase 8 launch polish completes
- **THEN** `DEPLOYMENT.md` documents the staging demo/walkthrough outcome (pass, partial with named gaps, or blocked with reason) for guest→member→book→admin support
