# AGENTS.md — Unveiled Berlin v2

Instructions for AI agents building the Unveiled Berlin rewrite. **Read this first**, then [`DESIGN.md`](DESIGN.md) for the **visual identity** ([Google Labs DESIGN.md format](https://github.com/google-labs-code/design.md)), then the linked product specs.

## What you are building

**Unveiled Berlin** is a curated cultural-access membership for Berlin: members pay a monthly subscription for credits, spend credits booking tickets to partner-venue events, and redeem at the door via secret codes. **MVP personas:** guest, **Members** (`USER`), **Admin** (`ADMIN`). **`PARTNER` is post-MVP** (portal/check-in parked; `partners` table = venue records managed by admin).

This is a **greenfield rewrite** on a new stack. The old Firebase SPA in the repo (if present) is **reference-only — do not extend it**.

Visual identity (tokens + rationale for agents): **[`DESIGN.md`](DESIGN.md)**. App SSR/file layout: [`docs/DESIGN.md`](docs/DESIGN.md).

---

## Source of truth

| Document | Purpose |
|---|---|
| [`docs/product/`](docs/product/README.md) | **Product spec (active SoT)** — charter, features, UI, schema, routes, BDD |
| [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](.dev-plan/IMPLEMENTATION-PLAN.mvp.md) | **Phased delivery plan (active)** — remaining MVP phases, remediation, agent prompts |
| [`DESIGN.md`](DESIGN.md) | **Visual identity** — YAML tokens + prose (Google Labs DESIGN.md format) |
| [`docs/product/extras/gaps-and-decisions.md`](docs/product/extras/gaps-and-decisions.md) | Consolidated changelog of decisions vs. the old app |
| [`.dev-plan/openspec_5step_proposals_guide.v2.md`](.dev-plan/openspec_5step_proposals_guide.v2.md) | Step-plan workflow for `.dev-plan/current-iteration/` |

**Ignore `openspec/` for product behavior** — canonical spec is `docs/product/`; active plan is `IMPLEMENTATION-PLAN.mvp.md`; phased step plans live in `.dev-plan/current-iteration/`. `openspec/changes/archive/` is optional historical workflow only; **`openspec/specs/` is not used** for product behavior.

When specs conflict, prefer the more specific doc for the topic (e.g. `seo-and-metadata.md` over `sitemap.md` for indexing rules). Do not reopen [`docs/product/CHARTER.md`](docs/product/CHARTER.md) Locked decisions unless the user explicitly asks.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime / PM | **Bun** (workspaces, scripts, test runner) |
| App | **HonoX + React SSR** — single deployable app at `apps/web/` |
| UI | **HeroUI** Uber reskin — visual SoT [`DESIGN.md`](DESIGN.md); detail [`docs/product/ui/design-tokens.md`](docs/product/ui/design-tokens.md) |
| Auth backend | **Neon Auth** (Better Auth hosted by Neon); `/api/auth/*` → `AUTH_URL` |
| Auth UI | **`@better-auth-ui/heroui`** + react/core — not shadcn |
| Database | **Neon Postgres** + **Drizzle** (`@unveiled/db`, `public` schema only) |
| Images | **Cloudflare R2** + `@unveiled/images` (six JPEG variants via `@standardagents/sip`) |
| Payments | **Stripe Billing** (`@unveiled/billing`) — Phase 6+ |
| Email | **Resend** (`@unveiled/email`) — Phase 6+ |
| Hosting | **Cloudflare Workers** for `apps/web` |
| Lint / format | **Biome** |

---

## Monorepo & code organization

```text
apps/web/          @unveiled/web   — HonoX routes, middleware, islands, API handlers
packages/config/   @unveiled/config
packages/db/       @unveiled/db
packages/auth/     @unveiled/auth
packages/images/   @unveiled/images
packages/ui/       @unveiled/ui     — shared HeroUI primitives + DS Ladle stories
packages/billing/  @unveiled/billing — Phase 6+
packages/email/    @unveiled/email   — Phase 6+
docs/product/                        — product SoT
DESIGN.md                            — visual identity (Google Labs format)
```

- **SSR pages and form POSTs** → `apps/web/app/routes/`
- **Business logic** → `packages/*`, not route files
- **Page UI** → `apps/web/app/components/` from HeroUI; routes wire data + `c.render()` only
- **Client islands** only where unavoidable → `apps/web/app/islands/`
- **Packages never depend on `apps/web`**
- **No separate admin/partner apps** — `/admin/*` in-app; `/partner/*` post-MVP

Phased rollout: [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](.dev-plan/IMPLEMENTATION-PLAN.mvp.md). App file layout: [`docs/DESIGN.md`](docs/DESIGN.md).

### Root commands

```bash
bun install
bun run dev          # start apps/web
bun run build
bun run lint
bun run typecheck
bun run db:generate  # Phase 2+
bun run db:migrate   # Phase 2+
bun run seed:demo    # Phase 4+
bun run stories      # Ladle
bun run test:e2e     # Playwright
```

---

## Hard rules (non-negotiable)

1. **SSR-only mutations** — every create/update/delete is a dedicated page with form POST. **No client-side-only modals** for mutations.
2. **Locale in URL** — `/` → 302 → `/de` or `/en`; all pages under `/:locale/*`.
3. **Scope to the current phase** — do not implement features from later phases. Deploy before finishing.
4. **Read before coding** — use the doc reading order below; feature files are behavioral source of truth.
5. **Match the spec verbatim** where copy is provided (`docs/product/ui/static-pages-content.md`, `docs/product/extras/content-i18n-inventory.md`).
6. **Yellow page background app-wide** — `#FAFF86` is the page backdrop on every route, not grey. White/cream cards float on top. See [`DESIGN.md`](DESIGN.md) and [`docs/product/ui/design-tokens.md`](docs/product/ui/design-tokens.md).
7. **Work Sans only** — no EK Notice Sans in the new app.
8. **HeroUI-only markup** — no raw HTML elements (`<section>`, `<p>`, `<a>`, `<button>`, `<h1>`, etc.) in routes or UI components. Use `@heroui/react` primitives (`Card`, `Link`, `Button`, `Heading`, `Paragraph`, `Surface`, `Chip`, …) or page-level components built entirely from HeroUI. Tailwind on HeroUI nodes is for **layout only** (`flex`, `grid`, `gap`, `max-w-*`, positioning) — never for colors, borders, shadows, or typography that belong in the theme. Exceptions: `<script type="application/ld+json">` for structured data; `<img>` inside HeroUI wrappers where no HeroUI image primitive applies. Design-system home: [`docs/product/ui/design-system.md`](docs/product/ui/design-system.md) (`@unveiled/ui` + Theme Overview).
9. **Theme-only visual styling** — colors, borders, radius, shadows, typography, and interactive hover states belong in `apps/web/app/styles/globals.css` (`@theme` tokens + `@layer components` overrides targeting HeroUI BEM classes, after `@import "@heroui/styles"`). Adjust look-and-feel by changing theme tokens — not ad-hoc per-route color/border/shadow/hover classes. Normative visual tokens: [`DESIGN.md`](DESIGN.md).
10. **Public event detail pages** — `/events/:id` is indexable without auth (Phase 4+). Booking and member feed stay gated.
11. **Atomic booking transaction** — only the Booking domain writes bookings/ledger for purchases; waitlist promotion calls the same path.
12. **Partner scoping** — when partner portal ships (post-MVP), every partner query/write filtered by session `partnerId`; never trust client-supplied `partnerId`.
13. **BDD / Playwright** — Gherkin under `docs/product/features/` is behavioral SoT; proximity/layout selectors only — see [`docs/product/testing/bdd-and-e2e.md`](docs/product/testing/bdd-and-e2e.md).
14. **No radios or checkboxes** — prefer HeroUI `Select` (see MVP plan hard rules).

---

## How to read the docs

1. **[`AGENTS.md`](AGENTS.md)** (this file) — hard rules, phase workflow
2. **[`DESIGN.md`](DESIGN.md)** — visual identity (Google Labs DESIGN.md: YAML tokens + rationale)
3. Then follow [`docs/product/README.md`](docs/product/README.md) order:

   1. **`CHARTER.md`** — MVP personas, locked decisions, gap register, post-MVP parking lot
   2. **`product/vision-and-domains.md`** — product vision, bounded contexts, boundary rules, v1 non-goals
   3. **`features/*.feature`** — Gherkin scenarios per domain (behavioral source of truth; partner under `features/post-mvp/`)
   4. **`sitemap/sitemap.md`** — route map for the new app
   5. **`ui/`** — design tokens, design system, component map, app shell, static copy, assets
   6. **`database/schema-overview.md`** — entities, fields, relationships for Drizzle
   7. **`extras/`** — auth matrix, SEO, images, pagination, integrations, i18n, decisions
   8. **`product/user-journeys.md`** + **`testing/bdd-and-e2e.md`** — journeys and Playwright/BDD contract
   9. **`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`** — phased delivery for remaining MVP work

App UI implementation detail (SSR, content modules, islands): [`docs/DESIGN.md`](docs/DESIGN.md) · index: [`docs/README.md`](docs/README.md).

---

## Implementation phases

Work **one phase per agent session**. Branch: `phase-N-short-name`. Merge to `main` only after staging deploy succeeds.

**Phases 0–5 are shipped.** Remaining work (remediation Phase 5.5, then Phases 6–8) is defined only in [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](.dev-plan/IMPLEMENTATION-PLAN.mvp.md) — do **not** follow the historical Phase 8 partner portal from the old plan. Partner portal / check-in is **post-MVP**.

| Block | Focus |
|---|---|
| **0–5** | Shipped baseline (foundation → member discovery) |
| **5.5** | Spec alignment & debt (UI DS, BDD, sitemap) — required before Phase 6 |
| **6** | Stripe + atomic booking |
| **7** | Waitlist + profile/billing |
| **8** | Admin ops, GDPR, SEO polish |
| **Post-MVP** | Partner portal + check-in |

Phase prompts, done-when criteria, and demo scripts: [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](.dev-plan/IMPLEMENTATION-PLAN.mvp.md).

### Phased package rollout

| Phase | Create |
|---|---|
| 0–1 | `apps/web`, `packages/config` |
| 2 | `packages/db`, `packages/auth`; auth UI deps in `apps/web` |
| 4 | `packages/images`, `packages/ui`, `scripts/seed-demo.ts` |
| 6–7 | `packages/billing`, `packages/email` |

---

## Phase workflow

Each session:

1. Identify the **current phase** and read its scope in `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`.
2. For UI work, read [`DESIGN.md`](DESIGN.md) (visual identity) before changing theme or components.
3. Read the **docs listed** for that phase under `docs/product/` (feature files + extras).
4. Implement **only** that phase's scope.
5. Run `bun run lint` and `bun run typecheck`.
6. **Deploy to staging** and update `apps/web/DEPLOYMENT.md` (env vars, demo accounts).
7. **Stop** — do not start the next phase.

Repo conventions: keep `DEPLOYMENT.md` current; document demo credentials; use Europe/Berlin timezone for date logic.

---

## Auth setup (Phase 2+)

Neon Auth hosts the **Better Auth** backend. HonoX `/api/auth/*` **forwards** requests to `AUTH_URL` (Neon-provided env var) so `better-auth-ui` works same-origin without CORS. Do **not** reimplement Better Auth routes or model the `neon_auth` schema in Drizzle — Drizzle manages `public` tables only (`users`, `subscriptions`, …).

```bash
cd apps/web && bun add @better-auth-ui/heroui@latest @better-auth-ui/react@latest @better-auth-ui/core@latest
```

- Use **`@better-auth-ui/heroui`** components on auth pages — inherits HeroUI Uber theme reskin
- Use **`@better-auth-ui/react`** hooks for session/state; client base path is `/api/auth`
- Do **not** install `@better-auth-ui/shadcn` or add shadcn/ui for auth
- Google OAuth: configured in Neon Auth project settings, not app env vars
- On first signup: `role=USER`, 17 credits, `INACTIVE` subscription, `onboarding_complete=false`
- `public.users.id` stores the Better Auth user id from the session API (same as Neon Auth user id)

Session middleware and role guards live in `@unveiled/auth`, consumed by `apps/web` middleware.

---

## Domain boundary rules (summary)

From [`docs/product/product/vision-and-domains.md`](docs/product/product/vision-and-domains.md) — enforce in code:

- **Booking** is the only writer of bookings/ledger for purchases (except admin comp tickets, which skip credit charge but use the same capacity/booking path).
- **Waitlist promotion** calls Booking's transaction — never duplicate booking logic.
- **Membership & Billing** is the single source of truth for "can this user book?" — checked inside the booking transaction.
- **`USER` accounts** — self-service signup only. **`ADMIN`** — provisioned out-of-band, never self-service. **`PARTNER`** — post-MVP.
- **Partner operations** (post-MVP) — always scoped by authenticated `partnerId`.

Full permission matrix: [`docs/product/extras/authorization-matrix.md`](docs/product/extras/authorization-matrix.md).

---

## UI & design

**Start here for any UI task:**

1. [`DESIGN.md`](DESIGN.md) — visual identity (tokens + do/don't)
2. [`docs/product/ui/design-tokens.md`](docs/product/ui/design-tokens.md) — expanded brand/theme narrative
3. [`docs/product/ui/design-system.md`](docs/product/ui/design-system.md) — `@unveiled/ui` + Theme Overview
4. [`docs/DESIGN.md`](docs/DESIGN.md) — SSR app architecture, file layout, content modules
5. [`docs/README.md`](docs/README.md) — agent UI implementation index (`COMPONENTS`, `PATTERNS`, `UX_RULES`)
6. [`docs/DESIGN_TOKENS.json`](docs/DESIGN_TOKENS.json) — machine-readable tokens

- **Markup:** HeroUI only — see hard rules §8–9.
- **Theme:** Uber reskin in `apps/web/app/styles/globals.css` — tokens in product `design-tokens.md`.
- **Primary CTAs:** `className="button button--primary …"` — yellow + dark text; hover inverts via theme.
- **Secondary CTAs:** `className="button button--secondary …"` — white + dark text; hover inverts via theme.
- **Tailwind:** layout and spacing on HeroUI nodes only.
- **Page background:** `brand-yellow` (`#FAFF86`) on every route.
- **App shell / static copy:** [`docs/product/ui/app-shell.md`](docs/product/ui/app-shell.md), [`docs/product/ui/static-pages-content.md`](docs/product/ui/static-pages-content.md), [`docs/product/extras/content-i18n-inventory.md`](docs/product/extras/content-i18n-inventory.md).
- **Credits do NOT roll over** — fix any "credits roll over" marketing copy (MVP Phase 8).

---

## Environment variables

Document all required vars in `apps/web/DEPLOYMENT.md`. Key vars by phase:

| Phase | Variables |
|---|---|
| 2+ | `DATABASE_URL`, `AUTH_URL` |
| 4+ | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL` — repo-root `.env` (see `.env.example`); `S3_ENDPOINT` is R2 host only, `IMAGE_PUBLIC_BASE_URL` is public R2.dev/custom domain |
| 5+ | _(none)_ — event map uses **MapLibre GL JS** + **OpenStreetMap** tiles; no API key |
| 6+ | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN` |
| 6+ | `RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL` |
| 8+ | `SENTRY_DSN` (optional) |

Full mapping: [`docs/product/extras/integrations-and-config.md`](docs/product/extras/integrations-and-config.md).

---

## v1 non-goals (do not build)

See also the charter and [`docs/product/product/vision-and-domains.md`](docs/product/product/vision-and-domains.md).

- Native mobile app
- Multi-city / city selector
- À la carte credit purchases or referral program
- Real-time chat support (email only: `support@unveiled.berlin`)
- Algorithmic feed ranking (filters only; preferences captured for later)
- Newsletter product
- Partner portal / check-in (post-MVP)

---

## Common pitfalls

| Pitfall | Correct approach |
|---|---|
| Grey page background | Yellow (`#FAFF86`) app-wide — [`docs/product/ui/design-tokens.md`](docs/product/ui/design-tokens.md) |
| Client-side mutation modals | Dedicated SSR pages + form POST |
| shadcn auth components | `@better-auth-ui/heroui` only |
| Modeling `neon_auth` in Drizzle | Drizzle manages `public` schema only; Neon Auth owns `neon_auth` |
| Auth-gated `/events/:id` | Public detail page; gate `/events/:id/book` and `/events` feed |
| Business logic in route files | Extract to `packages/*` |
| Trusting client `partnerId` | Derive from session |
| Mocked Stripe checkout | Real Stripe Billing (Phase 6+) |
| Base64 images in DB | R2 + 6 JPEG variants via `@unveiled/images` |
| Scope creep into next phase | Deploy current phase, stop |
| Custom CSS / per-route styling | HeroUI + theme tokens; Tailwind layout only |
| Raw HTML tags in UI | HeroUI primitives or compositions built from them |
| Hard offset drop shadows | No shadows — flat bordered surfaces via theme |
| Treating archived OpenSpec paths as SoT | Use `docs/product/` + `IMPLEMENTATION-PLAN.mvp.md` |

---

## Deliverables checklist (every phase)

- [ ] Scope matches current phase only
- [ ] Spec docs for this phase were read (`docs/product/` + MVP plan)
- [ ] `bun run lint` and `bun run typecheck` pass
- [ ] Staging deploy succeeds
- [ ] `apps/web/DEPLOYMENT.md` updated
- [ ] Demo script from implementation plan works on staging

---

## Quick reference links

- **Visual identity (DESIGN.md format)** → [`DESIGN.md`](DESIGN.md)
- **Product SoT** → [`docs/product/README.md`](docs/product/README.md)
- **MVP delivery plan** → [`.dev-plan/IMPLEMENTATION-PLAN.mvp.md`](.dev-plan/IMPLEMENTATION-PLAN.mvp.md)
- **App UI architecture** → [`docs/DESIGN.md`](docs/DESIGN.md)
- **Agent UI docs** → [`docs/README.md`](docs/README.md)
- **Design tokens (narrative)** → [`docs/product/ui/design-tokens.md`](docs/product/ui/design-tokens.md) + [`docs/DESIGN_TOKENS.json`](docs/DESIGN_TOKENS.json)
- **Design system** → [`docs/product/ui/design-system.md`](docs/product/ui/design-system.md)
- Product vision & domains → [`docs/product/product/vision-and-domains.md`](docs/product/product/vision-and-domains.md)
- User journeys → [`docs/product/product/user-journeys.md`](docs/product/product/user-journeys.md)
- Route map → [`docs/product/sitemap/sitemap.md`](docs/product/sitemap/sitemap.md)
- Database schema → [`docs/product/database/schema-overview.md`](docs/product/database/schema-overview.md)
- Decisions log → [`docs/product/extras/gaps-and-decisions.md`](docs/product/extras/gaps-and-decisions.md)
- BDD / Playwright contract → [`docs/product/testing/bdd-and-e2e.md`](docs/product/testing/bdd-and-e2e.md)
- Acceptance (spec rewrite) → [`docs/product/ACCEPTANCE.md`](docs/product/ACCEPTANCE.md)
