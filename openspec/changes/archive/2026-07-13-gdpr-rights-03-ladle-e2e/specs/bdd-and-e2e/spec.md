## ADDED Requirements

### Requirement: GDPR Playwright coverage
The system SHALL cover `auth.feature` GDPR scenarios (export, deletion, admin-assisted deletion, distinct from subscription cancel) in Playwright with verbatim titles, and SHALL assert profile entry points from `profile.feature`. After gdpr-rights hardening, remaining GDPR auth/profile e2e rows SHALL pass or be named-deferred with explicit reasons (Neon Auth / env / harness only — never “not built” or “Phase 9”). The coverage matrix and `e2e/README.md` SHALL reflect the updated inventory with Google OAuth deferrals kept separate from GDPR rows.

#### Scenario: GDPR scenarios executable
- **WHEN** gdpr-rights hardening completes
- **THEN** remaining GDPR auth/profile e2e rows pass or are named-deferred with reasons

#### Scenario: Coverage matrix reflects gdpr-rights close-out
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** auth GDPR scenario rows and profile “Access account deletion and data export” are `pass`, env `skip`, or named deferral — not `deferred` solely because GDPR UI is missing

#### Scenario: No silent or outdated GDPR skips
- **WHEN** `e2e/specs/auth.spec.ts` GDPR tests are reviewed after this change
- **THEN** no scenario skips solely with “Phase 9 — … not built” or equivalent “UI not built” wording

## MODIFIED Requirements

### Requirement: MVP @skip-no-ui gate
Phase 5.5 SHALL NOT leave MVP-required scenarios tagged `@skip-no-ui` without an explicit deferral recording scenario name, reason, and target phase. Post-MVP portal/check-in/QR skips MAY remain. Admin waitlist visibility/manual promote SHALL be covered by Playwright once `/admin/waitlist` ships (admin-ops), or recorded as a named env/harness deferral owned by `seo-launch-polish-03` — not left as “UI not built.” GDPR export/delete page mechanics SHALL be covered by Playwright once `gdpr-rights` ships, or recorded as a named Neon Auth / env / harness deferral owned by `seo-launch-polish-03` — not left as “not built.” Stripe Customer Portal deep hosted interactions MAY use an opt-in/seed pattern documented in `e2e/README.md` (analogous to `E2E_STRIPE_CHECKOUT`).

#### Scenario: Remote URL event image
- **WHEN** Phase 5.5 step 03 completes
- **THEN** "Supply the event image as a remote URL" either has a passing Playwright test without `@skip-no-ui` or is listed as a named deferral

#### Scenario: Post-MVP partner portal and QR skips remain
- **WHEN** Phase 5.5 step 03 completes
- **THEN** `admin-partners` portal-access and venue QR scenarios may remain tagged `@skip-no-ui` without being treated as MVP gate failures

#### Scenario: Admin waitlist covered or named-deferred after admin-ops
- **WHEN** `Admin visibility` or `Admin can manually trigger promotion` is evaluated after admin-ops ships `/admin/waitlist`
- **THEN** the scenarios pass via Playwright, skip only for documented env prerequisites, or are listed as `deferred` → `seo-launch-polish-03` with a non-UI reason

#### Scenario: Profile GDPR mechanics covered or named-deferred after gdpr-rights
- **WHEN** data-export or delete-account page mechanics are evaluated after gdpr-rights ships
- **THEN** the scenarios pass via Playwright, skip only for documented Neon Auth / env / harness reasons, or are listed as `deferred` → `seo-launch-polish-03` with an explicit non-UI reason
