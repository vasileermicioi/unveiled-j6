## 1. Setup

- [x] 1.1 Confirm step 01 artifacts exist: `reorderFeaturedEvents` + list POST on `featured/index.tsx`; `adminFeaturedRemovePath`; `AdminFeaturedRemovePage`; `AdminFeaturedListPage` `error` + `AdminFormError`; `AdminFeaturedPartnersManager` island; `AdminFeaturedPartnersListPage`
- [x] 1.2 Skim `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md` (keep **table columns**, not a partner tile grid; no Gherkin/Playwright in this step)

## 2. Copy

- [x] 2.1 Add DE/EN `featuredReorderHint`, `featuredSaveOrderAction`, `featuredRemoveBulkAction`, `featuredSelectLabel` in `apps/web/app/lib/admin-content.ts` (strings per design.md decision 5; mirror partner quoting for the select label)

## 3. Island and theme

- [x] 3.1 Add `apps/web/app/islands/AdminFeaturedEventsManager.tsx`: dnd-kit list (`verticalListSortingStrategy`, PointerSensor distance 8, keyboard sortable), local order state, dirty Save order POST (`eventIds` hidden inputs), native checkbox selection → `adminFeaturedRemovePath(locale, selectedIds)`; stop pointer capture on checkbox/label like partners
- [x] 3.2 Sortable Surface rows with headers for thumb (`admin-table__logo` / placeholder), title, partner, date — no Actions column, no gallery, no per-row delete; `img draggable={false}`; missing/broken thumbs must not block select or drag
- [x] 3.3 Toolbar: reorder hint; Save order `button button--primary` disabled until dirty; Remove selected `button button--secondary` disabled until ≥1 checkbox, else Link to bulk confirm
- [x] 3.4 Add `.admin-featured-events*` rules in `apps/web/app/styles/globals.css` (row layout, not a tile grid; theme tokens only; Tailwind on HeroUI nodes for flex/gap only)

## 4. List page wiring

- [x] 4.1 Wire `AdminFeaturedListPage` like `AdminFeaturedPartnersListPage`: map items (`buildEventImageUrls` / existing `imageUrls`, `formatEventDateTimeWithCount`, `featuredSelectLabel`); `reorderAction` = `adminFeaturedPath(locale)`; empty `featuredEmpty` on the page; keep Add event CTA
- [x] 4.2 Delete `AdminFeaturedTable.tsx` and its import; leave `adminFeaturedEventRemovePath` and the legacy 302 route in place
- [x] 4.3 Confirm `/admin/featured` has no control whose accessible name is `Galerie-Fotos verwalten` / `Manage gallery photos`; Events list/edit gallery entry unchanged; add-results unchanged

## 5. Cleanup and verification

- [x] 5.1 Mark `03-featured-events-manager-02-ui-surfaces` done in `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md` (step 03 remains open; canonical product docs wait for step 03)
- [x] 5.2 Run `bun run lint` — exits 0
  <!-- Touched files pass `biome check`. Full-repo `bun run lint` still fails on pre-existing drizzle snapshot format (`packages/db/drizzle/meta/*`), not this change. -->
- [x] 5.3 Run `bun run typecheck` — exits 0
- [x] 5.4 Run `bun run stories` (or confirm Ladle starts) — no new story unless one already covered Featured events
