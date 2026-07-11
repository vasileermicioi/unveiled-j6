# @unveiled/web

Single deployable HonoX + React SSR application for Unveiled Berlin.

## Local development

From the **repository root**:

```bash
bun install
bun run dev
```

Dev server starts Vite + HonoX (default port from Vite, typically `5173`).

## Scripts

| Command | Where | Purpose |
|---|---|---|
| `bun run dev` | root | Start dev server |
| `bun run build` | root | Production build |
| `bun run start` | `apps/web` | Serve built SSR app (`dist/index.js`) |
| `bun run typecheck` | root | TypeScript check all workspaces |
| `bun run lint` | root | Biome lint/format check |

## Project structure

```text
apps/web/
├── app/
│   ├── routes/          # HonoX SSR pages and layouts
│   ├── components/      # Shared React components (shell, Logo, …)
│   ├── islands/         # Client islands (hydrated selectively)
│   ├── lib/             # Locale helpers, copy strings
│   └── styles/          # Global CSS (Tailwind + HeroUI + brand tokens)
├── public/              # Static assets (logos, favicon)
├── dist/                # Production build output (gitignored)
├── DEPLOYMENT.md        # Staging URL, env vars, deploy steps
└── package.json
```

## Spec and design docs

Product spec and UI copy live in [`docs/product/`](../../docs/product/README.md). Implementation phases: [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](../../.dev-plan/IMPLEMENTATION-PLAN.mvp.md). Visual identity: [`DESIGN.md`](../../DESIGN.md).

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for Railway staging setup, env vars, and verification checklist.
