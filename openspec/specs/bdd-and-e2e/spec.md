# BDD and E2E

Proximity-selector contract for MVP Playwright scenarios and the Phase 5.5 `@skip-no-ui` coverage gate. Product behavioral SoT remains `docs/product/features/*.feature` and `docs/product/testing/bdd-and-e2e.md`.

## Requirements

### Requirement: Proximity selectors (gap G7 remediation)
The system SHALL assert MVP Playwright scenarios with proximity/layout selectors. Standing use of `page.locator('input[name=…]')` for fields that should expose accessible names is forbidden; native file inputs MAY use `page.locator` / `setInputFiles` only with an inline `// BDD exception: file-input` comment.

#### Scenario: Admin date fields are label-addressable
- **WHEN** an e2e test fills an event date or time on an admin form
- **THEN** it uses an accessible name (`getByLabel` or equivalent) rather than a bare `input[name=…]` locator, unless a named deferral documents why not

#### Scenario: File inputs keep the documented exception
- **WHEN** an e2e test uploads an event image or partner logo via a native file input
- **THEN** any `page.locator` / `setInputFiles` call is accompanied by an inline `// BDD exception: file-input` comment

#### Scenario: Remaining locator debt is named
- **WHEN** Phase 5.5 step 03 completes and a non-file `page.locator` remains in `admin-events.spec.ts` or `e2e/fixtures/admin.ts`
- **THEN** that locator is listed as a named deferral (file path, purpose, reason, target phase)

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

### Requirement: Coverage matrix
The repository SHALL include a checked-in coverage matrix at `docs/product/testing/coverage-matrix.md` mapping each MVP `docs/product/features/*.feature` Scenario to its Playwright test (or explicit `skip` / `deferred` / `unshipped` status). The matrix SHALL also note post-MVP `features/post-mvp/` scenarios that remain `@skip-no-ui` in shipped e2e. `docs/product/testing/bdd-and-e2e.md` Known coverage gaps SHALL point at this matrix as the single inventory once it is accurate.

#### Scenario: Matrix is the inventory
- **WHEN** an implementer opens the coverage matrix
- **THEN** they can see status for Discover CTA scenarios, public detail, G7/skip deferrals, auth GDPR stubs, post-MVP skips, and Phase 6–8 unshipped features

#### Scenario: Matrix columns are complete
- **WHEN** a Scenario row is recorded
- **THEN** it includes feature file, Scenario title, Playwright file + test title (or `—`), status (`pass` / `skip` / `deferred` / `unshipped`), and notes (deferral target phase if any)

#### Scenario: Known gaps point at the matrix
- **WHEN** a reader opens `bdd-and-e2e.md` Known coverage gaps after Phase 5.5 step 04
- **THEN** the section references the coverage matrix instead of duplicating a stale full inventory

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
