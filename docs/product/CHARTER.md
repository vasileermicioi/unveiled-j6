# Unveiled Berlin — MVP product-spec charter

**Status:** Binding. Active product SoT is `docs/product/` (see `AGENTS.md`).  
**Created by:** step 01 (`mvp-spec-rewrite-01-inventory-and-mvp-scope`).

---

## Purpose & success criteria

### Purpose

Lock MVP personas, known gaps, and what “complete production MVP specs” means **before** rewriting the full product doc tree. Later steps must not re-litigate the decisions in this charter.

### Success criteria (“complete production MVP specs”)

Specs are complete when an agent can implement the remaining MVP (Phases 6–7 style work: Stripe, booking, waitlist, profile/billing, admin ops needed for members — **not** partner portal) using **only**:

1. `docs/product/` (full tree after steps 02–03), and  
2. `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` (after step 04),

without reading any other product-spec tree.

Concretely:

| Criterion | Owner step |
|---|---|
| Personas = guest / member (`USER`) / admin (`ADMIN`); partner post-MVP | 01 (this charter) → enforced in 02–05 |
| Sitemap: Discover→Events journey + public `/events/:id` | 02 |
| UI: `@unveiled/ui` Ladle home + Theme Overview + HeroUI Uber theme rules | 02 (docs); story moves scheduled in 04 plan |
| Schema overview complete for production MVP (incl. booking/credits tables) | 02 |
| Gherkin features + journeys for guest/member/admin; partner parked | 03 |
| BDD: `Scenario:` ↔ Playwright title; proximity selectors + exception policy | 03 |
| MVP implementation plan beside the old plan | 04 |
| `AGENTS.md` / READMEs point at `docs/product/` | 05 |

---

## Source inventory

### Spec & plan (current)

| Path | Role | Notes |
|---|---|---|
| `docs/product/` | **Active product SoT** | Charter, features, sitemap, UI, schema, extras, BDD |
| `docs/product/features/*.feature` | Behavioral Gherkin (MVP) | Partner/check-in under `features/post-mvp/` |
| `docs/product/sitemap/sitemap.md` | Route map | Discover home; public `/events/:id`; no `/partner/*` in MVP |
| `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` | Phased delivery | Phases 0–5 shipped; 5.5 remediation; 6–8 remaining MVP |
| `.dev-plan/openspec_5step_proposals_guide.v2.md` | Step planning guide | Active |
| `DESIGN.md` | Visual identity | Google Labs DESIGN.md format |
| `AGENTS.md` | Agent entrypoint | Points at `docs/product/` + MVP plan |

### Shipped code (Phases 0–5)

| Area | Evidence |
|---|---|
| Locale + Discover home | `apps/web/app/routes/[locale]/index.tsx` uses Discover content; `discover.tsx` 301 → `/:locale` |
| Public event detail | `apps/web/app/routes/[locale]/events/[id].tsx` uses `getPublicEventById` (no auth gate) |
| Member feed / map / saved | Gated routes under `/events`, `/events/map`, `/saved` |
| Admin catalog | `/admin/events`, `/admin/partners` (venue records) |
| Auth + onboarding | Neon Auth, `@better-auth-ui/heroui`, 4-step onboarding |
| Design system package | `packages/ui` — `EventCard` + 1 Ladle story |
| App page stories | `apps/web` — **43** `*.stories.tsx` files |
| Theme decorator | `packages/ui/src/stories/ThemeDecorator.tsx` imports `apps/web/app/styles/globals.css` |
| E2E | `e2e/` Playwright; README mandates proximity selectors |

### Plan phase status (inventory skim)

| Phase | Focus | Status for this rewrite |
|---|---|---|
| 0–5 | Foundation → member discovery | **Shipped** (treat as done in MVP plan) |
| 6–7 | Stripe, booking, waitlist, profile/billing | **Remaining MVP** |
| 8 | Partner portal & check-in | **Post-MVP** (park) |
| 9 | Admin ops, GDPR, SEO polish, Sentry, cron | Split: member/admin hardening may stay MVP; partner-only bits park |

---

## Gap register

Severity: **P0** blocks coherent MVP docs; **P1** must fix in rewrite; **P2** schedule in new plan / later code.

