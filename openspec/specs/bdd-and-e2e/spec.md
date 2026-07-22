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
Phase 5.5 SHALL NOT leave MVP-required scenarios tagged `@skip-no-ui` without an explicit deferral recording scenario name, reason, and target phase. Post-MVP portal/check-in/QR skips MAY remain. Admin waitlist visibility/manual promote SHALL be covered by Playwright once `/admin/waitlist` ships (admin-ops), or recorded as a named env/harness deferral owned by `seo-launch-polish-03` — not left as “UI not built.” GDPR export/delete page mechanics SHALL be covered by Playwright once `gdpr-rights` ships, or recorded as a named Neon Auth / env / harness deferral owned by `seo-launch-polish-03` — not left as “not built.” Stripe Customer Portal deep hosted interactions MAY use an opt-in/seed pattern documented in `e2e/README.md` (analogous to `E2E_STRIPE_CHECKOUT`).

#### Scenario: Event image direct upload
- **WHEN** admin event image e2e coverage is evaluated
- **THEN** "Supply the event image as a direct upload" has a passing Playwright test without `@skip-no-ui`, or is listed as a named env deferral (e.g. missing R2)

#### Scenario: Post-MVP partner portal and QR skips remain
- **WHEN** Phase 5.5 step 03 completes
- **THEN** `admin-partners` portal-access and venue QR scenarios may remain tagged `@skip-no-ui` without being treated as MVP gate failures

#### Scenario: Admin waitlist covered or named-deferred after admin-ops
- **WHEN** `Admin visibility` or `Admin can manually trigger promotion` is evaluated after admin-ops ships `/admin/waitlist`
- **THEN** the scenarios pass via Playwright, skip only for documented env prerequisites, or are listed as `deferred` → `seo-launch-polish-03` with a non-UI reason

#### Scenario: Profile GDPR mechanics covered or named-deferred after gdpr-rights
- **WHEN** data-export or delete-account page mechanics are evaluated after gdpr-rights ships
- **THEN** the scenarios pass via Playwright, skip only for documented Neon Auth / env / harness reasons, or are listed as `deferred` → `seo-launch-polish-03` with an explicit non-UI reason

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

### Requirement: Featured Event Gallery Playwright coverage

The system SHALL cover Featured Event Gallery happy paths in Playwright with verbatim Gherkin `Scenario:` titles from `docs/product/features/admin-events.feature` and `docs/product/features/event-discovery.feature`, using proximity/layout selectors per `docs/product/testing/bdd-and-e2e.md`. Coverage SHALL include (1) ADMIN multi-upload add and SSR remove confirm for gallery photos when R2 + admin credentials allow, and (2) public guest view of gallery + slider navigation on a seeded or fixture-backed event with ≥2 gallery images. Scenarios that cannot run SHALL be `test.skip`ped with an explicit env/harness reason (never “UI not built”) and documented in `docs/product/testing/coverage-matrix.md` and/or `apps/web/DEPLOYMENT.md` with a manual demo script that still exercises admin add/remove and public slider.

#### Scenario: Admin gallery happy path is executable or named-skipped

- **WHEN** gallery admin e2e coverage is evaluated
- **THEN** multi-upload add and remove-confirm scenarios have Playwright tests that pass when env allows, or are listed as named env skips with a documented manual demo script

#### Scenario: Public gallery slider is executable or named-skipped

- **WHEN** public gallery e2e coverage is evaluated
- **THEN** guest gallery + slider navigation has a Playwright test that passes when seed/fixture data is available, or is listed as a named skip with a documented manual demo script

#### Scenario: Coverage matrix lists gallery scenarios

- **WHEN** an implementer opens `docs/product/testing/coverage-matrix.md` after this change
- **THEN** new gallery scenarios from admin-events and event-discovery map to Playwright titles (or named skips) instead of remaining undocumented

### Requirement: MVP feature coverage audit
The system SHALL map every top-level `docs/product/features/*.feature` file (excluding `features/post-mvp/`) to Playwright coverage that either passes or is explicitly named-deferred with reason. Phase 8 release MUST NOT leave silent skips for MVP scenarios. The coverage matrix at `docs/product/testing/coverage-matrix.md` and `e2e/README.md` skip inventory SHALL agree on pass vs named deferral for each MVP feature file.

#### Scenario: Coverage matrix complete
- **WHEN** Phase 8 launch polish completes
- **THEN** the coverage matrix lists pass or named deferral (`skip` / `deferred` with notes) for each MVP feature file and does not leave MVP-required scenarios as undocumented or silent skips

#### Scenario: Named deferrals are explicit
- **WHEN** an MVP Scenario cannot pass in Playwright (third-party harness, integration SoT, env/plugin blocker)
- **THEN** it is recorded with scenario name, reason, and owner/target in the coverage matrix and/or `e2e/README.md` skip inventory

#### Scenario: Post-MVP remains excluded from the MVP gate
- **WHEN** Phase 8 launch polish completes
- **THEN** `features/post-mvp/` scenarios MAY remain skipped and MUST NOT be treated as MVP coverage failures
