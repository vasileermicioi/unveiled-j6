## Why

Phase 5.5 workstream A gap **G5/G6**: ~43 Ladle stories still live under `apps/web` while `design-system.md` requires design-system **primitive** stories under `@unveiled/ui` only. Ownership docs and the codebase disagree, and raw HTML / ad-hoc visual styling debt is not yet fixed or named. Step 01 shipped Theme Overview + shared `brand-theme.css`; this step aligns story ownership and audits markup/theme debt before BDD work (steps 03–04).

## What Changes

- Classify every `apps/web` `*.stories.tsx` as **design-system primitive** (must live under `packages/ui`) vs **page composition / app shell** (may stay in `apps/web` when documented)
- Move or re-export classified DS primitive stories into `packages/ui` (primary candidate: `Logo`; do not force Discover/admin/onboarding page shells into the package)
- Update `docs/product/ui/design-system.md` and/or `ui-component-map.md` ownership rows so they match reality
- Audit `apps/web` routes/components/islands and `packages/ui` for banned raw HTML and non-theme color/border/shadow/typography utilities; fix cheap violations; record **named deferrals** (file + reason + target phase) for the rest
- Mark step 02 done in `spec-alignment-parent-guide.md`; paste remaining UI deferrals into parent Risks or `gaps-and-decisions.md`
- Do **not** start BDD steps, sitemap spot-check, or Phase 6 features

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `design-system`: Add requirements for DS primitive story ownership (no orphan primitive stories solely in `apps/web`) and for HeroUI-only markup / theme-only visuals with fixes or named deferrals after Phase 5.5 step 02

## Impact

- **Code:** `packages/ui` (moved/shared primitives + stories, exports); `apps/web/app/components/**` (story moves, ownership imports, cheap markup/theme fixes); possibly islands (`AppNavbarMenu`, `AuthLogoutButton`, map canvas hosts) classified as exception vs fix
- **Docs:** `docs/product/ui/design-system.md`, `docs/product/ui/ui-component-map.md`; parent guide step checkbox; optional named deferral list in parent Risks or `docs/product/extras/gaps-and-decisions.md`
- **Consumers:** agents building UI; step 03 (stable a11y/labels benefit from cleaner primitives); Ladle (`bun run stories`) for UI + web
- **Out of scope:** BDD/e2e; sitemap spot-check (step 05); moving every page composition into `packages/ui`; Stripe/booking/waitlist; inventing new product components unrelated to ownership/audit