| ID | Area | Gap | Evidence | Severity | Owner |
|---|---|---|---|---|---|
| G1 | Sitemap / SEO | `/events/:id` auth contradicts public/indexable intent | `sitemap.md` USER ✅ vs `seo-and-metadata.md` indexable + shipped public `[id].tsx` + `AGENTS.md` | P0 | 02 |
| G2 | Sitemap / journey | Discover vs Events fuzzy; migration still has separate landing + `/discover` | `sitemap.md` `/` + `/discover`; shipped home **is** Discover; legacy `/discover` 301 | P0 | 02 |
| G3 | SEO | `/events` listed indexable but feed is member-gated | `seo-and-metadata.md` row for `/events`; Phase 5 guards | P1 | 02 (correct to `noindex` / member-only) |
| G4 | Persona | Partner mixed into MVP language in migration features/sitemap | `partner-portal.feature`, `checkin.feature`, `/partner/*` routes | P0 | 02–03 (park); charter locks |
| G5 | UI / Ladle | DS stories live mostly in `apps/web`; no Theme Overview | 1 story in `packages/ui` vs 43 in `apps/web`; ThemeDecorator cross-imports app CSS | P1 | 02 (docs); 04 (schedule moves) |
| G6 | UI / theme | Theme fidelity must stay Uber yellow / no radius / no shadows / Work Sans | `design-tokens.md`, `globals.css`; risk of ad-hoc route styling | P1 | 02 (restate); code follow-ups in plan |
| G7 | BDD | Proximity policy stated but not enforced | `e2e/README.md` policy vs ~25 `page.locator(...)` (name attrs, `img[src*]`, file inputs) | P1 | 03 (contract); plan schedules fixes |
| G8 | Schema docs | Overview still says WebP in places; partner portal fields in MVP narrative | `schema-overview.md` images WebP note vs JPEG shipped; `portal_user_id` / check-in token | P1 | 02 (MVP schema rewrite; park portal fields as post-MVP columns or note) |
| G9 | Artifacts | No `docs/product/` tree or `IMPLEMENTATION-PLAN.mvp.md` yet | This step creates charter only | P0 | 02–05 |

### User issues → charter mapping

| User issue | Resolution |
|---|---|
| UI DS split (Ladle in app vs package) | Locked decision §4; gap G5 |
| HeroUI theme fidelity + Theme Overview story | Locked decision §4; gap G6 |
| Discover → Events navigation | Locked decision §3 |
| Public event page | Locked decision §2; gap G1 |

---

## Locked decisions

These are **authoritative** for steps 02–05. Do not reopen unless the user explicitly asks.

### 1. MVP personas

| Persona | Role / state | In MVP? |
|---|---|---|
| **Guest** | Unauthenticated | Yes |
| **Member** | `USER` | Yes |
| **Admin** | `ADMIN` (provisioned out-of-band) | Yes |
| **Partner** | `PARTNER` | **Post-MVP** |

- Venue/`partners` **records** remain: admins create venues and attach events; public UI may show venue name/address/logo.
- No partner login, `/partner/*` portal, portal-access provisioning UI, or check-in UI in MVP docs or `IMPLEMENTATION-PLAN.mvp.md` phases.
- Schema may retain nullable partner-portal columns for forward compatibility, but product docs must label them **post-MVP**.

### 2. Public event detail

- `/events/:id` is **public** (no auth required).
- **Indexable** when the event is bookable (future `date_time` + remaining capacity > 0), per existing SEO rules.
- Sold-out / past: still render 200 with clear state; `noindex, follow`.
- Booking, waitlist, and save actions remain auth-gated (and subscription/credits gated where applicable).
- Step 02 must fix sitemap auth column to match this (not the reverse).

### 3. Discover → Events

**Shipped fact:** locale home `/:locale` **is** Discover (marketing + curated upcoming preview). Legacy `/:locale/discover` **301** redirects to `/:locale`. Do not invent a third home.

**Locked guest journey:**

1. Guest lands on Discover (`/:locale`).
2. Preview cards link to public `/events/:id` (guest CTA: “Book Now” / “Bin dabei”, or “Waitlist” when sold out).
3. Path to the **full browse** experience: primary CTA to **signup or login**; after auth (and onboarding if incomplete), land on member `/events`.
4. Guests do **not** get a public full upcoming-events list equivalent to `/events` in MVP.

**Member journey:** signed-in members use `/events` (filters, pagination), `/events/map`, `/saved`, and public detail.

**SEO note for step 02:** correct `seo-and-metadata.md` so member `/events` is `noindex` (auth); long-tail SEO is Discover + public detail pages.

