## Why

Step 01 shipped reorder POST and bulk-remove confirm, but `/admin/featured` is still a static table with per-row gallery and trash actions. Admins cannot drag Discover event order or select many rows the way they already can on Featured partners. This second `featured-events-manager` step makes the list behave like that manager — table columns stay; gallery shortcuts leave because gallery already lives on Events.

## What Changes

- Replace `AdminFeaturedTable` with a HonoX island `AdminFeaturedEventsManager` imported from `AdminFeaturedListPage`.
- Toolbar: reorder hint, **Save order** (disabled until dirty; primary POST of repeated `eventIds` to the featured list path), **Remove selected** (disabled until ≥1 native checkbox; else Link to `adminFeaturedRemovePath(locale, selectedIds)`).
- Rows stay a **table** (or table-equivalent Surface rows): thumb / placeholder, title, partner, date; plus native checkbox and drag. Not a partner-style logo tile grid.
- Drop gallery-manage and per-row delete from this list. Do not add a gallery column “for convenience.” Empty state + Add event CTA unchanged. Add-results page unchanged.
- DE/EN copy keys mirroring partners: `featuredReorderHint`, `featuredSaveOrderAction`, `featuredRemoveBulkAction`, `featuredSelectLabel`.
- List page already shows `AdminFormError` on reorder POST failure; island must POST so that path is reachable from the UI.
- Out of scope: Playwright / Gherkin / sitemap (step 03); Featured add filters; Discover; Featured partners island; Events list gallery buttons.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Admin Featured events management SHALL be a drag-reorder table with explicit Save order POST and native-checkbox bulk remove via SSR confirm. The Featured events list SHALL NOT include a gallery-manage action; gallery entry remains Events list and/or event edit. Gallery-manage requirement SHALL drop Featured-list convenience shortcut language.
- `admin-featured-partners`: Featured events admin tab label SHALL remain **Featured events** / **Empfohlene Events**. Gallery manage is not an entry point from this tab.

## Impact

- **Island (`apps/web/app/islands/`):** new `AdminFeaturedEventsManager.tsx` (dnd-kit, local order, dirty Save order, checkbox → bulk confirm). Pattern: `AdminFeaturedPartnersManager` sensors + stop-drag on checkbox; layout is table rows, not tiles.
- **List page:** `AdminFeaturedListPage` wires island like `AdminFeaturedPartnersListPage` (`reorderAction` = `adminFeaturedPath(locale)`); empty copy on the page; delete `AdminFeaturedTable` when unused.
- **Theme:** `globals.css` table-row / checkbox / toolbar tokens for the events manager (layout Tailwind only on HeroUI nodes). Copy checkbox stop-capture + native `<input type="checkbox">`.
- **Copy:** `apps/web/app/lib/admin-content.ts` DE/EN keys listed above.
- **Routes / domain:** no new routes. Consumes step 01 `reorderFeaturedEvents` POST and `/admin/featured/remove?eventIds=`.
- **Source brief:** `.dev-plan/current-iteration/03-featured-events-manager-02-ui-surfaces.md`
- **Parent:** `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md`
- **Depends on:** `featured-events-manager-01-domain-and-routes` (archived)
- **Consumed by:** `04-featured-events-manager-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run stories` starts (no new Ladle story unless one already covers this table)
