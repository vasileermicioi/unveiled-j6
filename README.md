# Unveiled Berlin

Greenfield rewrite of the Unveiled Berlin cultural-access membership platform.

## Stack

| Layer | Choice |
|---|---|
| Runtime / PM | Bun workspaces |
| App | HonoX + React SSR (`apps/web`) |
| UI | HeroUI v3 (Uber preset + brand tokens) |
| Lint / format | Biome |

Future phases add Neon Postgres, Neon Auth, Cloudflare R2, Stripe, and Resend via shared packages under `packages/`.

## Quick start

```bash
bun install
bun run dev      # start apps/web dev server
bun run build    # production build
bun run lint     # Biome check
bun run typecheck
```

## Monorepo layout

```text
apps/web/              @unveiled/web — deployable SSR app
packages/config/       @unveiled/config — shared tsconfig + Biome presets
docs/migration/        Product spec (source of truth)
.dev-plan/             Phased implementation plan
```

## Documentation

- **Agent instructions:** [`AGENTS.md`](./AGENTS.md)
- **Phased delivery plan:** [`.dev-plan/IMPLEMENTATION-PLAN.md`](./.dev-plan/IMPLEMENTATION-PLAN.md)
- **Product spec:** [`docs/migration/README.md`](./docs/migration/README.md)
- **Deployment:** [`apps/web/DEPLOYMENT.md`](./apps/web/DEPLOYMENT.md)

## Phase status

**Phase 0** — Foundation: monorepo, branded shell, locale routing, staging deploy pipeline.