### 4. Design system

- **`@unveiled/ui`** owns shared components **and all Ladle stories for design-system primitives**.
- Theme tokens and a **Theme Overview** Ladle story live under `packages/ui`.
- Page compositions may live in `apps/web` (optional page-level stories allowed there).
- **Visual rules:** HeroUI-only markup; Uber preset reskin — page background `#FAFF86`, near-zero radius, **no drop shadows**, Work Sans only; visual changes via `globals.css` / tokens — not ad-hoc per-route color/border/shadow utilities.
- **Not in this rewrite feature:** physically moving the 43 `apps/web` stories — step 04’s MVP plan **schedules** that work.

### 5. BDD (Gherkin ↔ Playwright)

- Every MVP `features/*.feature` scenario that ships **MUST** have a Playwright test titled `Scenario: …` **verbatim** (same text as the Gherkin `Scenario:` line).
- **Selectors = proximity / layout only:** `getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth`.
- **Non-compliant:** `page.locator('…css…')`, `page.locator('input[name=…]')`, and `data-testid`, except the policy below.
- **Exception policy (locked):**
  - **Allowed with comment:** `input[type=file]` / file chooser `setInputFiles` may use a name- or label-adjacent locator when HeroUI/React Aria does not expose a stable role. Each use **MUST** include `// BDD exception: file-input` in the test file.
  - **Not a standing exception:** date/time and other native inputs using `input[name=…]` (e.g. `event_date`, `slot_date_*` in `e2e/specs/admin-events.spec.ts` / `e2e/fixtures/admin.ts`). Prefer `getByLabel` once forms expose accessible names; until then treat as **gap G7** — schedule form a11y + test fixes in the MVP plan, do not expand the exception list.
- Step 03 encodes this contract in `docs/product/`; step 04 schedules remediation of existing non-compliant locators.

### 6. Artifacts

| Artifact | Path | When |
|---|---|---|
| Product SoT | `docs/product/` | Active |
| This charter | `docs/product/CHARTER.md` | Binding |
| MVP implementation plan | `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` | Active |
| Step planning guide | `.dev-plan/openspec_5step_proposals_guide.v2.md` | Active |
| Visual identity | `DESIGN.md` | Google Labs format |

---

## Target tree for `docs/product/`

Step 01 creates only `README.md` + `CHARTER.md`. Steps 02–03 fill the rest. Target layout:

```text
docs/product/
├── README.md                          # SoT index (stub until 05)
├── CHARTER.md                         # this file
├── product/
│   ├── vision-and-domains.md          # 02 — MVP personas, domains, non-goals
│   └── user-journeys.md               # 03 — guest/member/admin journeys
├── sitemap/
│   └── sitemap.md                     # 02 — Discover home, public detail, no /partner/*
├── features/                          # 03 — MVP Gherkin only
│   ├── static-pages.feature
│   ├── auth.feature
│   ├── onboarding.feature
│   ├── event-discovery.feature
│   ├── admin-events.feature
│   ├── admin-partners.feature         # venue CRUD only (no portal access)
│   ├── credits-subscription.feature
│   ├── booking.feature
│   ├── waitlist.feature
│   ├── profile.feature
│   └── admin-users.feature            # as needed for MVP admin ops
├── ui/
│   ├── design-tokens.md
│   ├── design-system.md               # 02 — @unveiled/ui DS ownership + Theme Overview
│   ├── ui-component-map.md
│   ├── app-shell.md
│   ├── static-pages-content.md
│   └── assets-inventory.md
├── database/
│   └── schema-overview.md             # complete MVP schema (incl. booking/credits)
├── extras/
│   ├── authorization-matrix.md        # guest/member/admin only
│   ├── pagination-and-search.md
│   ├── seo-and-metadata.md            # public detail; /events noindex
│   ├── image-uploads.md
│   ├── integrations-and-config.md
│   ├── content-i18n-inventory.md
│   └── gaps-and-decisions.md          # MVP-relevant decisions + pointer to parking lot
└── testing/
    └── bdd-and-e2e.md                 # 03 — Scenario titles + proximity + exceptions
```

Post-MVP feature files (`partner-portal`, `checkin`) stay out of this tree; see parking lot.

---

## Mapping: migration path → product path

