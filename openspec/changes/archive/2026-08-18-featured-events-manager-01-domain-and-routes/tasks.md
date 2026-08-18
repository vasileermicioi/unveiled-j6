## 1. Setup

- [x] 1.1 Confirm prerequisites exist: `packages/db/src/catalog/featured-events.ts`, `featured-partners.ts` (`reorderFeaturedPartners`, `removeFeaturedPartners`), `featured-events.integration.test.ts`, `apps/web/app/routes/[locale]/admin/featured/index.tsx`, `featured/[eventId]/remove.tsx`, `featured-partners/index.tsx` POST, `featured-partners/remove.tsx`
- [x] 1.2 Skim `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md` for release criteria and non-goals (no island, no Gherkin/sitemap rewrite, no schema, no Discover query changes)

## 2. Catalog domain

- [x] 2.1 Add `FEATURED_EVENTS_REORDER_INVALID` to `CatalogErrorCode` in `packages/db/src/catalog/errors.ts`
- [x] 2.2 In `featured-events.ts`, add `reorderFeaturedEvents` (unique ids, same length as current featured set, every id currently featured; two-pass temp `FEATURED_EVENTS_REORDER_TEMP_BASE = 10_000` then `0..n-1`; empty+empty returns `[]`) and `removeFeaturedEvents` (`inArray` delete, de-dupe, no-op on empty)
- [x] 2.3 Keep `removeFeaturedEvent` as `removeFeaturedEvents(db, [eventId])`; barrel already re-exports the module
- [x] 2.4 Extend `featured-events.integration.test.ts`: reorder permutation including pre-existing featured ids, invalid subset rejected (`FEATURED_EVENTS_REORDER_INVALID`, `sort_order` unchanged), bulk remove keeps `events` rows; skip cleanly when `DATABASE_URL` is unset; run `bun test packages/db/src/catalog/featured-events.integration.test.ts`

## 3. Parsers, paths, and error copy

- [x] 3.1 Add `parseFeaturedEventIds` / `parseFeaturedEventIdsFromQuery` in `apps/web/app/lib/admin-prebuilt-image.ts` without changing partner parsers (`eventIds` field; query uses `parseIdListFromQuery`)
- [x] 3.2 Change `adminFeaturedRemovePath(locale, eventIds?: string[])` to `/admin/featured/remove?eventIds=`; add `adminFeaturedEventRemovePath(locale, eventId)` for the old single-id URL; re-export the new helper from `AdminPageShell`
- [x] 3.3 Point `AdminFeaturedTable` at `adminFeaturedEventRemovePath` so per-row Remove still hits the legacy URL until step 02
- [x] 3.4 Change `featuredRemoveBody` to a static DE/EN string (events stay in the catalog under Events), parallel to `featuredPartnersRemoveBody`; map `FEATURED_EVENTS_REORDER_INVALID` in `mapCatalogErrorCode`

## 4. Admin routes and confirm page

- [x] 4.1 Add optional `error` to `AdminFeaturedListPage` and render `AdminFormError` when set
- [x] 4.2 POST on `featured/index.tsx`: parse repeated `eventIds`, `reorderFeaturedEvents`, 302 list on success, re-render list with mapped catalog error on failure (`guardAdminRoute`)
- [x] 4.3 Generalize `AdminFeaturedRemovePage` to selected ids (thumb, title, date; hidden `eventIds`; layout from `AdminFeaturedPartnersRemovePage`); form action is bulk `adminFeaturedRemovePath(locale)`
- [x] 4.4 Add `apps/web/app/routes/[locale]/admin/featured/remove.tsx` (GET + POST, ADMIN guard): empty selected / empty POST → 302 list; POST calls `removeFeaturedEvents` only
- [x] 4.5 Change `featured/[eventId]/remove.tsx` GET and POST to 302 bulk URL when that id is currently featured, else 302 list (no mutate on the old POST)

## 5. Cleanup and verification

- [x] 5.1 Loosen `e2e/specs/admin-events.spec.ts` URL assertion `/\/admin\/featured\/.+\/remove/` to also match `/admin/featured/remove` (do not rewrite the scenario to checkboxes)
- [x] 5.2 Mark `02-featured-events-manager-01-domain-and-routes` done in `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md` (steps 02–03 remain open; canonical product docs wait for step 03)
- [x] 5.3 Run `bun run lint` — exits 0
  <!-- Touched files pass `biome check`. Full-repo `bun run lint` still fails on pre-existing drizzle snapshot format (`packages/db/drizzle/meta/*`), not this change. -->
- [x] 5.4 Run `bun run typecheck` — exits 0
- [x] 5.5 Re-run `bun test packages/db/src/catalog/featured-events.integration.test.ts` — passes, or skips cleanly when `DATABASE_URL` is unset
