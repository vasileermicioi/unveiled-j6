## Context

Step 01 produced `docs/product/CHARTER.md` (binding Locked decisions) and a WIP README stub. Product behavior for sitemap, UI, schema, and extras still lives only under `docs/migration/`, which contradicts the charter on:

| Gap | Migration evidence | Charter lock |
|---|---|---|
| G1 | `sitemap.md` lists `/events/:id` Auth = USER | Public detail; indexable when bookable |
| G2 | Separate `/` landing + `/discover` | Locale home **is** Discover; legacy `/discover` 301 |
| G3 | SEO lists `/events` indexable | Member feed `noindex` |
| G4 | `/partner/*` first-class in sitemap | Partner post-MVP appendix only |
| G5–G6 | No `design-system.md`; Ladle ownership fuzzy | `@unveiled/ui` + Theme Overview |
| G8 | Schema WebP leftovers; portal fields in MVP narrative | JPEG; portal columns labeled post-MVP |

This step is **docs-only**: port/rewrite the structural half of `docs/product/` so step 03 can write features/journeys without reopening sitemap/UI/schema.

Constraints: follow CHARTER Locked decisions verbatim; HeroUI names only (Select, not Radio/Checkbox); every MVP sitemap route must appear in SEO + auth matrix; no TBD on booking/credits schema fields; do not write features, journeys, BDD doc, MVP plan, or flip `AGENTS.md`.

## Goals / Non-Goals

**Goals:**

- Replace README stub with full how-to-read order (foundation now; features in 03; SoT in 05).
- Encode charter locks into vision, sitemap, UI set (including **new** `ui/design-system.md`), complete MVP schema overview, and extras.
- Fix Discover→Events CTAs in sitemap **and** app-shell / static-pages copy.
- Align SEO + auth matrix with public `/events/:id` and member-gated `/events`.
- Mark step 02 done in the parent guide; amend CHARTER target tree for `design-system.md` if missing.

**Non-Goals:**

- `features/*.feature`, `product/user-journeys.md`, `testing/bdd-playwright.md` (step 03).
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` (step 04).
- `AGENTS.md` SoT flip (step 05).
- Application code, Ladle story moves, deleting `docs/migration/`.

## Decisions

### 1. Port/rewrite from migration; no “see migration” holes for MVP topics

Copy structure and useful content from `docs/migration/` counterparts, then rewrite in place under `docs/product/` so an implementer never needs migration for MVP sitemap/UI/schema/extras. Cite charter for persona/parking-lot decisions rather than inventing new ones.

**Alternative considered:** Thin stubs that link back to migration — rejected by step brief (“do not leave see-migration holes”).

### 2. Discover = `/:locale`; guest path = preview → public detail + auth CTA → `/events`

Encode in sitemap tables, app-shell nav (guest vs member), and static-pages Discover CTAs:

1. Guest on Discover sees curated preview; cards link to public `/events/:id`.
2. Primary path to full browse: signup/login → (onboarding if needed) → member `/events`.
3. No public full upcoming-events list in MVP.
4. Members get `/events`, `/events/map`, `/saved`.

**Alternative considered:** Public guest `/events` list — already rejected in charter.

### 3. Sitemap auth column for `/events/:id` is empty/`—` (not USER)

Match shipped code and SEO. Book/waitlist/save remain USER (+ subscription where applicable). `/partner/*` only in a **post-MVP appendix**, not the MVP route tables.

### 4. New `ui/design-system.md` owns DS contract; amend CHARTER tree

Charter target tree listed DS ownership under `ui-component-map.md` only. Step brief requires a dedicated `design-system.md` (`@unveiled/ui` = DS, Ladle home, Theme Overview story requirements, what may stay in `apps/web`, raw-HTML ban, story-ownership rules). **Amend CHARTER** target tree to add `ui/design-system.md` rather than silently drifting.

`design-tokens.md` restates Uber rules: `#FAFF86`, near-zero radius, no shadows, Work Sans, theme-only visual styling.

### 5. Schema overview is complete for production MVP (including unshipped Phases 6–7)

Document tables/fields/relationships for: `users`, `partners` (venues), `events`, `images`, `saved_events`, `subscriptions`, `bookings`, `credit_ledger`, `waitlist` (as needed). No TBD on fields required by booking/credits. Partner-portal-only columns (`portal_user_id`, check-in token usage for partner UI, etc.) remain in schema for forward compatibility but are labeled **post-MVP**. Image variants = six JPEGs (not WebP).

### 6. Extras cross-check contract

- `seo-and-metadata.md`: Discover + bookable `/events/:id` indexable; member `/events` / map / saved `noindex`; partner routes only in post-MVP notes.
- `authorization-matrix.md`: guest / member / admin for MVP routes; partner section marked post-MVP.
- Every MVP route in sitemap MUST appear in both SEO indexability and auth matrix tables.
- `gaps-and-decisions.md`: add “MVP rewrite 2026-07” section pointing at charter; do not reopen unrelated settled decisions.

### 7. Spec deltas are documentation contracts, not code work

OpenSpec deltas under this change record the product-doc requirements (public detail, Discover→Events CTAs, UI package as DS). Implementation of Theme Overview story moves is scheduled in step 04’s plan — this step only specifies them in `docs/product/ui/`.

## Risks / Trade-offs

- **[Risk] Docs drift from shipped Phase 0–5 code** → Mitigation: prefer shipped facts from charter inventory (Discover home, public `[id].tsx`) over migration contradictions.
- **[Risk] Incomplete schema fields block step 03 booking features** → Mitigation: no TBD on booking/credits/waitlist/subscription fields; port from migration schema and tighten.
- **[Risk] CHARTER tree omits `design-system.md`** → Mitigation: explicit amendment task in apply.
- **[Risk] Over-copying partner portal into MVP extras** → Mitigation: park `/partner/*` in sitemap appendix; auth matrix partner section labeled post-MVP; trim partner-only env from integrations MVP section.
- **[Trade-off] Large doc surface in one step** → Acceptable: step brief scopes exactly this structural half; features stay in 03.

## Migration Plan

1. Read CHARTER end-to-end; list migration files → port / rewrite / post-MVP park.
2. Write README + vision + sitemap + UI set + schema + extras under `docs/product/`.
3. Amend CHARTER target tree for `design-system.md` if needed.
4. Run verification `find` / `rg` commands from the step brief; cross-check every MVP sitemap route against SEO + auth matrix.
5. Mark step 02 done in parent guide.
6. Rollback: delete new `docs/product/**` files except `CHARTER.md` / restore README stub; revert parent-guide checkbox (no runtime impact).

## Open Questions

- _(none blocking)_ — guest browse path, public detail, personas, and DS ownership are locked in the charter. Apply may note minor nav-label wording (DE/EN) when porting static copy, without reopening product decisions.