| Migration path | Action | Product path / note |
|---|---|---|
| `product/vision-and-domains.md` | **Rewrite** | `product/vision-and-domains.md` — drop partner as active MVP persona |
| `product/user-journeys.md` | **Rewrite** | `product/user-journeys.md` — Discover home + auth CTA; no partner journey |
| `sitemap/sitemap.md` | **Rewrite** | `sitemap/sitemap.md` — public detail; Discover = `/:locale`; no `/partner/*` |
| `features/static-pages.feature` | **Port + trim** | `features/static-pages.feature` |
| `features/auth.feature` | **Port + trim** | `features/auth.feature` |
| `features/onboarding.feature` | **Port** | `features/onboarding.feature` |
| `features/event-discovery.feature` | **Rewrite** | Align guest/public detail vs member feed |
| `features/admin-events.feature` | **Port** | `features/admin-events.feature` |
| `features/admin-partners.feature` | **Rewrite** | Venue CRUD only; drop portal-access scenarios |
| `features/credits-subscription.feature` | **Port** | Keep for MVP (unshipped code OK) |
| `features/booking.feature` | **Port** | Keep for MVP |
| `features/waitlist.feature` | **Port** | Keep for MVP |
| `features/profile.feature` | **Port** | Keep for MVP |
| `features/admin-users.feature` | **Port / trim** | MVP admin ops subset |
| `features/partner-portal.feature` | **Drop for MVP** | Post-MVP parking lot |
| `features/checkin.feature` | **Drop for MVP** | Post-MVP parking lot |
| `ui/design-tokens.md` | **Port + tighten** | Restate Uber rules; Theme Overview |
| `ui/design-system.md` | **New** | `@unveiled/ui` DS ownership + Theme Overview |
| `ui/ui-component-map.md` | **Rewrite** | `@unveiled/ui` owns DS Ladle stories |
| `ui/app-shell.md` | **Rewrite** | Nav: Discover = home; member Events link |
| `ui/static-pages-content.md` | **Rewrite** | Align Discover-as-home copy/routes |
| `ui/assets-inventory.md` | **Port** | |
| `database/schema-overview.md` | **Rewrite** | JPEG variants; complete MVP tables; label partner-portal fields post-MVP |
| `extras/seo-and-metadata.md` | **Rewrite** | Public detail; `/events` member `noindex` |
| `extras/authorization-matrix.md` | **Rewrite** | Guest/member/admin only |
| `extras/pagination-and-search.md` | **Port** | |
| `extras/image-uploads.md` | **Port** | JPEG / sip (already updated in migration) |
| `extras/integrations-and-config.md` | **Port + trim** | No partner-only env requirements for MVP |
| `extras/content-i18n-inventory.md` | **Port + trim** | |
| `extras/gaps-and-decisions.md` | **Port + annotate** | Do not reopen settled decisions except charter corrections |
| `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` | **Active plan** | Remaining MVP phases |
| `AGENTS.md` | **Active** | Points at `docs/product/` |

---

## Post-MVP parking lot

Explicitly **out of MVP** docs and `IMPLEMENTATION-PLAN.mvp.md` phases (see [`features/post-mvp/`](./features/post-mvp/)):

| Item | Migration anchors | Notes |
|---|---|---|
| Partner login / `PARTNER` role provisioning | `features/partner-portal.feature`, Phase 8 | Admin may still create venue rows |
| Partner portal (`/partner/*`) | `sitemap.md` partner section | Event CRUD by partner deferred |
| Venue check-in / QR / guest list for partners | `features/checkin.feature` | |
| Partner portal-access admin flow | `admin-partners.feature` portal scenarios | Venue CRUD stays in MVP |
| Public full event browse list for guests | — | Rejected for MVP; revisit if SEO demands |
| Native mobile, multi-city, à la carte credits, referrals, chat, algorithmic ranking, newsletter | `vision-and-domains.md` non-goals | Unchanged |

---

## How later steps use this charter

1. **02** — Encode locked decisions into vision, sitemap, UI docs, schema overview, SEO/auth extras.  
2. **03** — Write MVP features + journeys + `testing/bdd-and-e2e.md`; omit partner/check-in features.  
3. **04** — Write `IMPLEMENTATION-PLAN.mvp.md` (0–5 done; remaining MVP work; schedule Ladle moves + locator remediation); cite guide **v2**.  
4. **05** — Flip `AGENTS.md` / READMEs to `docs/product/`; acceptance checklist on parent guide.
