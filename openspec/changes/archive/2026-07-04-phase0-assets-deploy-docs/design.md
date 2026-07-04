## Context

Phase 0 steps 01–04 delivered a Bun workspaces monorepo, HonoX SSR app, HeroUI brand theme, locale routing, and guest app shell. The `Logo` component currently renders a styled text fallback (`UNVEILED`) because SVG assets were deferred to step 05. No `apps/web/public/` assets, deployment config, or operator docs exist yet — staging cannot be demoed and Phase 1 has no deploy target.

Current state:
- `apps/web/app/components/Logo.tsx` — text fallback, `tone` prop implemented
- `apps/web/app/routes/_renderer.tsx` — no favicon `<link>` tags
- `apps/web/package.json` — `start`: `cd dist && node index.js`; build uses `@hono/vite-build/node` with hardcoded port `3000` in generated `dist/index.js`
- No `Dockerfile`, CI workflow, `DEPLOYMENT.md`, or root `README.md`
- Logo SVG source files are not in the rewrite repo; `docs/migration/ui/assets-inventory.md` documents the three required filenames and Logo component contract

Constraints from `AGENTS.md` and iteration doc:
- HonoX SSR requires Node.js — no edge-only/static hosts
- Phase 0 has no required application env vars (no secrets in repo)
- One staging URL maintained across all phases
- Web manifest, OG image, Apple touch icons deferred to Phase 1+

## Goals / Non-Goals

**Goals:**

- Serve three logo SVGs from `apps/web/public/logos/` and update `Logo` to render `<img>` per assets inventory
- Add favicon placeholder and wire in root document head
- Deploy to a Node.js staging host with automated CI on `main` push (or documented manual fallback)
- Bind production server to `process.env.PORT` for host compatibility
- Write `apps/web/DEPLOYMENT.md`, `apps/web/README.md`, and root `README.md`
- Pass Phase 0 release gate: staging demo with brand, shell, locale switch, no console errors

**Non-Goals:**

- Production domain cutover
- Neon, Stripe, R2, Resend, Sentry env vars
- Web app manifest, OG image, Apple touch icons (Phase 1+)
- Seed script (Phase 4)
- Extracting shell to `@unveiled/ui` (Phase 4)

## Decisions

### 1. Staging host — Railway

**Choice:** Railway for staging deployment.

**Rationale:** Railway supports Node.js/Bun Docker deploys, GitHub integration, automatic `PORT` injection, and custom domains (`staging.unveiled.berlin`). Render and Fly.io are viable alternatives, but Railway offers the simplest GitHub Actions → deploy flow for a single SSR service without extra orchestration.

**Alternative considered:** Render — good free tier but slower cold starts; Fly.io — excellent but requires more `fly.toml` ceremony for a Phase 0 placeholder.

**Artifacts:** `Dockerfile` (multi-stage Bun build), `railway.json` (start command + health check), `.github/workflows/deploy-staging.yml` (build + deploy via Railway CLI or GitHub integration).

### 2. PORT binding — override vite-build entry hook

**Choice:** Configure `@hono/vite-build/node` in `vite.config.ts` with a custom `entryContentAfterHooks` that emits:

```ts
serve({ fetch: app.fetch, port: Number(process.env.PORT) || 3000 })
```

**Rationale:** The default `@hono/vite-build/node` plugin bakes `port: 3000` at build time. Railway and Render inject `PORT` at runtime. Overriding the after-build hook is the minimal change — no post-build sed, no duplicate server entry.

**Alternative considered:** Hardcode port 3000 in Railway service config — rejected because it fights host conventions and breaks portability to Render/Fly.io.

### 3. Logo assets — copy from source or create placeholders

**Choice:** Attempt to copy the three SVGs from the old Firebase SPA `public/logos/` if present in the workspace or a linked reference repo; otherwise create minimal placeholder SVGs with correct filenames and viewBox `0 0 766.1 179.9` containing "UNVEILED" wordmark geometry.

**Rationale:** Step 04 intentionally used text fallback so layout could ship without assets. Step 05 must eliminate navbar 404s. Placeholders unblock deploy; real Illustrator exports can replace them without code changes.

**Logo component update:**

```tsx
const src = `/logos/unveiled-logo-${tone}.svg`;
return <img src={src} alt="Unveiled" className={`h-[1.1em] w-auto ${className}`} />;
```

