## Context

Phase 5.5 step 01 (workstream A). Product SoT already requires a Theme Overview Ladle story under `packages/ui` (`docs/product/ui/design-system.md`, Charter Locked §4). Today:

- `packages/ui` has EventCard stories + `ThemeDecorator` that imports `../../../../apps/web/app/styles/globals.css`
- Ladle vite config aliases `@better-auth-ui/heroui` and `maplibre-gl` into `apps/web/node_modules` solely so that full-app CSS resolves
- Production Uber yellow theme lives in `apps/web/app/styles/globals.css` (`@theme`, `@layer theme`, large `@layer components` block) plus app-only imports (auth UI, MapLibre, `@source` for web trees)

Canonical visual tokens remain `DESIGN.md` / `docs/product/ui/design-tokens.md`. OpenSpec delta under `design-system` is planning-only; product behavior stays in `docs/product/`.

## Goals / Non-Goals

**Goals:**

- Ship Theme Overview under `packages/ui` covering all six required samples
- Load theme CSS for `@unveiled/ui` stories without an undocumented permanent `apps/web` CSS cross-import as the DS home
- Keep visual contract identical to production (yellow `#FAFF86`, near-zero radius, no shadows, Work Sans, primary/secondary CTA invert)
- Keep `bun run stories` / UI filter green; lint + typecheck green

**Non-Goals:**

- Moving DS primitive stories from `apps/web` (step 02)
- Raw HTML / non-theme styling audit (step 02)
- BDD, sitemap, e2e, product routes
- Inventing a second visual language or changing brand tokens
- Full consolidation of every route-specific override in `globals.css` into the UI package

## Decisions

### 1. Shared brand theme CSS owned by `@unveiled/ui` (preferred)

- **Choice:** Add a package-local theme entry (e.g. `packages/ui/src/styles/brand-theme.css`) that holds Work Sans + `@import "@heroui/styles"` + `@theme` brand tokens + `@layer theme` root variables + the **core** `@layer components` overrides needed for Theme Overview (surfaces/cards, primary/secondary buttons, chips, typography samples). Export it from the package (e.g. `"./styles/brand-theme.css"` in `package.json` exports). Point `ThemeDecorator` at that path. Have `apps/web/app/styles/globals.css` `@import` the shared entry, then keep **app-only** layers (auth UI, MapLibre, `@source` globs, route-specific overrides such as onboarding-form).
- **Rationale:** One token SoT for stories and production; removes the reverse dependency (UI → web); drops the need for Ladle aliases into web `node_modules` for theme loading; matches `design-system.md` “prefer co-locating theme CSS for stories under the UI package.”
- **Alternatives considered:**
  - **Package-local mirror only** (duplicate tokens in UI, leave globals untouched) — acceptable fallback if shared extraction risks breaking web in this PR; must comment that production SoT is still `globals.css` / design-tokens and schedule sync. Prefer shared entry when churn stays low.
  - **Keep ThemeDecorator → apps/web globals** with a comment — fails the step outcome (permanent undocumented cross-import as DS home).

### 2. Theme Overview as a dedicated Ladle story file

- **Choice:** Add `packages/ui/src/stories/ThemeOverview.stories.tsx` (or equivalent under `packages/ui/src/`) using HeroUI primitives only (`Surface`, `Card`, `Button`/`Link` with `button button--primary` / `button button--secondary`, `Chip`, `Heading`, `Paragraph`, etc.). Tailwind for layout/spacing only. Story name clearly “Theme Overview” so implementers find it in Ladle.
- **Rationale:** Matches product checklist verbatim; separate from EventCard stories.
- **Alternatives:** Embed samples in ThemeDecorator — rejected (decorator is chrome, not the catalog story).

### 3. Slim Ladle vite config after theme move

- **Choice:** After ThemeDecorator stops importing full `globals.css`, remove (or stop relying on) aliases that exist only for auth/MapLibre CSS resolution unless another story still needs them. Keep `server.fs.allow` for repo root if shared paths still require it. Ensure `@heroui/styles` resolves from `packages/ui` deps (already present as `devDependency`).
- **Rationale:** UI-package stories should not pretend the web app is the theme host.
- **Alternatives:** Leave aliases — harmless but misleading; clean up in this step when unused.

### 4. Docs touch is path/ownership only

- **Choice:** Update `docs/product/ui/design-system.md` only if the story path or theme-CSS ownership sentence is wrong after the move. Mark step 01 done in `spec-alignment-parent-guide.md`. Do not rewrite design-tokens or DESIGN.md.
- **Rationale:** Product SoT already describes Theme Overview; this step implements it.

### 5. Extraction scope if globals is too large

- **Choice:** If moving the entire `@layer components` block in one PR is too risky, extract **tokens + Theme Overview–critical overrides** into the shared file first; leave remaining web-only overrides in `globals.css` with a short comment that further consolidation is step 02 / follow-up. Theme Overview must still render correctly under the shared file alone.
- **Rationale:** Step must be mergeable; inventing a divergent story-only theme is worse than a thin documented split.

## Risks / Trade-offs

- **[Risk] Shared CSS extraction breaks web build or auth/MapLibre styles** → Mitigate by keeping app-only imports in `globals.css`; run web typecheck/lint; smoke `bun run stories` and a quick web page if globals import path changes.
- **[Risk] Incomplete override set makes Theme Overview look “almost” right** → Mitigate with the six-item checklist against `design-tokens.md`; include primary/secondary hover invert via theme classes.
- **[Risk] Dual files drift if fallback mirror is used** → Prefer shared import; if mirror, add SoT comment + owner note for step 02.
- **[Trade-off] Not moving all component overrides now** → Acceptable; step 02 continues DS ownership. Theme Overview must not depend on web-only CSS.

## Migration Plan

1. Add shared (or mirrored) theme CSS under `packages/ui`; wire package export if shared.
2. Point ThemeDecorator at package theme; adjust Ladle vite aliases.
3. Update `apps/web` globals to import shared theme (if shared strategy).
4. Add Theme Overview story; verify visually + lint/typecheck/stories.
5. Optional one-line `design-system.md` fix; mark parent guide step 01 done.
6. Rollback: revert ThemeDecorator to previous import only if shared path fails mid-PR — do not ship that as the final state.

## Open Questions

- None blocking apply. Implementer picks shared entry vs documented mirror per Decision 1/5 and records the choice in the PR description.
