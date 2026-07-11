## 1. Inventory pass

- [x] 1.1 Skim `.dev-plan/openspec_5step_proposals_guide.v2.md`, `mvp-spec-rewrite-parent-guide.md`, and `IMPLEMENTATION-PLAN.md` through Phase 5 (note done vs remaining; skim 6–9 for partner/post-MVP parking)
- [x] 1.2 Skim migration inputs: `docs/migration/README.md`, `sitemap/sitemap.md`, `extras/seo-and-metadata.md`, `ui/ui-component-map.md`, `ui/design-tokens.md`, `database/schema-overview.md`, `product/vision-and-domains.md`
- [x] 1.3 Record Ladle evidence: story counts in `packages/ui` vs `apps/web`; note `packages/ui/src/stories/ThemeDecorator.tsx` importing `apps/web` CSS
- [x] 1.4 Sample e2e for non-proximity selectors (`page.locator`, `input[name=…]`) in `e2e/specs/` and fixtures; note file-input cases for the exception policy

## 2. Create docs/product charter

- [x] 2.1 Create `docs/product/` directory
- [x] 2.2 Write `docs/product/README.md` WIP stub (points at CHARTER; states not yet SoT until step 05)
- [x] 2.3 Write `docs/product/CHARTER.md` with all required sections: Purpose & success criteria; Source inventory; Gap register (UI, sitemap, schema, BDD, persona) with severity; Locked decisions (six expanded per design.md); Target `docs/product/` tree; Migration→product mapping (port / rewrite / drop); Post-MVP parking lot
- [x] 2.4 Ensure Locked decisions explicitly cover: MVP personas (partner post-MVP); public `/events/:id`; Discover = locale home + auth CTA path to `/events` (no public full feed); `@unveiled/ui` + Theme Overview; BDD proximity + file-input exception policy; artifact paths (`docs/product/`, `IMPLEMENTATION-PLAN.mvp.md`)

## 3. Validation and parent guide

- [x] 3.1 Verify `test -f docs/product/CHARTER.md && test -f docs/product/README.md`
- [x] 3.2 Verify `rg -n "Locked decisions|MVP personas|Theme Overview|proximity" docs/product/CHARTER.md` hits all themes
- [x] 3.3 Verify `rg -n "PARTNER|partner portal" docs/product/CHARTER.md` marks partner post-MVP (not silently omitted)
- [x] 3.4 Re-read charter against user issues (UI DS split, theme fidelity/Theme Overview, Discover→Events, public event page) — each maps to a locked decision or gap with owner step 02–05
- [x] 3.5 Mark step 01 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`; do not update `AGENTS.md`