Drop text fallback once SVGs are in `public/logos/` (or keep fallback only if file missing — prefer requiring files exist per spec).

### 4. Favicon — SVG placeholder

**Choice:** Add `apps/web/public/favicon.svg` — simple brand-dark (`#202621`) square with white "U" letterform. Wire in `_renderer.tsx`:

```tsx
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

**Rationale:** SVG favicon is sufficient for Phase 0; `.ico` is optional. Assets inventory marks favicon as a known gap — placeholder acceptable, not final brand artwork.

### 5. Static file serving — honox built-in

**Choice:** Rely on HonoX/`@hono/vite-build` static serving for `public/` assets (logos, favicon). No additional static middleware in Phase 0.

**Rationale:** The generated `dist/index.js` already mounts `serveStatic` for the dist root. Files in `apps/web/public/` are copied to dist during build per HonoX convention.

### 6. CI/CD — GitHub Actions deploy on `main`

**Choice:** `.github/workflows/deploy-staging.yml` triggered on push to `main`:
1. Checkout, setup Bun
2. `bun install`, `bun run lint`, `bun run typecheck`, `bun run build`
3. Deploy to Railway via `RAILWAY_TOKEN` repository secret

**Rationale:** Automated deploy matches implementation plan ("prefer automated deploy on `main`"). Lint/typecheck gates prevent broken deploys.

**Manual fallback:** If Railway token not yet configured, document `railway up` steps in `DEPLOYMENT.md` and leave workflow file ready with a comment noting required secrets.

### 7. Documentation structure

**`apps/web/DEPLOYMENT.md`:**
- Staging URL (placeholder until first deploy completes)
- Host: Railway
- Build: `bun run build` (from repo root)
- Start: `bun run start` (from `apps/web`, or Docker CMD equivalent)
- Env vars table: `PORT` (host-injected, no value needed locally beyond default 3000); note "no application secrets required for Phase 0"
- Future phases section with empty rows for Phase 2+ vars

**`apps/web/README.md`:**
- Local dev: `bun run dev` from root
- Structure pointer: `app/routes/`, `app/components/`, link to `docs/migration/`

**Root `README.md`:**
- Monorepo overview, stack summary, link to `.dev-plan/IMPLEMENTATION-PLAN.md`

## Risks / Trade-offs

- **[Logo source unavailable]** → Create placeholder SVGs with correct filenames; document in `DEPLOYMENT.md` that final brand vectors replace placeholders before client-facing marketing (Phase 1).
- **[Railway account/token not configured]** → Document manual deploy procedure; CI workflow fails until `RAILWAY_TOKEN` secret is added — acceptable blocker, not a code blocker.
- **[Staging domain DNS pending]** → Use Railway-generated `*.up.railway.app` URL initially; update `DEPLOYMENT.md` when `staging.unveiled.berlin` is mapped.
- **[Hardcoded port regression]** → Verify `entryContentAfterHooks` override in local prod test: `PORT=4000 bun run start` responds on 4000.
- **[public/ not copied to dist]** → Verify logo/favicon return 200 after `bun run build && bun run start`; fix static paths in vite/honox config if needed.

## Migration Plan

1. Add logo SVGs and favicon to `apps/web/public/`
2. Update `Logo.tsx` and `_renderer.tsx`
3. Fix PORT binding in `vite.config.ts`
4. Add `Dockerfile`, `railway.json`, GitHub workflow
5. Deploy to Railway; capture staging URL
6. Write docs; run local prod verification (`build` → `start` → curl `/de`)
7. Run `bun run lint` and `bun run typecheck`
8. Mark Phase 0 complete in iteration guide; hand off staging URL for Phase 1

**Rollback:** Revert deploy on Railway to previous image; no database or state to migrate.

## Open Questions

- **Logo SVG source location:** Are the Illustrator exports available outside this repo (old Firebase SPA checkout, design drive)? If yes, copy verbatim; if no, placeholders ship in this change.
- **Railway project provisioning:** Who creates the Railway project and adds `RAILWAY_TOKEN` to GitHub secrets? Operator task — document steps in `DEPLOYMENT.md`.
- **Staging custom domain:** Is `staging.unveiled.berlin` DNS already delegated? If not, use Railway default URL until DNS is ready.
