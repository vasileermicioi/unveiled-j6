## Context

Phase 5.5 step 02 (workstream A), after step 01 shipped Theme Overview + shared `packages/ui/src/styles/brand-theme.css`. Product SoT (`docs/product/ui/design-system.md`) already requires:

- Ladle stories for design-system primitives under `packages/ui` only
- Route-specific page compositions may keep optional stories in `apps/web`
- HeroUI-only markup; theme-only visuals; documented exceptions for structured-data scripts, `<img>` in wrappers, map canvas hosts

Current inventory:

| Location | Stories |
|---|---|
| `packages/ui` | `EventCard`, `ThemeOverview` |
| `apps/web` | ~43 stories (app shell, marketing pages, discovery, onboarding, admin, auth layouts) |

`ui-component-map.md` lists **Logo** as `apps/web` or `@unveiled/ui`. No other shared HeroUI composition is exported from `@unveiled/ui` today besides `EventCard`. Known raw-HTML hotspots: island `<button>` fallbacks (`AppNavbarMenu`, `AuthLogoutButton`), map canvas `<div>` hosts (`EventMap`, `EventGeoPicker`), allowed `<img>` / `script[type=application/ld+json]`.

Canonical product behavior stays in `docs/product/`; this OpenSpec delta is planning-only.

## Goals / Non-Goals

**Goals:**

- Classify every `apps/web` story as DS primitive vs page composition / app shell
- Move classified DS primitives (at least Logo if confirmed) into `packages/ui` with stories; leave page compositions in `apps/web` with ownership documented
- Update `design-system.md` / `ui-component-map.md` so ownership matches reality
- Audit raw HTML + non-theme visual Tailwind; fix cheap violations; publish a named deferral list for the rest
- Keep lint, typecheck, and Ladle green; no `packages/ui` → `apps/web` imports

**Non-Goals:**

- Moving Discover / admin / onboarding / marketing **page** stories into `packages/ui`
- BDD locator work (step 03), coverage matrix (step 04), sitemap/release (step 05)
- Phase 6+ product features
- Inventing new product components unrelated to ownership/audit
- Full consolidation of every remaining `globals.css` override into the UI package

## Decisions

### 1. Classification rubric (apply to every `*.stories.tsx` under `apps/web`)

- **DS primitive (must move):** Shared, route-agnostic HeroUI composition intended for reuse across surfaces; documented (or should be) under `@unveiled/ui` in the component map; no hard dependency on app routes, i18n page modules, or admin-only form chrome.
- **Page composition / app shell (may stay):** `*Page` stories, admin list/table/shell chrome, onboarding step forms/layouts, discovery filters/map/feed, marketing section pages, `AppShell` / `AppNavbar` / `GuestFooter` / auth page layouts — even if thin wrappers.
- **Rationale:** Matches `design-system.md` ownership table and parent non-goal “do not move every page composition.”
- **Alternatives:** Move all stories into `packages/ui` — rejected (packages must not depend on app; page stories need app fixtures).

### 2. Move Logo into `@unveiled/ui`; leave other thin wrappers in `apps/web`

- **Choice:** Extract `Logo` (+ `LogoTone` / `LOGO_PATHS`) into `packages/ui`, export from package index, move `Logo.stories.tsx` under `packages/ui`, update `apps/web` imports. Keep `NavLink`, `SectionCard`, `AdminFormSelect`, pagination, tab nav, etc. in `apps/web` as page/app-shell compositions and document them as allowed.
- **Rationale:** Logo is the only map row explicitly dual-owned and is a true shared brand primitive (three SVG tones). `AdminFormSelect` is admin-form-coupled (`AdminFormPopoverAnchor`, client state). `SectionCard` is a thin marketing Card helper, not a documented DS primitive. `NavLink` is app-shell chrome.
- **Alternatives considered:**
  - Move Logo + NavLink + SectionCard — over-extracts app-shell/marketing helpers without map mandate.
  - Move nothing, only document — fails “no orphan primitive stories solely in `apps/web`” if Logo remains the shared brand mark with stories only in web.
- **If implementer finds another true shared primitive during audit** (exported or clearly reusable with no app deps), move it too and update the map; do not invent new components.

### 3. Document allowed `apps/web` story groups explicitly

