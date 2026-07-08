## Why

Phases 0–4 shipped catalog, marketing, auth, and onboarding without a shared testing harness. Steps 02–05 of Phase 4½ need Ladle for component stories and Playwright for Gherkin-traced E2E tests — but those steps cannot start until tooling, root scripts, fixtures, and selector policy are decided once. This step bootstraps both harnesses so later steps add coverage without re-litigating dependencies or conventions.

## What Changes

- Add **Ladle** to `@unveiled/ui` (`packages/ui/.ladle/config.mjs`, `ThemeDecorator.tsx`, `stories` script) with HeroUI Uber theme matching production `globals.css`.
- Add **Ladle** entry in `apps/web` for page-level stories under `app/components/**/*.stories.tsx`.
- Add repo-root **Playwright** harness at `e2e/` — config, `base`/`auth`/`db` fixtures, smoke spec, and `e2e/README.md` documenting proximity-only selector policy.
- Add root scripts `bun run stories` and `bun run test:e2e`; add `@playwright/test` and `playwright` to root devDependencies.
- Add `E2E_*` credential placeholders to `.env.example` (no real secrets).

**Out of scope for this step:** full component stories (step 02), feature-file E2E specs beyond smoke (steps 03–04), CI workflow (step 05), visual regression baselines.

## Capabilities

### New Capabilities

_(none — testing harness extends existing platform foundation)_

### Modified Capabilities

- `platform-foundation`: Add requirements for Ladle component-story harness, Playwright E2E harness at repo root, and documented proximity-only selector policy.

## Impact

- **Packages:** `packages/ui` (Ladle config, `ThemeDecorator`, devDeps `@ladle/react`, `ladle`); `apps/web` (Ladle config for page components, `stories` script).
- **New directory:** `e2e/` at repo root (`playwright.config.ts`, `fixtures/`, `specs/smoke.spec.ts`, `README.md`).
- **Root workspace:** `package.json` scripts (`stories`, `test:e2e`) and Playwright devDependencies.
- **Config:** `.env.example` — `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
- **Docs:** `e2e/README.md` (selector policy, env vars, local run instructions, scenario-title convention); note Ladle port conflicts if both story servers cannot run simultaneously.
- **Downstream:** Consumed by `testing-04-02-ladle-stories`, `testing-04-03-playwright-phases-0-3`, `testing-04-04-playwright-phase-4-admin`.
