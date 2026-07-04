## Why

Phase 0 steps 01–04 deliver a locally runnable branded shell with locale routing and guest chrome, but the app still lacks real logo assets, a favicon, a staging deployment, and operator documentation. Without this final step, every subsequent phase lacks a shared deploy target and the client cannot click through a live demo — blocking the Phase 0 release gate and Phase 1 handoff.

## What Changes

- Add three logo SVG variants to `apps/web/public/logos/` per `docs/migration/ui/assets-inventory.md`.
- Add a favicon placeholder (`favicon.svg` and/or `favicon.ico`) and wire `<link rel="icon">` tags in the root document renderer.
- Update `Logo` component to render the black SVG via `<img>` (navbar default) while preserving `tone` prop for white/yellow variants.
- Add Node.js deployment config (Dockerfile + Railway config) and a GitHub Actions workflow for automated staging deploy on `main` push.
- Ensure production start binds to host-provided `PORT` after `bun run build`.
- Create `apps/web/DEPLOYMENT.md` (staging URL, build/start commands, env var table — explicitly none required for Phase 0).
- Create `apps/web/README.md` and root `README.md` with monorepo overview and local dev instructions.
- **Out of scope:** production domain cutover, Neon/Stripe/R2/Resend env vars, web manifest, OG image, Apple touch icons, Sentry, seed script.

## Capabilities

### New Capabilities

<!-- None — all requirements extend the existing platform-foundation spec. -->

### Modified Capabilities

- `platform-foundation`: Add requirements for logo static assets, favicon placeholder, staging deployment pipeline, deployment documentation, and Phase 0 release gate (staging demo acceptance).

## Impact

- **New files:** `apps/web/public/logos/*.svg`, `apps/web/public/favicon.svg`, `Dockerfile`, `railway.json` (or equivalent), `.github/workflows/deploy-staging.yml`, `apps/web/DEPLOYMENT.md`, `apps/web/README.md`, root `README.md`.
- **Modified files:** `apps/web/app/components/Logo.tsx` (text placeholder → `<img>`), `apps/web/app/routes/_renderer.tsx` (favicon link tags), possibly `apps/web/dist/index.js` PORT binding if not already handled.
- **Dependencies:** no new npm packages expected; Docker base image uses official Bun or Node.
- **Services:** staging host account (Railway recommended), optional `staging.unveiled.berlin` DNS.
- **Downstream:** closes Phase 0; Phase 1 (`phase-1-marketing-site`) begins with a stable staging URL documented in `DEPLOYMENT.md`.
- **Branch:** `phase-0-foundation-05` or parent `phase-0-foundation` per iteration convention.
