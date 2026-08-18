## Context

Parent feature: Featured events manager (`.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md`), step 02 of 03 — UI surfaces. See `proposal.md` for motivation. Canonical product behavior for this increment is the `admin-events` / `admin-featured-partners` deltas; Gherkin / sitemap / Playwright rewrite wait for step 03.

Current state (after archived step 01):

- POST on `/:locale/admin/featured` already calls `reorderFeaturedEvents` from repeated `eventIds`; catalog errors re-render `AdminFeaturedListPage` with `AdminFormError`.
- Bulk confirm is `/:locale/admin/featured/remove?eventIds=`; `adminFeaturedRemovePath(locale, eventIds?)` exists. Legacy `adminFeaturedEventRemovePath` still feeds per-row delete on the table.
- `AdminFeaturedListPage` still mounts `AdminFeaturedTable` (thumb, title, partner, date, Actions: gallery + trash). Empty copy lives inside the table. No island, no Save order, no checkboxes.
- Pattern to copy: `apps/web/app/islands/AdminFeaturedPartnersManager.tsx` + `AdminFeaturedPartnersListPage` (toolbar, dirty Save order POST, checkbox → remove Link, PointerSensor distance 8 + keyboard sortable, stop pointer capture on the checkbox). Partners use a **tile grid**; this list MUST keep **table columns**.
- `getAdminCopy` already has `featuredEmpty` / titles; partners have `featuredPartnersReorderHint` / `SaveOrderAction` / `RemoveBulkAction` / `SelectLabel`. Featured events lack those four keys.
- No Ladle story exists for `AdminFeaturedTable`.

Constraints: islands only in `apps/web/app/islands/`; HeroUI primitives + Tailwind **layout only**; native `<input type="checkbox">` (AGENTS §14); Save order and remove confirm are form POST / dedicated page, not a client mutation modal; `button button--primary` / `button button--secondary`; yellow page / colors / borders in `globals.css`; no new routes.

## Goals / Non-Goals

**Goals:**

- Hydrated featured-events manager island with drag-reorder, dirty Save order POST, native checkbox bulk-remove Link.
- Table (or table-equivalent rows): thumb, title, partner, date — plus checkbox and drag. Missing/broken thumbs do not block select or drag.
- No gallery-manage or per-row delete on `/admin/featured`.
- DE/EN copy for hint / save / bulk remove / per-row select label.
- Empty state + Add event CTA stay on the list page; add-results unchanged.

**Non-Goals:**

- Playwright, Gherkin, sitemap, i18n inventory, coverage matrix (step 03).
- Partner-style logo tile grid.
- Featured add/search filters, Discover cards, Featured partners island, Events list gallery buttons.
- New catalog helpers or routes (step 01 already owns POST + bulk confirm).
- New Ladle stories (none exist for this table; do not add one).
- Deleting `adminFeaturedEventRemovePath` or the legacy 302 route (still valid bookmarks; island just stops linking there).

## Decisions

1. **Surface sortable rows, not HeroUI `Table.Row`**
   - **Choice:** Do not fight `Table.Row` + `setNodeRef`. Render a header row plus one sortable `Surface` row per event, same columns as today’s table (thumb, title, partner, date). Use `verticalListSortingStrategy`. Wrap each row with `useSortable` the same way partners wrap tiles (`ref={setNodeRef}`, `render` onto a `div` with `attributes`/`listeners`). Drop the Actions column.
   - **Rationale:** Parent guide already flags `Table.Row` as the HeroUI/dnd-kit risk. Partners and gallery already prove Surface + dnd-kit. Step plan allows this fallback as long as columns stay — choosing it up front keeps the increment mergeable.
   - **Alternatives:** Try `Table.Row` first then fall back (wasted apply time). Tile grid (rejected — parent non-goal).

2. **Island API mirrors partners; date/thumb formatted on the SSR page**
   - **Choice:** `AdminFeaturedEventsManager` props: `locale`, `reorderAction`, `items[]`, `copy`. Item: `{ eventId, title, partnerName, dateLabel, thumbnailUrl, selectLabel }`. `AdminFeaturedListPage` maps `FeaturedEventRow` + `imageUrls` via `buildEventImageUrls` / existing map, `formatEventDateTimeWithCount(event.dateTime, locale, event.dateTimes?.length ?? 1)`, and `copy.featuredSelectLabel(event.title)`. `reorderAction` = `adminFeaturedPath(locale)`. Hidden inputs `name="eventIds"`.
   - **Rationale:** Island stays client-only and serializable. List POST already parses `eventIds`. Partners already pass `selectLabel` per item.
   - **Alternatives:** Import `@unveiled/db` types and formatters into the island (heavier client bundle, worse SSR/island split).

3. **Visible native checkbox in a leading column; stop dnd-kit capture like partners**
   - **Choice:** Dedicated select column with a **visible** native `<input type="checkbox">` (themed in `globals.css` if needed — do not visually hide it behind a custom tile icon). `onPointerDown` / `onMouseDown` / `onTouchStart` `stopPropagation` on the label and input, same helpers as partners. `aria-label` = per-row `selectLabel`. Remove selected: `Link` to `adminFeaturedRemovePath(locale, selectedIds)` when `selectedIds.length > 0`, else disabled `Button`.
   - **Rationale:** Hard rule 14 + table layout. Playwright step 03 can use proximity (“checkbox near title”) without a custom painted control. Tile overlay checkboxes are for logo grids, not columns.
   - **Alternatives:** Copy partners’ clipped checkbox + painted icon (works, but hides the native control on a table). HeroUI Checkbox (rejected — §14).

