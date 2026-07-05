# AGENTS.md — Unveiled Berlin v2

Instructions for AI agents building the Unveiled Berlin rewrite. Read this first, then follow the linked specs.

## What you are building

**Unveiled Berlin** is a curated cultural-access membership for Berlin: members pay a monthly subscription for credits, spend credits booking tickets to partner-venue events, and redeem at the door via secret codes. Three personas: **Members** (`USER`), **Partners** (`PARTNER`), **Admin** (`ADMIN`).

This is a **greenfield rewrite** on a new stack. The old Firebase SPA in the repo (if present) is **reference-only — do not extend it**.

---

## Source of truth

| Document | Purpose |
|---|---|
| [`docs/migration/`](docs/migration/README.md) | **Product spec** — features, UI, schema, routes, decisions |
| [`.dev-plan/IMPLEMENTATION-PLAN.md`](.dev-plan/IMPLEMENTATION-PLAN.md) | **Phased delivery plan** — scope, agent prompts, monorepo layout |
| [`docs/migration/extras/gaps-and-decisions.md`](docs/migration/extras/gaps-and-decisions.md) | Consolidated changelog of every decision vs. the old app |

**Ignore `openspec/`** — it documents the old stack.

When specs conflict, prefer the more specific doc for the topic (e.g. `seo-and-metadata.md` over `sitemap.md` for indexing rules). All gaps in the old app are **already decided** — do not reopen them unless the user explicitly asks.

---

## Stack

| Layer | Choice |
|---|---|
| Runtime / PM | **Bun** (workspaces, scripts, test runner) |
| App | **HonoX + React SSR** — single deployable app at `apps/web/` |
| UI | **HeroUI** — re-skinned **Uber** theme preset ([`design-tokens.md`](design-tokens.md)) |
| Auth backend | **Neon Auth** (Better Auth backend hosted by Neon); `/api/auth/*` forwards to `AUTH_URL` |
| Auth UI | **`@better-auth-ui/heroui`** + `@better-auth-ui/react` + `@better-auth-ui/core` — **HeroUI variant only, not shadcn** |
| Database | **Neon Postgres** + **Drizzle ORM** (`@unveiled/db`) |
| Images | **Cloudflare R2** + `sharp` (`@unveiled/images`) |
| Payments | **Stripe Billing** (`@unveiled/billing`) |
| Email | **Resend** (`@unveiled/email`) |
| Lint / format | **Biome** |

**Hosting:** Node.js-capable host (Railway, Render, Fly.io) — HonoX SSR + `sharp` require Node.

---

## Monorepo layout

Bun workspaces. **One deployable app**; shared packages appear as phases require them.

```text
apps/web/          @unveiled/web   — HonoX routes, middleware, islands, API handlers
packages/config/   @unveiled/config — shared tsconfig + Biome presets
packages/db/       @unveiled/db     — Drizzle schema + migrations, `public` schema only (Phase 2+)
packages/auth/     @unveiled/auth   — session + role guards (Phase 2+)
packages/images/   @unveiled/images — sharp + R2 pipeline (Phase 4+)
packages/ui/       @unveiled/ui     — EventCard, shared components (Phase 4+)
packages/billing/  @unveiled/billing — Stripe (Phase 6+)
packages/email/    @unveiled/email  — Resend templates (Phase 6+)
scripts/seed-demo.ts                 — demo seed (Phase 4+)
docs/migration/                      — product spec
```

### Code organization rules

- **SSR pages and form POSTs** → `apps/web/app/routes/`
- **Business logic** → `packages/*`, not route files
- **Page UI** → `apps/web/app/components/` composed from HeroUI primitives; routes wire data + `c.render()` only
- **Client islands only** where unavoidable (maps, accordions, drawers, etc.) → `apps/web/app/islands/`
- **Packages never depend on `apps/web`**
- **No separate `apps/admin` or `apps/partner`** — role-based routes in the single app (`/admin/*`, `/partner/*`)
- **No per-domain micro-packages** (`booking`, `waitlist`, …) until logic is painful to keep inline

