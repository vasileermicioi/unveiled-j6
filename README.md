# Unveiled Berlin

Greenfield rewrite of the Unveiled Berlin cultural-access membership platform.

## Stack

| Layer | Choice |
|---|---|
| Runtime / PM | Bun workspaces |
| App | HonoX + React SSR (`apps/web`) |
| UI | HeroUI v3 (Uber preset + brand tokens) |
| Data / auth | Neon Postgres + Neon Auth + Drizzle |
| Images | Cloudflare R2 + `@unveiled/images` (client Pica → prebuilt store) |
| Lint / format | Biome |

Payments (Stripe) and email (Resend) land in remaining MVP phases via `packages/billing` and `packages/email`.

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
packages/*             shared packages (db, auth, images, ui, …)
docs/product/          Product spec (active SoT)
.dev-plan/             IMPLEMENTATION-PLAN.mvp.md + openspec_5step_proposals_guide.v2.md
e2e/                   Playwright ↔ docs/product/features
DESIGN.md              UI visual identity only (tokens / brand)
```

## Documentation

- **Agent instructions:** [`AGENTS.md`](./AGENTS.md)
- **Product spec:** [`docs/product/README.md`](./docs/product/README.md)
- **MVP delivery plan:** [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](./.dev-plan/IMPLEMENTATION-PLAN.mvp.md)
- **UI visual identity:** [`DESIGN.md`](./DESIGN.md) (brand tokens — not product or app architecture)
- **App SSR / file layout:** [`docs/DESIGN.md`](./docs/DESIGN.md)
- **Deployment:** [`apps/web/DEPLOYMENT.md`](./apps/web/DEPLOYMENT.md)

## Phase status

**Phases 0–5 shipped.** Next: Phase 5.5 remediation, then Phases 6–8 — see [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](./.dev-plan/IMPLEMENTATION-PLAN.mvp.md).
