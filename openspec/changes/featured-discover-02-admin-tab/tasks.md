## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-discover-02-admin-tab.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm step 01 prerequisites: `featured_events` schema, migration applied, helpers (`listFeaturedEvents`, `searchEventsNotFeatured`, `addFeaturedEvent`, `removeFeaturedEvent`) exported from `@unveiled/db`
- [x] 1.3 Skim patterns: `admin-tabs.ts`, `AdminEventsListPage`, `admin/events/[id]/delete.tsx`, `admin-content.ts`, sitemap admin section

## 2. Admin tab chrome and copy

- [x] 2.1 Add `"featured"` to `AdminTab` / `ADMIN_TAB_ORDER` (after `events`), path helpers (`adminFeaturedPath`, add/remove helpers), and `inferAdminTab` for `/admin/featured`
- [x] 2.2 Wire Featured into `AdminTabNav` (+ stories if present)
- [x] 2.3 Extend `AdminCopy` DE/EN: `tabFeatured` (Featured / Empfohlen), list/add/remove titles, empty states, confirm copy that catalog event is kept

## 3. Featured list / add / remove UI and routes

- [x] 3.1 Implement featured list page component + `GET /:locale/admin/featured` route (`listFeaturedEvents`, title/partner/date, Remove + Add actions, empty state)
- [x] 3.2 Implement search-and-add page + `GET`/`POST /:locale/admin/featured/add` (`searchEventsNotFeatured`, GET `q`, POST `eventId` → `addFeaturedEvent` → redirect list; empty search results; map catalog errors)
- [x] 3.3 Implement remove confirm page + `GET`/`POST /:locale/admin/featured/:eventId/remove` (`removeFeaturedEvent` only; never `deleteEvent`; redirect list)
- [x] 3.4 Ensure all featured routes use `guardAdminRoute` and HeroUI-only markup / Tailwind layout only

## 4. Docs and validation

- [x] 4.1 Update `docs/product/sitemap/sitemap.md` admin rows for `/admin/featured`, `/admin/featured/add`, `/admin/featured/:eventId/remove`
- [x] 4.2 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 4.3 Manual or focused smoke: add via search, remove via confirm, confirm event still listed under `/admin/events` (note in handoff if e2e waits for step 04)
- [x] 4.4 Confirm Discover / nav / membership gating were not changed
- [x] 4.5 Mark step done in `.dev-plan/current-iteration/featured-discover-parent-guide.md`; note follow-ups for step 03
