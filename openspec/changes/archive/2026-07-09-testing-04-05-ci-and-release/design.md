## Context

Steps `testing-04-01` through `testing-04-04` are archived and merged: repo-root Playwright (`e2e/`), Ladle stories, and Phase 0–4 specs exist. Root scripts already expose `bun run stories` and `bun run test:e2e`. Playwright config starts `bun run dev` via `webServer` when `CI=true` (`reuseExistingServer: !process.env.CI`).

Today `.github/workflows/deploy-staging.yml` is a single `quality-and-deploy` job: lint → typecheck → build → optional Railway deploy. No browser tests. `apps/web/DEPLOYMENT.md` ends the catalog story at Phase 4; there is no Phase 4½ operator section. `.dev-plan/current-iteration/testing-04-parent-guide.md` is referenced by prior steps but may be missing from the tree — recreate or restore it if absent when marking the feature complete.

Source of truth: `.dev-plan/current-iteration/testing-04-05-ci-and-release.md`.

## Goals / Non-Goals

**Goals:**

- Run Playwright E2E in CI against local SSR before staging deploy; failure blocks deploy.
- Document Phase 4½ stories + E2E + secrets + known skips in `DEPLOYMENT.md`.
- Close the testing-04 parent checklist and hand off to Phase 5.

**Non-Goals:**

- New Playwright specs or Ladle stories.
- Changing Railway vs Workers hosting.
- Phase 5 product work.
- Requiring R2 secrets for a green CI baseline (image specs already self-skip via `r2Configured()`).

## Decisions

### 1. Extend `deploy-staging.yml` in-place (not a separate `quality.yml`)

**Choice:** Add an `e2e` job (or e2e steps before deploy) in the existing workflow so one pipeline owns quality + deploy.

**Alternatives considered:**

- Separate `quality.yml` on PR + keep deploy thin — better for PR feedback, but iteration prefers extending staging workflow and e2e blocking deploy on `main`. Prefer: keep one workflow for this step; optionally add `pull_request` trigger later if needed.
- Run E2E against staging URL — rejected; CI uses `localhost:3000` for determinism and DB access (iteration convention).

### 2. Job shape: quality job then e2e then deploy

**Choice:**

```text
quality (lint, typecheck, build)
  → e2e (needs: quality; timeout ≥ 15m)
    → deploy (needs: e2e; existing Railway step)
```

Split from today's monolithic job so Playwright install/deps do not slow lint/typecheck, and deploy only runs when e2e passes.

**E2E job essentials:**

1. Checkout + Bun + `bun install --frozen-lockfile`
2. `bunx playwright install --with-deps chromium`
3. Env from GitHub secrets: `DATABASE_URL`, `AUTH_URL`, `SITE_URL=http://localhost:3000`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `CI=true`
4. Optional: `bun run db:migrate` (+ `seed:demo` if needed for empty CI DB)
5. Optional R2 secrets — when present, image upload specs run; when absent, existing `test.skip(!r2Configured(), …)` keeps the suite green
6. `bun run test:e2e` (Playwright `webServer` starts `bun run dev`)

No `grepInvert` required for R2 — specs already skip. Do not invent a second exclusion mechanism unless a non-skipping test hard-fails without R2.

### 3. Secrets documentation (names only)

Document in `DEPLOYMENT.md` Phase 4½:

| Secret | Required for CI e2e |
|---|---|
| `DATABASE_URL` | Yes |
| `AUTH_URL` | Yes |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | Yes (auth + member flows) |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | Yes (admin catalog) |
| `S3_*` + `IMAGE_PUBLIC_BASE_URL` | Optional (enables image upload specs) |
| `RAILWAY_TOKEN` | Deploy only (existing) |

Never commit values. CI must fail loudly if required secrets are empty (prefer explicit step check over silent auth failures).

### 4. DEPLOYMENT.md Phase 4½ section

Add after Phase 4 release gate:

- How to run `bun run stories` (UI :61000, web :61001)
- How to run `bun run test:e2e` (env, seed, `webServer` behavior)
- CI behavior and which tests skip without R2 / Google OAuth / Phase 9 GDPR
- Staging manual gate: `SITE_URL=https://<staging> bun run test:e2e`
- Client demo line + short demo script (stories walkthrough + green e2e)

Cross-link `e2e/README.md` rather than duplicating selector policy.

### 5. Parent guide completion

Mark steps 01–05 complete in `testing-04-parent-guide.md`. If the file is missing, restore a minimal checklist from archived step notes and mark all complete, including permanently skipped scenarios with owners (Phase 9 GDPR; Google OAuth = manual staging / Neon provider).

## Risks / Trade-offs

- **[Risk] CI secrets not provisioned → e2e red on first merge** → Mitigation: document secrets gap in DEPLOYMENT.md; add a workflow step that fails with a clear message if required secrets are missing; treat first PR as dry-run until secrets exist.
- **[Risk] Shared Neon DB flaky under parallel CI** → Mitigation: Playwright already uses `workers: 1` when `CI=true`; prefer a dedicated CI branch DB if contention appears.
- **[Risk] `seed:demo` / migrate slow or destructive** → Mitigation: migrate only; seed only when catalog specs need data and DB is empty; never `--reset` in CI against a shared staging DB — use a CI-dedicated database URL.
- **[Risk] Job timeout on full suite** → Mitigation: `timeout-minutes: 20` (≥ 15 required).
- **[Trade-off] Single workflow on `main` only** → PRs do not run e2e until a later `pull_request` trigger is added; acceptable for this release gate.

## Migration Plan

1. Provision GitHub repo secrets (operator).
2. Land workflow + docs on a branch; verify e2e job on PR if trigger added, else after merge to `main`.
3. If e2e blocks deploy and secrets are missing, temporarily document blocker and fix secrets before declaring Phase 4½ done — do not weaken the gate permanently.
4. Rollback: revert workflow commit; deploy step returns to post-build without e2e.

## Open Questions

- Whether to add `pull_request` trigger in this step (nice-for-PR feedback) vs `main`-only as today — default **main-only** unless implementer finds PR CI already expected.
- Exact CI database strategy (shared Neon branch vs ephemeral) — default: reuse `DATABASE_URL` secret pointing at a **CI-dedicated** Neon branch, not production staging data.