- **Choice:** After classification, update `design-system.md` Ownership (and `ui-component-map.md` Logo row → `@unveiled/ui`) with a short “Allowed page-level story groups in `apps/web`” note listing: app shell, marketing pages, discovery, onboarding, admin, auth layouts. PR checklist must call out that remaining web stories are page compositions.
- **Rationale:** Step outcome requires ownership doc to match reality so step 03 does not reopen the debate.
- **Alternatives:** Only PR description — rejected (parent release criteria check the product doc).

### 4. Markup / theme audit: fix cheap, defer by name

- **Choice:** Run a repo audit of `apps/web/app/routes/`, `apps/web/app/components/`, `apps/web/app/islands/`, `packages/ui` for:
  1. Raw HTML banned by AGENTS.md / design-system (except documented exceptions)
  2. Tailwind color/border/shadow/typography utilities that belong in theme tokens
- **Fix in this PR when cheap** (e.g. replace island fallback `<button>` with HeroUI `Button` using the same theme classes; wrap map hosts only if a HeroUI surface already wraps them without breaking MapLibre).
- **Documented exceptions (do not “fix” away):** `script[type=application/ld+json]`; `<img>` inside HeroUI wrappers / Logo; map canvas host `<div>` refs for MapLibre (`EventMap`, `EventGeoPicker`).
- **Named deferrals:** For larger refactors, add a checked-in list (file path + issue + target phase) to parent guide **Risks** and/or a short `gaps-and-decisions.md` entry. Example deferral shape: `apps/web/app/islands/AuthLogoutButton.tsx` — raw `<button>` — prefer HeroUI Button — Phase 5.5 follow-up or Phase 8 polish.
- **Rationale:** Step must stay mergeable; silent leftover debt fails the outcome.
- **Alternatives:** Fix everything in one PR — risks scope blow-up into admin/onboarding islands.

### 5. Package boundary and Ladle wiring

- **Choice:** After Logo move, ensure `@unveiled/ui` exports the component; web imports from `@unveiled/ui`. Update UI Ladle story globs if needed (already covers `packages/ui/src/**`). Do **not** add `packages/ui` imports of `apps/web`. Public logo assets stay served from web `public/logos/` (or existing static paths); package stories use the same public paths / absolute asset URLs as today.
- **Rationale:** Packages never depend on apps; ThemeDecorator already loads shared brand theme from step 01.
- **Alternatives:** Duplicate SVG into the package — unnecessary if public paths work in both Ladles.

### 6. Verification bar

- **Choice:** `bun run lint`, `bun run typecheck`, `bun run stories` (UI + web); spot-check Theme Overview + EventCard + moved Logo + one allowed page story; `rg` for no new `packages/ui` → `apps/web` imports.
- **Rationale:** Matches step plan Deliverables & Verification.

## Risks / Trade-offs

- **[Risk] Over-classifying page helpers as DS primitives** → Mitigate with Decision 1 rubric; default stay-in-web when unsure; only Logo is pre-committed.
- **[Risk] Logo asset paths break in UI Ladle** → Mitigate by verifying story render; keep paths identical to web public assets; adjust Ladle static/public config only if needed.
- **[Risk] Island button → HeroUI Button changes SSR/hydration** → Mitigate with small, class-preserving swaps; defer if island behavior regresses.
- **[Risk] Audit finds large visual Tailwind debt** → Named deferrals required; do not block merge on full cleanup.
- **[Trade-off] Most stories remain in `apps/web`** → Intentional; ownership doc must say so explicitly.

## Migration Plan

1. Inventory + classify all `apps/web` stories (table in PR).
2. Move Logo (+ stories) into `packages/ui`; update exports and web imports.
3. Update `design-system.md` / `ui-component-map.md` ownership.
4. Run markup/theme audit; land cheap fixes; write named deferral list.
5. Validate lint/typecheck/stories; mark parent guide step 02 done.
6. Rollback: revert Logo move and doc edits if package boundary or Ladle breaks; keep audit deferral notes if useful.

## Open Questions

- None blocking apply. If audit surfaces a second clear shared primitive (no app deps, map-worthy), implementer may move it in the same PR and update the ownership docs; otherwise leave for a named follow-up.
