## Why

Featured partners already persist Discover order and bulk-remove via `@unveiled/db` plus SSR POST. Featured events have `sort_order` and single-id remove only, so admins cannot curate Discover event order or unfeature many rows at once. This first `featured-events-manager` step adds the catalog helpers and admin routes so step 02 can wire the same Save order / select-to-remove UX on the list.

## What Changes

- Add `reorderFeaturedEvents(db, orderedEventIds)` and `removeFeaturedEvents(db, eventIds)` in `@unveiled/db`. Keep `removeFeaturedEvent` as a one-id wrapper around bulk remove.
- Reorder MUST be a permutation of the **current** featured set (same ids, same length, no duplicates). Persist `sort_order` as `0..n-1` via a two-pass temp offset (copy `FEATURED_PARTNERS_REORDER_TEMP_BASE`). Invalid permutation → `CatalogValidationError` with `FEATURED_EVENTS_REORDER_INVALID`; existing order MUST stay unchanged.
- POST on `/:locale/admin/featured` persists order from repeated `eventIds` fields; catalog errors re-render the list with `AdminFormError`.
- New bulk confirm route `/:locale/admin/featured/remove?eventIds=` (GET + POST), mirroring featured partners. Confirm page lists selected events (thumb, title, date); POST deletes `featured_events` rows only.
- Redirect `/:locale/admin/featured/:eventId/remove` → bulk URL with that one id when the event is currently featured; otherwise 302 to the list (bookmarks / current e2e keep working).
- Parsers `parseFeaturedEventIds` / `parseFeaturedEventIdsFromQuery` next to the partner parsers; path helper `adminFeaturedRemovePath(locale, eventIds?: string[])` for the bulk URL; keep a named helper for the old single-id URL.
- Integration coverage in `featured-events.integration.test.ts`: reorder permutation (include pre-existing featured ids), invalid subset rejected, bulk remove keeps `events` rows.
- Out of scope: list island / drag-drop UI (step 02); Gherkin / Playwright / sitemap wording beyond what routes need to compile (step 03); Featured add search; schema/migration (`sort_order` already exists); Discover query changes.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Featured events curation store SHALL reorder the current featured set and remove one or many featured rows without deleting underlying `events` rows. Invalid reorder MUST fail with a catalog validation error and MUST NOT leave a partial order.

## Impact

- **Catalog domain (`@unveiled/db`):** `packages/db/src/catalog/featured-events.ts`; `CatalogErrorCode` in `packages/db/src/catalog/errors.ts`; barrel already re-exports the module.
- **Admin routes (`apps/web`):** POST on `apps/web/app/routes/[locale]/admin/featured/index.tsx`; new `apps/web/app/routes/[locale]/admin/featured/remove.tsx`; `featured/[eventId]/remove.tsx` becomes a 302.
- **Admin UI (confirm + list error chrome only):** generalize `AdminFeaturedRemovePage` to selected ids (partner remove page is the layout reference); optional `error` on `AdminFeaturedListPage`. No drag-drop island.
- **Parsers / paths:** `apps/web/app/lib/admin-prebuilt-image.ts`; `adminFeaturedRemovePath` in `admin-tabs.ts` (re-exported from `AdminPageShell`).
- **Error copy:** `FEATURED_EVENTS_REORDER_INVALID` in `mapCatalogErrorCode` (`admin-content.ts`), parallel to partners.
- **Tests:** `packages/db/src/catalog/featured-events.integration.test.ts`.
- **Source brief:** `.dev-plan/current-iteration/02-featured-events-manager-01-domain-and-routes.md`
- **Parent:** `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md`
- **Consumed by:** `03-featured-events-manager-02-ui-surfaces`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/db/src/catalog/featured-events.integration.test.ts` (passes, or skips cleanly when `DATABASE_URL` is unset)
