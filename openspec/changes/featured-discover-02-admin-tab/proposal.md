## Why

Step 01 shipped `featured_events` and catalog helpers, but admins still have no UI to curate Discover. Without an ADMIN Featured tab, the join table stays unused and step 03 cannot swap Discover onto a real curated list.

## What Changes

- Extend admin chrome with a **Featured** tab (`AdminTab`, path helpers, `inferAdminTab`, `AdminTabNav`, DE/EN copy).
- Add ADMIN-only SSR routes under `/:locale/admin/featured*`:
  - list featured events (ordered by `sort_order`)
  - search-and-add page (`GET ?q=` + `POST` add)
  - remove-from-featured confirm page (`GET` + `POST`) that deletes only the featured row
- Page components under `apps/web/app/components/admin/` (HeroUI only; Tailwind layout only).
- Update `docs/product/sitemap/sitemap.md` admin rows for the new routes.
- **No** Discover query swap, membership/nav gating, event field editing from Featured, or drag-and-drop reorder (steps 03–04 / out of scope).

## Capabilities

### New Capabilities

- `admin-events`: ADMIN Featured tab and SSR routes to list, search-add, and remove curated featured membership without deleting catalog events (maps to product `admin-events` / step brief Spec Delta).

### Modified Capabilities

- _(none)_

## Impact

- **Tabs / chrome:** `apps/web/app/components/admin/admin-tabs.ts`, `AdminTabNav.tsx` (+ stories if needed); tab order insert near Events.
- **Routes:** `apps/web/app/routes/[locale]/admin/featured/index.tsx`, `featured/add.tsx`, `featured/[eventId]/remove.tsx` (or equivalent HonoX file layout).
- **UI:** New admin page/table components patterned on `AdminEventsListPage` / delete confirm; empty states for empty list and empty search.
- **Copy:** `apps/web/app/lib/admin-content.ts` — tab label (Featured / Empfohlen), list/add/remove strings; remove body must state the catalog event is kept.
- **Domain (consume only):** `@unveiled/db` helpers from step 01 — `listFeaturedEvents`, `searchEventsNotFeatured`, `addFeaturedEvent`, `removeFeaturedEvent`; map `CatalogValidationError` via existing admin error helpers.
- **Docs:** `docs/product/sitemap/sitemap.md` admin section only (full feature/BDD docs in step 04).
- **Auth:** Existing `guardAdminRoute` on all featured routes.
- **Unchanged this step:** Discover route, public `/events/:id`, booking eligibility, Events CRUD, reorder UI, e2e (optional smoke; full e2e in step 04).
- **Source brief:** `.dev-plan/current-iteration/featured-discover-02-admin-tab.md`
- **Parent:** `.dev-plan/current-iteration/featured-discover-parent-guide.md`
- **Depends on:** `featured-discover-01-schema-and-domain` (done)
- **Consumed by:** `featured-discover-03-discover-browse-and-nav`
- **Verification:** `bun run lint`, `bun run typecheck`; manual/smoke add via search + remove via confirm + event still on `/admin/events`
