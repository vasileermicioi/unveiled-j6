## Context

Phase 0 step 01 delivered a Bun workspaces monorepo with `@unveiled/config` presets. Root scripts already target `@unveiled/web` for `dev` and `build`, but the package does not exist — those commands fail today. Step 02 introduces the single deployable application that all later phases build on.

Constraints from `AGENTS.md` and `.dev-plan/IMPLEMENTATION-PLAN.md`:
- HonoX + React 19 SSR at `apps/web` (`@unveiled/web`).
- Node.js runtime (not edge-only) for future `sharp` image processing.
- SSR pages under `app/routes/`; business logic in `packages/*` later.
- React/catalog versions from root `package.json` catalog.
- No HeroUI, Tailwind theme, locale routing, navbar, footer, or deployment config in this step.
- Package must not depend on future domain packages.

HonoX is alpha (zerover semver) — pin versions explicitly in `apps/web/package.json` rather than relying on unpinned latest.

## Goals / Non-Goals

**Goals:**

- `@unveiled/web` installable via `bun install` as a workspace member.
- `bun run dev` serves a minimal SSR page at `/` with scaffold text.
- `bun run build` produces a Node.js-compatible production bundle.
- `bun run typecheck` passes for `@unveiled/web`.
- File structure matches the IMPLEMENTATION-PLAN `apps/web` tree (routes only for now).
- Empty `public/` directory ready for step 05 assets.

**Non-Goals:**

- HeroUI, brand tokens, Work Sans, yellow page background (step 03).
- Locale routing `/:locale/*`, navbar, footer, 404 (step 04).
- Client islands, maps, or hydration (Phase 5+).
- CI/CD, `DEPLOYMENT.md`, env vars (step 05).
- Domain packages or API routes.

## Decisions

### 1. React renderer via `@hono/react-renderer`

Use `@hono/react-renderer` with React 19 from the root catalog — not hono/jsx. This matches the stack decision in `AGENTS.md` (React SSR) and avoids a renderer migration when HeroUI lands in step 03.

**Alternative considered:** hono/jsx for scaffold, migrate to React later. Rejected — unnecessary churn; React deps are already in the catalog.

### 2. SSR-only scaffold (no client entry yet)

Omit `app/client.ts` and island hydration for step 02. The `_renderer.tsx` wraps content in a minimal HTML shell without loading client JavaScript. Islands and `app/client.ts` are added when needed (Phase 5 MapLibre GL JS + OpenStreetMap map island).

**Alternative considered:** Include `client.ts` stub now. Rejected — adds vite client-mode build complexity without verification value in step 02.

### 3. Node.js build target via `@hono/vite-build/node`

Configure Vite with `@hono/vite-build/node` and `@hono/vite-dev-server/node` — not Cloudflare Workers. This satisfies the Node.js runtime requirement for future `sharp` usage and aligns with recommended hosting (Railway, Render, Fly.io).

```ts
// vite.config.ts (server mode)
import build from '@hono/vite-build/node'
import adapter from '@hono/vite-dev-server/node'
import honox from 'honox/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    'process.env': 'process.env', // preserve env vars at runtime (honox#307)
  },
  ssr: {
    external: ['react', 'react-dom'],
  },
  plugins: [
    honox({ devServer: { adapter } }),
    build(),
  ],
})
```

**Alternative considered:** `@hono/vite-build/bun`. Acceptable but IMPLEMENTATION-PLAN explicitly targets Node.js hosts for `sharp`; Node adapter is the safer default.

### 4. Package layout

```
apps/web/
├── app/
│   ├── global.d.ts          # @hono/react-renderer Props augmentation
│   ├── server.ts            # createApp() entry
│   └── routes/
│       ├── _renderer.tsx    # reactRenderer HTML shell
│       └── index.tsx        # GET / — scaffold page
├── public/                  # empty; assets in step 05
├── package.json
├── tsconfig.json
└── vite.config.ts
```

