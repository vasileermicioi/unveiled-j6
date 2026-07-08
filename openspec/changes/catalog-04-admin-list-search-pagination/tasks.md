## 1. Setup

- [ ] 1.1 Read `pagination-and-search.md`, admin partners/events list routes, and this change's proposal/design/specs
- [ ] 1.2 Create sibling step doc `.dev-plan/current-iteration/catalog-04-admin-list-search-pagination.md` and cross-link from `catalog-04-admin-events-crud.md`

## 2. Domain layer (`@unveiled/db`)

- [ ] 2.1 Add `orderBy(desc(createdAt), desc(id))` to `listPartners` and change `listEvents` ordering from `date_time` to `created_at DESC, id DESC`
- [ ] 2.2 Narrow `partnerSearchCondition` to `partners.name` ILIKE only (keep event search on title + partner_name)
- [ ] 2.3 Add integration tests for list/count order, search filters, and offset/limit paging
- [ ] 2.4 Add `partners.created_at` index migration if not present (optional — skip if table small and no migration pattern needed)

## 3. App list helpers and UI

- [ ] 3.1 Fix `AdminSearchForm` — wrap search input in `TextField name="q"` + `Input` (HeroUI form submission pattern)
- [ ] 3.2 Add `clampAdminListPage` (and optional redirect helper) in `admin-list.ts`
- [ ] 3.3 Apply page clamp redirect in `admin/partners/index.tsx` and `admin/events/index.tsx` before list/count queries
- [ ] 3.4 Verify pagination prev/next preserve `q` and corrected `page` via manual or automated check

## 4. Validation

- [ ] 4.1 Manual: create partner → appears at top of `/admin/partners`; search by name finds it; contact email alone does not match
- [ ] 4.2 Manual: create event → appears at top of `/admin/events`; search by title and by partner name
- [ ] 4.3 Manual: with >25 rows (seed), paginate forward/back; hit out-of-range `?page=` and confirm clamp/redirect
- [ ] 4.4 Run `bun run lint`, `bun run typecheck`, and relevant db tests
