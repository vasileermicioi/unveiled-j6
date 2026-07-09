## 1. Setup and baseline

- [x] 1.1 Confirm steps 01–04 are merged; run local baseline `bun run lint && bun run typecheck && bun run build`
- [x] 1.2 Inventory GitHub secrets needed for CI e2e (`DATABASE_URL`, `AUTH_URL`, `E2E_*`, optional R2) vs what exists in the repo settings
- [x] 1.3 Read `.github/workflows/deploy-staging.yml` and `e2e/playwright.config.ts` webServer behavior

## 2. CI workflow

- [x] 2.1 Split or extend `deploy-staging.yml` into `quality` → `e2e` → `deploy` jobs so e2e failure blocks deploy
- [x] 2.2 Add Playwright Chromium install (`bunx playwright install --with-deps chromium`) and `timeout-minutes` ≥ 15 on the e2e job
- [x] 2.3 Wire e2e env: `CI=true`, `SITE_URL=http://localhost:3000`, `DATABASE_URL`, `AUTH_URL`, `E2E_USER_*`, `E2E_ADMIN_*` from secrets; pass optional R2 secrets when present
- [x] 2.4 Add optional `bun run db:migrate` (and seed only if CI DB needs catalog data); use a CI-dedicated DB URL — never `--reset` against shared staging
- [x] 2.5 Fail the job early with a clear message if required secrets are empty
- [x] 2.6 Run `bun run test:e2e` (rely on existing `r2Configured()` skips; no new specs)

## 3. Documentation

- [x] 3.1 Add **Phase 4½ — Testing foundation** to `apps/web/DEPLOYMENT.md` (stories, e2e, CI behavior, secret names, staging manual gate, client demo line + demo script)
- [x] 3.2 Document permanently skipped scenarios (Phase 9 GDPR, Google OAuth) with owners/deferral; cross-link `e2e/README.md`
- [x] 3.3 Confirm root `package.json` `stories` / `test:e2e` are pointed to from DEPLOYMENT.md (or README pointer)
- [x] 3.4 Mark step 05 complete in `.dev-plan/current-iteration/testing-04-parent-guide.md`; note any permanently skipped scenarios in the guide

## 4. Validation and handoff

- [x] 4.1 Full local gate: `bun run lint && bun run typecheck && bun run build && bun run test:e2e`
- [x] 4.2 Spot-check `bun run stories` (UI + web servers load Phase 0–4 stories)
- [x] 4.3 Verify CI e2e on `main`/PR dry-run, or document secrets gap with follow-up owner in DEPLOYMENT.md
- [x] 4.4 Confirm Phase 4½ release criteria in parent guide are satisfied; note Phase 5 may start after merge + staging gate
