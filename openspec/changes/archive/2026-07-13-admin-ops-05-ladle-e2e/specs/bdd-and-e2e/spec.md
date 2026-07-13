## ADDED Requirements

### Requirement: Admin users Playwright coverage
The system SHALL map `docs/product/features/admin-users.feature` scenarios to `e2e/specs/admin-users.spec.ts` using verbatim Gherkin `Scenario:` titles as Playwright `test()` titles and proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`. Admin waitlist promote, admin booking cancel, and admin credit/freeze/comp/refund scenarios SHALL pass in their feature-mapped specs (`waitlist.spec.ts`, `booking.spec.ts`, `credits-subscription.spec.ts`) or be listed as named deferrals with reason and owner limited to remaining Phase 8 / `seo-launch-polish-03` when blocked by env or harness — not by missing UI. The coverage matrix and `e2e/README.md` SHALL reflect the updated inventory with no silent skips and no lingering “Phase 8 — UI not built” reasons for shipped admin-ops surfaces.

#### Scenario: Admin users spec exists
- **WHEN** Phase 8 admin-ops hardens
- **THEN** `admin-users.spec.ts` is present and executable in CI/local e2e

#### Scenario: Coverage matrix reflects admin-ops close-out
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** `admin-users.feature` rows point at `admin-users.spec.ts` (or named env skips) instead of `unshipped`, and admin waitlist/cancel/credit rows are `pass`, env `skip`, or `deferred` → `seo-launch-polish-03` with an explicit non-UI reason

#### Scenario: Phase 7 admin UI skips are resolved
- **WHEN** admin-ops step 05 completes
- **THEN** waitlist admin visibility/promote, booking admin cancel, and credits-subscription admin adjust/freeze/comp/refund scenarios no longer skip solely because “Phase 8 — … UI” is missing

## MODIFIED Requirements

### Requirement: MVP @skip-no-ui gate
Phase 5.5 SHALL NOT leave MVP-required scenarios tagged `@skip-no-ui` without an explicit deferral recording scenario name, reason, and target phase. Post-MVP portal/check-in/QR skips MAY remain. Admin waitlist visibility/manual promote SHALL be covered by Playwright once `/admin/waitlist` ships (admin-ops), or recorded as a named env/harness deferral owned by `seo-launch-polish-03` — not left as “UI not built.” GDPR export/delete page mechanics remain deferred to `gdpr-rights` until that feature ships. Stripe Customer Portal deep hosted interactions MAY use an opt-in/seed pattern documented in `e2e/README.md` (analogous to `E2E_STRIPE_CHECKOUT`).

#### Scenario: Remote URL event image
- **WHEN** Phase 5.5 step 03 completes
- **THEN** "Supply the event image as a remote URL" either has a passing Playwright test without `@skip-no-ui` or is listed as a named deferral

#### Scenario: Post-MVP partner portal and QR skips remain
- **WHEN** Phase 5.5 step 03 completes
- **THEN** `admin-partners` portal-access and venue QR scenarios may remain tagged `@skip-no-ui` without being treated as MVP gate failures

#### Scenario: Admin waitlist covered or named-deferred after admin-ops
- **WHEN** `Admin visibility` or `Admin can manually trigger promotion` is evaluated after admin-ops ships `/admin/waitlist`
- **THEN** the scenarios pass via Playwright, skip only for documented env prerequisites, or are listed as `deferred` → `seo-launch-polish-03` with a non-UI reason

#### Scenario: Profile GDPR mechanics deferred
- **WHEN** full data-export or delete-account page mechanics are not shipped in Phase 7
- **THEN** the coverage matrix lists those rows as `deferred` → Phase 8 / `gdpr-rights` (entry-link visibility MAY still pass)
