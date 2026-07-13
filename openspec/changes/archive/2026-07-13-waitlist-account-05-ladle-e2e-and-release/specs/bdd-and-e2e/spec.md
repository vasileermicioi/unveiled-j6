## ADDED Requirements

### Requirement: Phase 7 Playwright mapping
The system SHALL map `waitlist.feature` → `e2e/specs/waitlist.spec.ts` and `profile.feature` → `e2e/specs/profile.spec.ts` with verbatim Gherkin `Scenario:` titles as Playwright `test()` titles and proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`. The coverage matrix SHALL list each affected Scenario as `pass`, `skip`, or `deferred` (not `unshipped` once Phase 7 closes). Out-of-phase scenarios SHALL record a named deferral with target phase (not a silent `@skip-no-ui`).

#### Scenario: Waitlist and profile specs exist
- **WHEN** Phase 7 ships
- **THEN** those Playwright files exist and cover in-scope scenarios or record named deferrals

#### Scenario: Coverage matrix reflects Phase 7 waitlist and profile rows
- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** `waitlist.feature` and `profile.feature` rows point at the new Playwright files/titles (or named deferrals) instead of remaining `unshipped`

#### Scenario: Phase 6 deferred rows are resolved or renamed
- **WHEN** Phase 7 closes
- **THEN** booking “Sold out — automatic waitlist offer” and credits-subscription portal/cancel/reactivate rows are `pass`, documented `skip`, or `deferred` with an updated reason — not left as “Phase 7 — UI not built”

## MODIFIED Requirements

### Requirement: MVP @skip-no-ui gate
Phase 5.5 SHALL NOT leave MVP-required scenarios tagged `@skip-no-ui` without an explicit deferral recording scenario name, reason, and target phase. Post-MVP portal/check-in/QR skips MAY remain. For Phase 7 close-out, admin waitlist visibility/manual promote and GDPR export/delete page mechanics SHALL be recorded as `deferred` → Phase 8 (with reason) rather than left as silent skips or `unshipped` without a target phase. Stripe Customer Portal deep hosted interactions MAY use an opt-in/seed pattern documented in `e2e/README.md` (analogous to `E2E_STRIPE_CHECKOUT`).

#### Scenario: Remote URL event image
- **WHEN** Phase 5.5 step 03 completes
- **THEN** "Supply the event image as a remote URL" either has a passing Playwright test without `@skip-no-ui` or is listed as a named deferral

#### Scenario: Post-MVP partner portal and QR skips remain
- **WHEN** Phase 5.5 step 03 completes
- **THEN** `admin-partners` portal-access and venue QR scenarios may remain tagged `@skip-no-ui` without being treated as MVP gate failures

#### Scenario: Admin waitlist deferred
- **WHEN** `Admin visibility` or `Admin can manually trigger promotion` cannot be exercised without Phase 8 UI
- **THEN** the coverage matrix lists `deferred` → Phase 8 with reason

#### Scenario: Profile GDPR mechanics deferred
- **WHEN** full data-export or delete-account page mechanics are not shipped in Phase 7
- **THEN** the coverage matrix lists those rows as `deferred` → Phase 8 (entry-link visibility MAY still pass)
