## Why

Steps 01–04 delivered the Playwright harness, Ladle stories, and Gherkin-traced specs, but CI still only runs lint/typecheck/build before staging deploy. Without wiring `test:e2e` into the pipeline and documenting the Phase 4½ operator gate, regressions can merge to `main` unnoticed and the testing foundation cannot be closed.

## What Changes

- Extend `.github/workflows/deploy-staging.yml` (or add a quality workflow) so an `e2e` job runs after lint/typecheck/build against a local SSR instance (`localhost:3000`), installs Chromium, injects GitHub secrets for DB/auth/E2E credentials, and blocks deploy on failure.
- Optionally migrate/seed the CI database before E2E when secrets allow; exclude or skip R2-dependent specs when R2 secrets are absent.
- Add a **Phase 4½ — Testing foundation** section to `apps/web/DEPLOYMENT.md` covering stories, local/CI E2E, required secret names, known marked skips, and a staging manual gate.
- Mark all steps complete in `.dev-plan/current-iteration/testing-04-parent-guide.md` and document permanently skipped scenarios (GDPR, Google OAuth) with owners.
- Confirm root `package.json` scripts (`stories`, `test:e2e`) are discoverable via docs pointers.

## Capabilities

### New Capabilities

- _(none)_ — CI and docs extend existing platform/auth testing requirements.

### Modified Capabilities

- `platform-foundation`: CI SHALL run Playwright E2E against local SSR before staging deploy succeeds; `DEPLOYMENT.md` SHALL document stories, E2E, env vars, and known skips for the Phase 4½ gate.
- `authentication`: Phase 4½ done-when SHALL include CI execution of `e2e/specs/auth.spec.ts`, with marked skips only for Phase 9 GDPR and optional Google OAuth CI limitations.

## Impact

- **CI:** `.github/workflows/deploy-staging.yml` (job timeout ≥ 15m; new secrets: `DATABASE_URL`, `AUTH_URL`, `E2E_*`, optional R2).
- **Docs:** `apps/web/DEPLOYMENT.md`, `e2e/README.md` (cross-link if needed), `testing-04-parent-guide.md`.
- **Scripts:** root `package.json` already has `stories` / `test:e2e` — no new product code.
- **Out of scope:** new specs/stories, Railway↔Workers migration, Phase 5 features.
