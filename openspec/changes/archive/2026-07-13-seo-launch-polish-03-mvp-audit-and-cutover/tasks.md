## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/seo-launch-polish-03-mvp-audit-and-cutover.md`, parent guide, `phase-8-overview.md` release criteria, Phase 8 done-when in `IMPLEMENTATION-PLAN.mvp.md`, `docs/product/product/user-journeys.md`, and `docs/product/testing/bdd-and-e2e.md`
- [x] 1.2 Confirm `admin-ops` and `gdpr-rights` parents are done (or list blockers); confirm `seo-launch-polish-02` is merged
- [x] 1.3 Collect current skip/deferral inventory from `e2e/README.md` and `docs/product/testing/coverage-matrix.md`

## 2. MVP feature coverage audit

- [x] 2.1 Audit each top-level `docs/product/features/*.feature` (exclude `post-mvp/`) against matching `e2e/specs/*.spec.ts` Scenario titles and matrix rows
- [x] 2.2 Fix last-mile e2e gaps found in the audit (locator/title/fixture only) OR record named deferrals (scenario + reason + owner) — no silent MVP skips
- [x] 2.3 Update `docs/product/testing/coverage-matrix.md` so every MVP feature file maps to `pass` / `skip` / `deferred` with notes; clear any stale `unshipped` for shipped Phase 6–8 work
- [x] 2.4 Reconcile `e2e/README.md` Skip inventory with the matrix (including residual GDPR Neon Auth credential-reject deferral if still needed)

## 3. Ladle verification

- [x] 3.1 Confirm Ladle stories exist for admin Membership HQ (list/detail/mutations/waitlist), GDPR confirms (export/delete/admin delete), and error pages (403/500); add stories only if a shipped UI state is missing coverage

## 4. Staging walkthrough and cutover docs

- [x] 4.1 Deploy or verify staging; run guest→member→book→admin support walkthrough per `user-journeys.md` (seeded ACTIVE acceptable if Checkout unavailable — note it)
- [x] 4.2 Record walkthrough outcome (pass / partial gaps / blocked) in `apps/web/DEPLOYMENT.md` Phase 8 section with demo script notes
- [x] 4.3 Write production cutover checklist in `DEPLOYMENT.md` (env/secrets, Neon Auth trusted domains, Stripe, R2, Resend, optional Sentry, DNS/Workers, admin provisioning, post-deploy smoke) — link from parent guide if useful
- [x] 4.4 Add Phase 8 stop note: MVP member/admin complete; partner portal is post-MVP

## 5. Planning close-out

- [x] 5.1 Mark step 03 and parent **seo-launch-polish** done in `seo-launch-polish-parent-guide.md`
- [x] 5.2 Mark Phase 8 complete in `phase-8-overview.md` (all three parents done); do not start post-MVP partner work
- [x] 5.3 Handoff linking `seo-launch-polish-03-mvp-audit-and-cutover`

## 6. Validation

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — `typecheck` exit 0; touched e2e specs pass `biome check` (repo-wide `bun run lint` still reports pre-existing format noise outside this change)
- [x] 6.2 Run `bun run test:e2e` — focused smoke+static+admin suites: 12 passed / 31 named env/post-MVP skips; full suite needs `E2E_ADMIN_*` (admin events/partners now skip instead of throw)
- [x] 6.3 Confirm phase release criteria in `phase-8-overview.md` are met or explicitly documented as remaining named gaps
