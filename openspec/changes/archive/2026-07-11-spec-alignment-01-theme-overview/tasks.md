## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/spec-alignment-01-theme-overview.md`, parent guide release criteria/non-goals, and this change’s proposal/design/specs
- [x] 1.2 Skim `docs/product/ui/design-system.md` Theme Overview checklist, `DESIGN.md` / `design-tokens.md`, current `ThemeDecorator.tsx`, and `packages/ui/.ladle/vite.config.ts`

## 2. Theme CSS for `@unveiled/ui`

- [x] 2.1 Choose shared brand-theme entry (preferred) vs package-local mirror; document choice in PR
- [x] 2.2 Add package theme CSS under `packages/ui` (e.g. `src/styles/brand-theme.css`) with Work Sans, HeroUI styles, `@theme` tokens, and overrides needed for Theme Overview samples
- [x] 2.3 Export the theme CSS from `@unveiled/ui` if using shared entry; update `apps/web/app/styles/globals.css` to import it and keep app-only layers (auth, MapLibre, `@source`, route-specific)
- [x] 2.4 Point `ThemeDecorator` at the package theme path (remove undocumented permanent `apps/web` globals-only import)
- [x] 2.5 Slim Ladle vite aliases that existed only for full-app CSS resolution; ensure `@heroui/styles` resolves from UI package deps

## 3. Theme Overview story

- [x] 3.1 Add Theme Overview Ladle story under `packages/ui` (e.g. `src/stories/ThemeOverview.stories.tsx`)
- [x] 3.2 Cover all six samples: yellow `#FAFF86` backdrop, near-zero radius bordered surfaces (no shadows), Work Sans body + display/heading, primary CTA, secondary CTA, chips + sample card
- [x] 3.3 Use HeroUI-only markup; Tailwind for layout only; CTAs use `button button--primary` / `button button--secondary`

## 4. Validation

- [x] 4.1 Run `bun run lint` — exit 0
- [x] 4.2 Run `bun run typecheck` — exit 0
- [x] 4.3 Run `bun run stories` (or `bun --filter @unveiled/ui stories`) — Theme Overview loads without CSS/module resolution errors
- [x] 4.4 Manually confirm Theme Overview against `design-tokens.md` (yellow, radius, no shadows, Work Sans, CTA invert via theme)

## 5. Cleanup

- [x] 5.1 Update `docs/product/ui/design-system.md` only if story path or theme-CSS ownership sentence is wrong
- [x] 5.2 Mark step 01 done in `.dev-plan/current-iteration/spec-alignment-parent-guide.md`
- [x] 5.3 Do not start step 02 until Theme Overview is mergeable
