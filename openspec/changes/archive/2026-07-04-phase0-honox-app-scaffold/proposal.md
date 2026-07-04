## Why

Phase 0 step 01 established the Bun workspaces monorepo and shared config presets, but root `dev`/`build`/`typecheck` scripts still have no target — `@unveiled/web` does not exist. Step 02 creates the single deployable HonoX + React SSR application so the team can verify the runtime stack (`bun run dev`, `bun run build`) before brand theming, locale routing, and deployment land in later Phase 0 steps.

## What Changes

- Create `apps/web` (`@unveiled/web`) as the sole deployable application with HonoX + React 19 SSR.
- Add `apps/web/package.json` with `dev`, `build`, `start`, and `typecheck` scripts; dependencies on `honox`, `hono`, `@hono/react-renderer`, `react`, and `react-dom` (catalog versions).
- Add `apps/web/tsconfig.json` extending `@unveiled/config/tsconfig.react.json` with `jsxImportSource: "react"`.
- Scaffold HonoX app structure: `app/server.ts`, `app/global.d.ts`, `app/routes/_renderer.tsx`, `app/routes/index.tsx`, `vite.config.ts`.
- Add minimal SSR index route returning scaffold copy ("Unveiled Berlin — scaffold") — replaced by locale routing in step 04.
- Create empty `apps/web/public/` directory for future static assets.
- Root workspace scripts (`dev`, `build`, `typecheck`) become functional via the new package.
- **Out of scope:** HeroUI, Tailwind/brand tokens, Work Sans, locale routing, navbar/footer, 404, deployment config, domain packages (`@unveiled/db`, `@unveiled/auth`, etc.), client islands.

## Capabilities

### New Capabilities

<!-- None — all requirements extend the existing platform-foundation spec. -->

### Modified Capabilities

- `platform-foundation`: Add requirements for the single deployable SSR application at `apps/web`, route file convention under `app/routes/`, and Node.js runtime target (not edge-only).

## Impact

- **New files:** `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/app/**`, `apps/web/public/`.
- **Dependencies:** `honox`, `hono`, `@hono/react-renderer`, `@hono/vite-build`, `@hono/vite-dev-server`, `react`, `react-dom`, `@types/react`, `@types/react-dom`, `vite`, `typescript` (dev).
- **Root scripts:** `bun run dev`, `bun run build`, and `bun run typecheck` become operational (previously stubbed or no-op).
- **Downstream:** `phase0-foundation-03-theme-and-design-system` consumes this scaffold; step 04 adds locale routing and app shell.
- **Branch:** `phase-0-foundation-02` or parent `phase-0-foundation` per iteration convention.
