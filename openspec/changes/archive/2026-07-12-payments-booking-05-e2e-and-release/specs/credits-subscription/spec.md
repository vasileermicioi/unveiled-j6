## ADDED Requirements

### Requirement: Staging payment configuration
Staging and local operator docs SHALL list Stripe and Resend environment variables and the Stripe test card used for the Phase 6 client demo. `apps/web/DEPLOYMENT.md` SHALL document webhook endpoint URL expectations, demo account / subscription notes for the subscribe→book→door-code path, and a staging smoke checklist that does not start Phase 7.

#### Scenario: Deployment docs list payment secrets
- **WHEN** an operator reads `apps/web/DEPLOYMENT.md`
- **THEN** they find `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN`, Resend vars (`RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL`), the Stripe test card instruction, and webhook/demo notes for Phase 6

#### Scenario: Staging smoke checklist closes Phase 6
- **WHEN** an operator follows the Phase 6 staging checklist in `DEPLOYMENT.md`
- **THEN** they can verify test card → `ACTIVE` → book → ticket (+ email when Resend is configured) without implementing waitlist or profile/billing work