Full tree and phased rollout: [`.dev-plan/IMPLEMENTATION-PLAN.md` § Monorepo structure](.dev-plan/IMPLEMENTATION-PLAN.md).

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
```

---

## Hard rules (non-negotiable)

1. **SSR-only mutations** — every create/update/delete is a dedicated page with form POST. **No client-side-only modals** for mutations.
2. **Locale in URL** — `/` → 302 → `/de` or `/en`; all pages under `/:locale/*`.
3. **Scope to the current phase** — do not implement features from later phases. Deploy before finishing.
4. **Read before coding** — use the doc reading order below; feature files are behavioral source of truth.
5. **Match the spec verbatim** where copy is provided (`static-pages-content.md`, `content-i18n-inventory.md`).
6. **Yellow page background app-wide** — `#FAFF86` is the page backdrop on every route, not grey. White/cream cards float on top. See [`design-tokens.md`](design-tokens.md).
7. **Work Sans only** — no EK Notice Sans in the new app.
8. **HeroUI-only markup** — no raw HTML elements (`<section>`, `<p>`, `<a>`, `<button>`, `<h1>`, etc.) in routes or UI components. Use `@heroui/react` primitives (`Card`, `Link`, `Button`, `Heading`, `Paragraph`, `Surface`, `Chip`, …) or page-level components built entirely from HeroUI. Tailwind on HeroUI nodes is for **layout only** (`flex`, `grid`, `gap`, `max-w-*`, positioning) — never for colors, borders, shadows, or typography that belong in the theme. Exceptions: `<script type="application/ld+json">` for structured data; `<img>` inside HeroUI wrappers where no HeroUI image primitive applies.
9. **Theme-only visual styling** — colors, borders, radius, shadows, typography, and interactive hover states belong in `apps/web/app/styles/globals.css` (`@theme` tokens + `@layer components` overrides targeting HeroUI BEM classes, after `@import "@heroui/styles"`). Adjust look-and-feel by changing theme tokens — not ad-hoc per-route color/border/shadow/hover classes.
10. **Public event detail pages** — `/events/:id` is indexable without auth (Phase 4+). Booking and member feed stay gated.
11. **Atomic booking transaction** — only the Booking domain writes bookings/ledger for purchases; waitlist promotion calls the same path.
12. **Partner scoping** — every partner query/write filtered by session `partnerId`; never trust client-supplied `partnerId`.

---

## How to read the spec

Follow this order (details in [`docs/migration/README.md`](docs/migration/README.md)):

1. **`product/vision-and-domains.md`** — product vision, bounded contexts, boundary rules, v1 non-goals
2. **`product/user-journeys.md`** — end-to-end flows across domains
3. **`features/*.feature`** — Gherkin scenarios per domain (behavioral source of truth)
4. **`sitemap/sitemap.md`** — route map for the new app
5. **`ui/`** — design tokens, component map, app shell, static copy, assets
6. **`database/schema-overview.md`** — entities, fields, relationships for Drizzle
7. **`extras/`** — read the relevant file before building that concern:
   - `authorization-matrix.md` — before any protected route
   - `pagination-and-search.md` — before any list/table page
   - `seo-and-metadata.md` — before any public page
   - `image-uploads.md` — before event/partner forms with images
   - `integrations-and-config.md` — env vars and third-party services

---

## Implementation phases

Work **one phase per agent session**. Branch: `phase-N-short-name`. Merge to `main` only after staging deploy succeeds.

| Phase | Focus | Key routes |
|---|---|---|
| **0** | Monorepo bootstrap, shell, locale routing, deploy | `/`, `/de`, `/en` |
| **1** | Marketing site, legal, cookie banner, SEO basics | `/discover`, `/how-it-works`, `/faq`, `/impressum` |
| **2** | Auth — Neon Auth, `@better-auth-ui/heroui`, `@unveiled/db`, `@unveiled/auth` | `/login`, `/signup` |
| **3** | Onboarding (4 SSR steps) | `/onboarding/*` |
| **4** | Catalog, admin CRUD, images, public event detail | `/admin/events`, `/events/:id` |
| **5** | Member discovery, filters, saved, map island | `/events`, `/saved` |
| **6** | Stripe + atomic booking | `/membership`, `/events/:id/book`, `/bookings` |
| **7** | Waitlist + profile/billing | `/events/:id/waitlist`, `/profile/billing` |
| **8** | Partner portal + check-in | `/partner`, `/partner/guests` |
| **9** | Admin ops, GDPR, SEO polish, Sentry, cron | `/admin/users`, `/sitemap.xml` |

Phase prompts, done-when criteria, and demo scripts: [`.dev-plan/IMPLEMENTATION-PLAN.md`](.dev-plan/IMPLEMENTATION-PLAN.md).

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

1. Identify the **current phase** and read its scope in `.dev-plan/IMPLEMENTATION-PLAN.md`.
2. Read the **docs listed** for that phase (feature files + extras).
3. Implement **only** that phase's scope.
4. Run `bun run lint` and `bun run typecheck`.
5. **Deploy to staging** and update `apps/web/DEPLOYMENT.md` (env vars, demo accounts).
6. **Stop** — do not start the next phase.

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

From `product/vision-and-domains.md` — enforce in code:

- **Booking** is the only writer of bookings/ledger for purchases (except admin comp tickets, which skip credit charge but use the same capacity/booking path).
- **Waitlist promotion** calls Booking's transaction — never duplicate booking logic.
- **Membership & Billing** is the single source of truth for "can this user book?" — checked inside the booking transaction.
- **`USER` accounts** — self-service signup only. **`PARTNER`** — created by admin via portal-access flow. **`ADMIN`** — provisioned out-of-band, never self-service.
- **Partner operations** — always scoped by authenticated `partnerId`.

Full permission matrix: `docs/migration/extras/authorization-matrix.md`.

---

## UI & design

**Start here for any UI task:**

1. [`design-tokens.md`](design-tokens.md) — brand tokens, visual rules, theme workflow
2. [`docs/README.md`](docs/README.md) — full agent UI doc index
3. [`docs/DESIGN_TOKENS.json`](docs/DESIGN_TOKENS.json) — machine-readable tokens

| Doc | Purpose |
|---|---|
| [`docs/DESIGN.md`](docs/DESIGN.md) | App architecture, SSR model, file layout |
| [`docs/COMPONENTS.md`](docs/COMPONENTS.md) | Existing reusable components |
| [`docs/PATTERNS.md`](docs/PATTERNS.md) | Route, SEO, content, layout patterns |
| [`docs/UX_RULES.md`](docs/UX_RULES.md) | Interaction, forms, accessibility |
| [`docs/examples/`](docs/examples/) | Future-phase page blueprints |

- **Markup:** HeroUI only — see hard rules §8–9. No raw HTML tags in routes or components; compose `Card`, `Link`, `Button`, `Heading`, `Paragraph`, `Surface`, etc. Page-level components in `apps/web/app/components/` (e.g. `LandingPage`, `PageHero`) wrap HeroUI primitives — they are not an excuse to drop down to HTML.
- **Theme:** HeroUI **Uber** preset reskin in `apps/web/app/styles/globals.css` — rules and token reference in [`design-tokens.md`](design-tokens.md). All visual changes (colors, borders, radius, shadows, nav/footer chrome, accent hover) go through `@layer components` — not Tailwind color/border utilities on routes.
- **Primary CTAs:** use `Link` or `Button` with `className="button button--primary …"` — yellow + dark text; hover inverts via theme (`--accent-control-*` tokens).
- **Secondary CTAs:** use `className="button button--secondary …"` — white + dark text; hover inverts to dark bg + white text via theme (`--surface-control-*` tokens).
- **Tailwind:** layout and spacing on HeroUI nodes only — flex/grid, gap, padding, max-width, positioning.
- **Page background:** `brand-yellow` (`#FAFF86`) on every route — the defining brand trait.
- **Typography:** Work Sans via theme; display headings use HeroUI `Heading` with global `.heading` / `.card__title` theme rules (uppercase, `-0.05em` tracking, `line-height: 0.9`).
- **Shape:** neo-brutalist — thick dark borders, **no drop shadows**, near-zero radius on cards.
- **App shell:** navbar (HeroUI `Header`, `Drawer`, `Link`) + footer per `ui/app-shell.md`.
- **Static copy:** verbatim from `ui/static-pages-content.md` and `extras/content-i18n-inventory.md`.
- **Credits do NOT roll over** — fix any "credits roll over" marketing copy (Phase 9).

---

## Environment variables

Document all required vars in `apps/web/DEPLOYMENT.md`. Key vars by phase:

| Phase | Variables |
|---|---|
| 2+ | `DATABASE_URL`, `AUTH_URL` |
| 4+ | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL` |
| 5+ | `GOOGLE_MAPS_API_KEY` |
| 6+ | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN` |
| 6+ | `RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL` |
| 9+ | `SENTRY_DSN` (optional) |

Full mapping: `docs/migration/extras/integrations-and-config.md`.

---

## v1 non-goals (do not build)

- Native mobile app
- Multi-city / city selector
- À la carte credit purchases or referral program
- Real-time chat support (email only: `support@unveiled.berlin`)
- Algorithmic feed ranking (filters only; preferences captured for later)
- Newsletter product

---

## Common pitfalls

| Pitfall | Correct approach |
|---|---|
| Grey page background | Yellow (`#FAFF86`) app-wide — see [`design-tokens.md`](design-tokens.md) |
| Client-side mutation modals | Dedicated SSR pages + form POST |
| shadcn auth components | `@better-auth-ui/heroui` only |
| Modeling `neon_auth` in Drizzle | Drizzle manages `public` schema only; Neon Auth owns `neon_auth` |
| Auth-gated `/events/:id` | Public detail page; gate `/events/:id/book` and `/events` feed |
| Business logic in route files | Extract to `packages/*` |
| Trusting client `partnerId` | Derive from session |
| Mocked Stripe checkout | Real Stripe Billing (Phase 6+) |
| Base64 images in DB | R2 + 6 WebP variants via `@unveiled/images` |
| Scope creep into next phase | Deploy current phase, stop |
| Custom CSS components or per-route styling | HeroUI primitives + `@layer theme` in `globals.css`; Tailwind layout only |
| Raw HTML tags in UI (`<p>`, `<a>`, `<section>`, …) | HeroUI `Paragraph`, `Link`, `Card`, `Surface`, etc., or components built from them |
| Hard offset drop shadows | No shadows — flat bordered surfaces via theme tokens |

---

## Deliverables checklist (every phase)

- [ ] Scope matches current phase only
- [ ] Spec docs for this phase were read
- [ ] `bun run lint` and `bun run typecheck` pass
- [ ] Staging deploy succeeds
- [ ] `apps/web/DEPLOYMENT.md` updated
- [ ] Demo script from implementation plan works on staging

---

## Quick reference links

- **Agent UI docs** → [`docs/README.md`](docs/README.md)
- **Design tokens & UI theme** → [`design-tokens.md`](design-tokens.md) + [`docs/DESIGN_TOKENS.json`](docs/DESIGN_TOKENS.json)
- Product vision & domains → `docs/migration/product/vision-and-domains.md`
- User journeys → `docs/migration/product/user-journeys.md`
- Route map → `docs/migration/sitemap/sitemap.md`
- Database schema → `docs/migration/database/schema-overview.md`
- Decisions log → `docs/migration/extras/gaps-and-decisions.md`
- Phase plan & agent prompts → `.dev-plan/IMPLEMENTATION-PLAN.md`
