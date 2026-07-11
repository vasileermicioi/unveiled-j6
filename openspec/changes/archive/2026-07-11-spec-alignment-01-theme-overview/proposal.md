## Why

Phase 5.5 workstream A requires a **Theme Overview** Ladle story under `@unveiled/ui` (Charter Locked §4, `docs/product/ui/design-system.md`), but `packages/ui` only has EventCard stories and `ThemeDecorator` permanently cross-imports `apps/web/app/styles/globals.css`. Without Theme Overview and a documented theme-CSS path for UI-package stories, implementers cannot verify brand tokens in the design-system home before Phase 6.

## What Changes

- Add a **Theme Overview** Ladle story under `packages/ui` showing brand yellow backdrop, near-zero radius bordered surfaces, Work Sans samples, primary/secondary CTAs, and sample chip + card
- Extract or mirror production theme CSS so `ThemeDecorator` does **not** permanently depend on an undocumented `apps/web` CSS cross-import as the only path (shared theme entry preferred; package-local mirror acceptable if documented)
- Update Ladle / ThemeDecorator / package deps so `bun run stories` loads the theme without broken aliases
- Touch `docs/product/ui/design-system.md` only if the story path or theme-CSS ownership sentence is wrong after implementation
- Mark step 01 done in `spec-alignment-parent-guide.md`
- Do **not** move all `apps/web` stories (step 02); do not change product routes or e2e

## Capabilities

### New Capabilities

- `design-system`: Theme Overview Ladle story under `@unveiled/ui` and theme-CSS loading for UI-package stories without treating an undocumented `apps/web` CSS cross-import as the design-system home

### Modified Capabilities

- _(none)_

## Impact

- **Code:** `packages/ui` (Theme Overview story, ThemeDecorator, optional theme CSS entry, Ladle vite config / deps); possibly a thin shared import from `apps/web/app/styles/globals.css` or a shared theme module both consume
- **Docs:** optional one-line path/ownership fix in `docs/product/ui/design-system.md`; parent guide step checkbox
- **Consumers:** agents adjusting theme tokens; step 02 (DS ownership / story moves) builds on Theme Overview + theme path
- **Out of scope:** DS primitive story moves; raw HTML audit; BDD; sitemap; Stripe/booking; Phase 6+