4. **dnd-kit sensors copy partners; strategy is vertical list**
   - **Choice:** `PointerSensor` `{ activationConstraint: { distance: 8 } }` + `KeyboardSensor` `sortableKeyboardCoordinates`. `closestCenter`. `arrayMove` on drag end. Dirty = current id order ≠ initial order (`orderKey` join on `\0`). Reset items + selection when `initialItems` identity/order changes (`useEffect` like partners). `img` `draggable={false}`.
   - **Rationale:** Step plan: copy sensors. Distance 8 lets checkbox clicks and text selection happen without starting a drag. `rectSortingStrategy` is for the partner grid.
   - **Alternatives:** Auto-save on drag (parent non-goal). `rectSortingStrategy` (wrong collision model for a single column).

5. **Copy keys parallel partners; toolbar verbs from the step plan**
   - **Choice:** Add to `AdminCopy` DE/EN:
     - `featuredReorderHint`: DE `Zum Sortieren ziehen, dann Reihenfolge speichern. Events auswählen, dann entfernen.` / EN `Drag to reorder, then save order. Select events, then remove.`
     - `featuredSaveOrderAction`: `Reihenfolge speichern` / `Save order`
     - `featuredRemoveBulkAction`: `Auswahl entfernen` / `Remove selected`
     - `featuredSelectLabel: (title) => …` same quoting pattern as `featuredPartnersSelectLabel`
   - **Rationale:** Step plan names these keys and the toolbar label **Remove selected** (not “Remove events”). Hint mirrors partners with “Events”.
   - **Alternatives:** Reuse partner strings (wrong noun). “Events entfernen” / “Remove events” (less aligned with the step’s control name).

6. **List page wiring + delete `AdminFeaturedTable`**
   - **Choice:** `AdminFeaturedListPage` like partners: `AdminFormError`, empty `Paragraph` with `featuredEmpty` when `events.length === 0`, else the island. Keep shell Add event CTA. Delete `AdminFeaturedTable.tsx` (only consumer). Leave `adminFeaturedEventRemovePath` and `featured/[eventId]/remove.tsx` 302 in place.
   - **Rationale:** Step plan: remove table if unused. Empty copy must not live in the island. Legacy URL still bookmarks.
   - **Alternatives:** Keep a dead table file (noise). Point leftover per-row links at bulk URL (there will be none).

7. **Theme: new `.admin-featured-events*` block; reuse `.admin-table__logo` for thumbs**
   - **Choice:** Toolbar/hint/save-form classes can follow partners’ naming. Rows: bordered cream Surface, grab cursor, dragging opacity, selected outline using brand tokens — **row** layout (`display` grid or flex columns: checkbox | 3rem thumb | title | partner | date), not a 2–4 column tile grid. Reuse `.admin-table__logo` / `--placeholder` for the 3rem square thumb. Missing URL → placeholder `imagePlaceholderLabel`. Broken remote image: still render the checkbox and drag handle (do not disable the row on `onError`).
   - **Rationale:** Theme-only colors/borders; Tailwind only for `flex`/`gap`/`max-w`. Same thumb size as today’s table so the list does not become a poster grid.
   - **Alternatives:** Reuse `.admin-featured-partners__grid` (rejected — that **is** the tile grid). Keep HeroUI `Table` chrome without dnd-kit (no reorder).

8. **Docs/e2e deferred; gallery copy stays on Events**
   - **Choice:** Do not edit `admin-events.feature`, sitemap, ui-component-map, i18n inventory, or Playwright. Confirm by code search that `/admin/featured` has no control whose accessible name is `Galerie-Fotos verwalten` / `Manage gallery photos`. Events list/edit gallery buttons stay.
   - **Rationale:** Step 03 owns product SoT + e2e rewrite. Until then, Gherkin still mentions a Featured gallery MAY and `:eventId/remove` — expected drift.
   - **Alternatives:** Patch Gherkin now (rejected — splits hardening).

## Risks / Trade-offs

- **[Risk] Surface rows look unlike other admin tables** → Mitigation: keep the same four data columns, 3rem thumbs, `admin-table__logo`, header labels from `tableLogo` / `tableTitle` / `tablePartner` / `tableDate`. Not a tile grid.
- **[Risk] Drag starts when clicking the checkbox** → Mitigation: decision 3 stopPropagation + PointerSensor distance 8.
- **[Risk] Existing Playwright still clicks per-row Remove / gallery** → Mitigation: step 01 already loosened the remove URL regex; gallery click will fail until step 03. Do not rewrite e2e here. Land 02 and 03 close together, or expect that featured e2e scenario to fail if CI runs against this UI before 03.
- **[Risk] Reorder POST with empty `eventIds` when the list is non-empty** → Mitigation: Save order is disabled until dirty; dirty list always posts the full current permutation. Empty featured set never mounts the island.
- **[Trade-off] Visible native checkbox vs painted partner control** → Native column is the right table control; visual unity with partners is the toolbar/verbs, not the tile checkbox.
- **[Trade-off] Product Gherkin lags the UI until step 03** → Acceptable under the 5-step pattern; deltas here are the planning contract.

## Migration Plan

1. Add DE/EN copy keys.
2. Add `AdminFeaturedEventsManager` island + `globals.css` row/toolbar/checkbox rules.
3. Wire `AdminFeaturedListPage`; delete `AdminFeaturedTable`.
4. Grep that gallery-manage / per-row delete are gone from the featured list.
5. `bun run lint`, `bun run typecheck`, `bun run stories` (starts; no new story).
6. Mark `03-featured-events-manager-02-ui-surfaces` done in the parent guide (step 03 still open). Canonical product docs wait for step 03.
7. **Rollback:** revert the UI PR. Step 01 routes remain; list would need the old table restored. No DB migration.

## Open Questions

- None blocking. Existing featured e2e that still assume gallery/per-row Remove will be rewritten in `04-featured-events-manager-03-hardening`.
