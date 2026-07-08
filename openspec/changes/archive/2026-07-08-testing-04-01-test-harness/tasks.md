## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/testing-04-parent-guide.md` and `testing-04-01-test-harness.md` end-to-end
- [x] 1.2 Confirm Phase 4 staging gate and demo account patterns in `apps/web/DEPLOYMENT.md`
- [x] 1.3 Confirm `bun run dev` serves at `http://localhost:3000`

## 2. Ladle — `packages/ui`

- [x] 2.1 Add `@ladle/react` and `ladle` to `packages/ui` devDependencies
- [x] 2.2 Create `packages/ui/.ladle/config.mjs` with story glob `src/**/*.stories.tsx`
- [x] 2.3 Create `packages/ui/src/stories/ThemeDecorator.tsx` — HeroUI provider + yellow page background importing production theme (`apps/web/app/styles/globals.css` or equivalent)
- [x] 2.4 Add `"stories": "ladle serve"` script to `packages/ui/package.json`
- [x] 2.5 Run `bun run lint` and `bun run typecheck` after Ladle setup in `packages/ui`

## 3. Ladle — `apps/web`

- [x] 3.1 Add `@ladle/react` and `ladle` to `apps/web` devDependencies
- [x] 3.2 Create `apps/web/.ladle/config.mjs` with story glob `app/components/**/*.stories.tsx`
- [x] 3.3 Wire ThemeDecorator (reuse from `packages/ui` or duplicate minimal wrapper with same `globals.css` import)
- [x] 3.4 Add `"stories": "ladle serve"` script to `apps/web/package.json`

## 4. Playwright harness

- [x] 4.1 Add `@playwright/test` and `playwright` to root `devDependencies`
- [x] 4.2 Create `e2e/playwright.config.ts` — `baseURL` from `SITE_URL` (default `http://localhost:3000`), `testDir: './specs'`, Chromium project, `webServer` starting `bun run dev` when `CI=true`
- [x] 4.3 Create `e2e/fixtures/base.ts` — extend `test` with `locale` default `'de'`
- [x] 4.4 Create `e2e/fixtures/auth.ts` — `loginAsUser`, `loginAsAdmin` using `getByRole`/`getByLabel` only; read `E2E_*` env vars
- [x] 4.5 Create `e2e/fixtures/db.ts` — optional helper to assert seed state via page navigation (no direct DB from Playwright)
- [x] 4.6 Create `e2e/specs/smoke.spec.ts` — one passing test: `/` redirects to `/de`
- [x] 4.7 Create `e2e/README.md` — selector policy, env vars, local run instructions, Gherkin scenario-title convention, Ladle port conflict note

## 5. Root workspace wiring

- [x] 5.1 Add `"stories": "bun --filter @unveiled/ui stories & bun --filter @unveiled/web stories"` (or orchestrator with distinct ports) to root `package.json`
- [x] 5.2 Add `"test:e2e": "bunx playwright test --config e2e/playwright.config.ts"` to root `package.json`
- [x] 5.3 Update `.env.example` with `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` placeholders

## 6. Validation

- [x] 6.1 `bun install` completes without peer-dep errors for Ladle/Playwright
- [x] 6.2 `bun run stories` serves Ladle for `@unveiled/ui` (empty story list OK)
- [x] 6.3 `bunx playwright install chromium` then `SITE_URL=http://localhost:3000 bun run test:e2e` — smoke spec passes (with `bun run dev` running or `webServer` in CI)
- [x] 6.4 `bun run lint` and `bun run typecheck` pass

## 7. Cleanup

- [x] 7.1 Mark step 01 done in `.dev-plan/current-iteration/testing-04-parent-guide.md`
- [x] 7.2 Note any Ladle port conflicts between `packages/ui` and `apps/web` in `e2e/README.md` if both cannot run simultaneously
