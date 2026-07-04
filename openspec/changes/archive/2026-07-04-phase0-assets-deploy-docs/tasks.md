## 1. Pre-flight

- [x] 1.1 Confirm steps 01–04 verification commands pass locally (`bun run dev`, `build`, `lint`, `typecheck`)
- [x] 1.2 Read `proposal.md`, `design.md`, and `specs/platform-foundation/spec.md`
- [x] 1.3 Read `docs/migration/ui/assets-inventory.md` (logos, favicon gap, Logo component contract)
- [x] 1.4 Locate logo SVG source files (old app `public/logos/` or design repo) or confirm placeholder strategy

## 2. Static assets

- [x] 2.1 Create `apps/web/public/logos/` and add `unveiled-logo-black.svg`, `unveiled-logo-white.svg`, `unveiled-logo-yellow.svg` (copy or placeholder)
- [x] 2.2 Add `apps/web/public/favicon.svg` placeholder (brand-dark square with "U")
- [x] 2.3 Update `apps/web/app/components/Logo.tsx` — render `<img src="/logos/unveiled-logo-{tone}.svg">` per assets inventory (`h-[1.1em] w-auto`)
- [x] 2.4 Update `apps/web/app/routes/_renderer.tsx` — add `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` in document head

## 3. PORT binding and production start

- [x] 3.1 Update `apps/web/vite.config.ts` — override `@hono/vite-build/node` `entryContentAfterHooks` to use `Number(process.env.PORT) || 3000`
- [x] 3.2 Verify local prod: `bun run build && PORT=4000 bun run start` — server responds on port 4000, `/de` serves themed shell
- [x] 3.3 Verify logo and favicon return HTTP 200 after production build (`curl -I /logos/unveiled-logo-black.svg`, `/favicon.svg`)

## 4. Deployment config

- [x] 4.1 Create multi-stage `Dockerfile` at repo root (Bun install → build → Node/Bun runtime, `WORKDIR` apps/web, expose PORT)
- [x] 4.2 Create `railway.json` with start command, health check path (`/de`), and restart policy
- [x] 4.3 Create `.github/workflows/deploy-staging.yml` — on push to `main`: install, lint, typecheck, build, deploy to Railway (document `RAILWAY_TOKEN` secret requirement)
- [x] 4.4 Provision Railway staging service (or document manual `railway up` procedure if token deferred)
- [ ] 4.5 Deploy to staging; capture and record staging URL

## 5. Documentation

- [x] 5.1 Create `apps/web/DEPLOYMENT.md` — host (Railway), staging URL, build/start commands, env var table (PORT host-injected; no app secrets for Phase 0; future-phase rows empty)
- [x] 5.2 Create `apps/web/README.md` — local dev (`bun run dev` from root), project structure, link to `docs/migration/`
- [x] 5.3 Create or update root `README.md` — monorepo overview, stack summary, link to `.dev-plan/IMPLEMENTATION-PLAN.md`

## 6. Validation

- [x] 6.1 `bun run build` — succeeds
- [x] 6.2 `bun run start` (post-build) — serves `/de` locally with navbar, footer, yellow background
- [x] 6.3 Browser check: logo loads without 404, favicon appears in tab, no console errors on `/de` and `/en`
- [ ] 6.4 Staging URL: `/` redirects to `/de` or `/en`; shell renders; language switch works; no console errors
- [x] 6.5 `bun run lint` and `bun run typecheck` — pass
- [x] 6.6 Confirm no secrets or `.env` values committed

## 7. Wrap-up

- [x] 7.1 Mark Phase 0 step 05 (and parent Phase 0) done in `.dev-plan/current-iteration/` guides
- [x] 7.2 Hand off staging URL in `DEPLOYMENT.md` for Phase 1 agent
- [ ] 7.3 Commit on branch `phase-0-foundation-05` (or parent `phase-0-foundation`)
