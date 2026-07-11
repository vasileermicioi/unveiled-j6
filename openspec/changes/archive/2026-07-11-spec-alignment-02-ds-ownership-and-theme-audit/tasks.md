## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/spec-alignment-02-ds-ownership-and-theme-audit.md`, parent guide, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 01 is done (Theme Overview + `brand-theme.css` exist under `packages/ui`)
- [x] 1.3 List all `*.stories.tsx` under `apps/web` and `packages/ui`; draft primitive vs page-composition classification table for the PR

## 2. Move DS primitive stories

- [x] 2.1 Extract `Logo` (+ `LogoTone` / `LOGO_PATHS`) into `packages/ui`; export from package index
- [x] 2.2 Move `Logo.stories.tsx` under `packages/ui`; remove the sole-web copy; update `apps/web` imports to `@unveiled/ui`
- [x] 2.3 If audit finds another true shared primitive (no app deps), move it + stories the same way; otherwise leave page helpers in `apps/web`
- [x] 2.4 Verify Ladle globs / public logo asset paths so UI-package Logo stories render

## 3. Ownership docs

- [x] 3.1 Update `docs/product/ui/ui-component-map.md` Logo row to `@unveiled/ui`
- [x] 3.2 Update `docs/product/ui/design-system.md` ownership notes: allowed page-level story groups in `apps/web` (app shell, marketing, discovery, onboarding, admin, auth layouts); ban on orphan primitive stories remains

## 4. Markup and theme audit

- [x] 4.1 Audit `apps/web/app/routes/`, `apps/web/app/components/`, `apps/web/app/islands/`, and `packages/ui` for banned raw HTML and non-theme color/border/shadow/typography utilities
- [x] 4.2 Fix cheap violations in-scope (e.g. island fallback `<button>` → HeroUI `Button` with same theme classes) without breaking MapLibre hosts or allowed `<img>` / JSON-LD exceptions
- [x] 4.3 Record named deferrals (file path + reason + target phase) for larger refactors in parent guide Risks and/or `docs/product/extras/gaps-and-decisions.md`

## 5. Validation

- [x] 5.1 Run `bun run lint` — exit 0
- [x] 5.2 Run `bun run typecheck` — exit 0
- [x] 5.3 Run `bun run stories` — UI + web Ladle start; Theme Overview + EventCard + moved Logo (+ any other moved primitive) render
- [x] 5.4 Spot-check one allowed page story still under `apps/web`
- [x] 5.5 Confirm `rg -n "from ['\\\"].*apps/web" packages/ui` shows no new package→app imports

## 6. Cleanup

- [x] 6.1 Mark step 02 done in `.dev-plan/current-iteration/spec-alignment-parent-guide.md`
- [x] 6.2 Paste any remaining named UI deferrals into parent Risks / gaps doc
- [x] 6.3 Do not start BDD steps (03+) until ownership doc matches reality
