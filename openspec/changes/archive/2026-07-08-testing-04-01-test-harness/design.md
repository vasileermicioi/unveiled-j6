## Context

Phase 4 catalog step 05 delivered `@unveiled/ui` (`EventCard`), public `/discover` and `/events/:id`, and admin CRUD. The monorepo has root scripts `dev`, `build`, `lint`, `typecheck`, `seed:demo` but no `stories` or `test:e2e`. `IMPLEMENTATION-PLAN.md` § Testing conventions defines the authoritative selector and naming rules; Gherkin in `docs/migration/features/*.feature` is the behavioral source of truth for future E2E specs.

**Current state:**

| Area | State |
|---|---|
| Component dev | No Ladle; components reviewed only in full SSR pages |
| E2E | No Playwright; no `e2e/` directory |
| Root scripts | Missing `stories`, `test:e2e` |
| Theme | `apps/web/app/styles/globals.css` — HeroUI Uber reskin, `#FAFF86` page background |
| Dev server | `bun run dev` → Vite/HonoX on default port 3000 |
| Demo accounts | `apps/web/DEPLOYMENT.md` — ADMIN promotion via SQL or `ADMIN_PROMOTE_EMAILS`; USER via signup |

Source of truth: `.dev-plan/current-iteration/testing-04-01-test-harness.md`, `IMPLEMENTATION-PLAN.md` § Testing conventions and monorepo tree.

## Goals / Non-Goals

**Goals:**

- `bun run stories` serves Ladle for `@unveiled/ui` (`src/**/*.stories.tsx`) and `apps/web` (`app/components/**/*.stories.tsx`) with production-matching theme.
- `bun run test:e2e` runs Playwright from repo root; smoke spec passes (`/` → `/de` redirect).
- Auth fixtures (`loginAsUser`, `loginAsAdmin`) use proximity selectors only; credentials from `E2E_*` env vars.
- `e2e/README.md` documents selector policy, env vars, local run, and Gherkin title convention.
- `bun run lint` and `bun run typecheck` remain green.

**Non-Goals:**

- Writing component stories (step 02).
- Feature-file E2E specs beyond smoke (steps 03–04).
- CI workflow wiring (step 05).
- Visual regression / screenshot baselines.
- Direct DB access from Playwright (seed assertions via page navigation only).

## Decisions

### 1. Ladle in two workspaces

```
packages/ui/
  .ladle/config.mjs       # stories: src/**/*.stories.tsx
  src/stories/ThemeDecorator.tsx
  package.json            # script: "stories": "ladle serve"

apps/web/
  .ladle/config.mjs       # stories: app/components/**/*.stories.tsx
  package.json            # script: "stories": "ladle serve"
```

- **ThemeDecorator** imports `apps/web/app/styles/globals.css` (or replicates the same `@import "@heroui/styles"` + `@theme` tokens) and wraps stories in HeroUI provider with yellow page background.
- **Alternative:** Single Ladle root at repo level. Rejected — `IMPLEMENTATION-PLAN.md` places stories in `packages/ui` and page components in `apps/web`; two configs match package boundaries.
- **Port:** Ladle default is 61000; if both servers run via `bun run stories`, document port override (`--port`) in `e2e/README.md` or use sequential orchestration. Root script runs both filters in parallel — note conflict in README.

### 2. Root `stories` script orchestration

```json
"stories": "bun --filter @unveiled/ui stories & bun --filter @unveiled/web stories"
```

- **Alternative:** Single-package stories only. Rejected — page-level components (marketing sections, shell) live in `apps/web/app/components/` per plan.
- Empty story lists are acceptable for step 01; step 02 adds files.

### 3. Playwright at repo root

```
e2e/
  playwright.config.ts
  fixtures/
    base.ts       # extend test with locale default 'de'
    auth.ts       # loginAsUser, loginAsAdmin
    db.ts         # optional seed-state helper via navigation
  specs/
    smoke.spec.ts
  README.md
```

- **Location:** Repo root, not `apps/web` — matches `IMPLEMENTATION-PLAN.md` monorepo tree; tests span locale routing and future admin/member flows.
- **baseURL:** `process.env.SITE_URL ?? 'http://localhost:3000'`.
- **webServer:** Start `bun run dev` when `CI=true`; locally developer runs dev separately or relies on webServer in CI.
- **Browser:** Chromium project only for step 01; Firefox/WebKit deferred.

### 4. Auth fixtures — proximity selectors only

```typescript
// e2e/fixtures/auth.ts
export async function loginAsUser(page, { email, password }) {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
}
```

- Credentials from `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
- Fallbacks documented in `e2e/README.md` (e.g. create accounts via signup + SQL promote for admin) — not hardcoded secrets.
- **No** `data-testid` added to Better Auth UI or app markup.

### 5. Smoke spec

```typescript
// e2e/specs/smoke.spec.ts
test('Locale root redirect', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/de/);
});
```

- File naming: `smoke.spec.ts` (not tied to a feature file — harness validation only).
- Future specs: basename = Gherkin feature file (`static-pages.spec.ts` for `static-pages.feature`); `test()` title = `Scenario:` line verbatim.

### 6. Dependency versions

- Pin `@playwright/test` and `playwright` at root devDependencies (compatible pair, e.g. `^1.49.x`).
- Ladle: `@ladle/react` + `ladle` in `packages/ui` and `apps/web` devDependencies.
- `packages/ui` may need `react-dom`, `tailwindcss`, `@tailwindcss/vite` for ThemeDecorator if importing web globals — add minimal deps to compile stories.

### 7. `.env.example` additions

```
# --- Phase 4½ (Playwright E2E) ---
E2E_USER_EMAIL=
E2E_USER_PASSWORD=
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
```

## Risks / Trade-offs

- **[Ladle port conflict]** Running both story servers simultaneously binds default port → Document in README; developers run one package at a time or pass `--port`.
- **[Theme parity]** Importing `apps/web` CSS from `packages/ui` creates a dev-only cross-package path → Acceptable for stories; ThemeDecorator is dev-only, not shipped.
- **[Google OAuth in E2E]** Neon Auth Google flow not automatable in headless CI → Auth fixtures use email/password only; OAuth scenarios skipped in step 03 with explicit reason.
- **[webServer startup time]** `bun run dev` SSR warmup can be slow in CI → `webServer.timeout` ≥ 120s; reuse existing Vite warmup in `apps/web/vite.config.ts`.
- **[Workers vs local dev]** Playwright targets local Node SSR (`bun run dev`), not Workers deploy — Matches image upload and seed workflow; staging URL optional via `SITE_URL` for manual runs.

## Migration Plan

1. `bun install` — new Ladle and Playwright devDeps.
2. `bunx playwright install chromium` — one-time browser download (document in README).
3. No production deploy changes; no DB migrations.
4. Rollback: remove `e2e/`, Ladle configs, and root scripts — no runtime impact on deployed app.

## Open Questions

- Whether root `stories` should use a small `scripts/run-stories.ts` orchestrator with distinct ports instead of parallel `&` — defer to implementation; README must document either approach.
- Exact Better Auth UI label text for login form fields — verify against live `/de/login` when implementing auth fixtures.