No `app/islands/`, `app/middleware/`, or `app/routes/api/` yet — added in later phases per IMPLEMENTATION-PLAN tree.

### 5. `apps/web/package.json` scripts and dependencies

```json
{
  "name": "@unveiled/web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hono/react-renderer": "^0.2.0",
    "hono": "^4.7.0",
    "honox": "^0.1.56",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@hono/vite-build": "^1.0.0",
    "@hono/vite-dev-server": "^0.18.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@unveiled/config": "workspace:*",
    "typescript": "catalog:",
    "vite": "^6.0.0"
  }
}
```

Pin `honox`/`hono` to current stable releases at install time; use `catalog:` for React and TypeScript.

**Start script note:** Production start runs from repo root via `cd apps/web/dist && node index.js` or a `start` script that `cd`s into `dist` — HonoX requires CWD in the output directory for static asset resolution.

Revised `start` script:

```json
"start": "node --import ./dist/index.js"
```

Or simpler — document that `start` runs `node dist/index.js` with CWD set to `apps/web/dist`. Use:

```json
"start": "cd dist && node index.js"
```

### 6. TypeScript config

```json
{
  "extends": "@unveiled/config/tsconfig.react.json",
  "compilerOptions": {
    "jsxImportSource": "react",
    "rootDir": ".",
    "noEmit": true
  },
  "include": ["app/**/*.ts", "app/**/*.tsx", "vite.config.ts"]
}
```

`jsxImportSource: "react"` is required for `@hono/react-renderer`.

### 7. Server and route files

**`app/server.ts`:**

```ts
import { createApp } from 'honox/server'
import { showRoutes } from 'hono/dev'

const app = createApp()

showRoutes(app)

export default app
```

**`app/routes/_renderer.tsx`:**

```tsx
import { reactRenderer } from '@hono/react-renderer'

export default reactRenderer(({ children, title }) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {title ? <title>{title}</title> : <title>Unveiled Berlin</title>}
      </head>
      <body>{children}</body>
    </html>
  )
})
```

**`app/routes/index.tsx`:**

```tsx
import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <main>
      <h1>Unveiled Berlin — scaffold</h1>
    </main>,
    { title: 'Unveiled Berlin — scaffold' },
  )
})
```

**`app/global.d.ts`:**

```ts
import '@hono/react-renderer'

declare module '@hono/react-renderer' {
  interface Props {
    title?: string
  }
}
```

### 8. Root workspace integration

No root `package.json` changes required — scripts already reference `@unveiled/web`. `@unveiled/config` keeps its no-op `typecheck` script; `@unveiled/web` adds a real `typecheck` so root `bun run --filter '*' typecheck` runs both.

### 9. Biome coverage

HonoX/Vite files under `apps/web/` are picked up automatically by root `biome check .` — no Biome config changes needed.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| HonoX alpha breaking changes | Pin `honox` version; upgrade deliberately in later phases |
| Version mismatch between honox/hono/vite plugins | Install `@hono/vite-build` and `@hono/vite-dev-server` compatible with pinned honox; verify build in tasks |
| `start` CWD requirement for static assets | Document in tasks; use `cd dist && node index.js` in start script |
| Root `typecheck` runs config no-op + web real check | Expected behavior; config package keeps echo script until it has TS sources |
| No client bundle yet | Acceptable for step 02; islands added when needed |

## Migration Plan

1. Create all `apps/web` files on branch `phase-0-foundation-02`.
2. Run `bun install` from repo root.
3. Verify `bun run dev` — curl `/` returns scaffold HTML.
4. Verify `bun run build` — completes without errors.
5. Verify `bun run typecheck` and `bun run lint` pass.
6. No production impact; additive change only.

## Open Questions

- None blocking step 02. Exact honox/hono/vite patch versions resolved at `bun add` time — pin whatever installs cleanly together.
