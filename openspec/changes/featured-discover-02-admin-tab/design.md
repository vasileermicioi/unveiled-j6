## Context

Parent feature: Featured Discover & membership browse split (`.dev-plan/current-iteration/featured-discover-parent-guide.md`). Step 01 is done: `featured_events` table + `@unveiled/db` helpers (`listFeaturedEvents`, `listFeaturedEventIds`, `searchEventsNotFeatured`, `addFeaturedEvent`, `removeFeaturedEvent`). Discover still uses `listUpcomingEvents`; this step does not change that.

Admin chrome today: tabs in `admin-tabs.ts` / `AdminTabNav` (`overview | partners | events | users | waitlist`). Event list pattern: `AdminEventsListPage` + `AdminSearchForm` + table + `guardAdminRoute`. Destructive confirm pattern: `admin/events/[id]/delete.tsx` (GET confirm + POST mutate + redirect). Copy lives in `apps/web/app/lib/admin-content.ts`. Sitemap admin table omits featured routes.

Constraints: SSR-only mutations; HeroUI-only markup; theme tokens for visuals; Tailwind layout only; no radios/checkboxes; ADMIN via `guardAdminRoute`; locale-prefixed routes; business logic stays in `@unveiled/db` (routes call helpers only).

## Goals / Non-Goals

**Goals:**

- ADMIN Featured tab listing curated events by `sort_order`.
- Search existing catalog events that are not featured; POST add; redirect to list.
- SSR remove confirm that deletes the featured row only; catalog event remains on `/admin/events`.
- DE/EN copy + sitemap rows for `/admin/featured*`.

**Non-Goals:**

- Discover consuming featured list / membership browse nav (step 03).
- Full product feature docs / BDD / e2e suite (step 04; smoke OK).
- Editing event fields from Featured; drag-and-drop reorder; partner-managed lists.
- New domain helpers beyond what step 01 already exports (unless a thin admin list DTO wrapper is clearly needed — prefer calling helpers directly).

## Decisions

1. **Tab placement and inference**
   - **Choice:** Add `"featured"` to `AdminTab` and `ADMIN_TAB_ORDER` immediately after `"events"`. Path helpers: `adminFeaturedPath`, `adminFeaturedAddPath`, `adminFeaturedRemovePath(locale, eventId)`. In `inferAdminTab`, match `/admin/featured` before any broader fallthrough; keep `/admin/events` → `events`.
   - **Rationale:** Curation sits next to Events without replacing Events CRUD; pathname includes are unambiguous.
   - **Alternatives:** Nested under Events UI (violates “separate curation list”); place after waitlist (weaker IA).

2. **Route file layout (HonoX)**
   - **Choice:**
     - `GET` `apps/web/app/routes/[locale]/admin/featured/index.tsx` — list
     - `GET` + `POST` `.../featured/add.tsx` — search (`?q=`) and add (`eventId` form field)
     - `GET` + `POST` `.../featured/[eventId]/remove.tsx` — confirm + remove
   - **Rationale:** Mirrors waitlist promote / event delete dedicated pages; SSR form POST only.
   - **Alternatives:** Single index with POST actions (harder empty/confirm UX); client modal (forbidden).

3. **List data and columns**
   - **Choice:** `listFeaturedEvents(db)` with **no** `upcomingOnly` on admin list (past featured rows stay visible until removed — parent guide). Columns: title, partner name, date/time (Europe/Berlin via existing `formatEventDateTime`), actions (Remove → confirm path). Optional link to event edit is nice-to-have if cheap; not required. Primary list action: Link to add page.
   - **Rationale:** Admin must manage past featured rows; Discover filter is step 03.
   - **Alternatives:** Upcoming-only admin list (hides stale curation); thumbnails like events list (extra image work — skip unless reuse is trivial).

4. **Search-and-add UX**
   - **Choice:** Add page with GET form `q` (reuse `AdminSearchForm` or equivalent GET search). Results from `searchEventsNotFeatured(db, { q, limit })` — default limit ~25; pagination optional (skip if search is small; if needed, reuse admin list query helpers). Each row: POST form with hidden `eventId` submitting to same add route (or dedicated POST handler on `add.tsx`). On success → `302` to featured list. On `ALREADY_FEATURED` / `EVENT_NOT_FOUND` → re-render add page with mapped admin error.
   - **Rationale:** Matches “search GET + submit”; no Select/checkbox required; helper already excludes featured.
   - **Alternatives:** Add from Events list row action (splits curation UX); typeahead island (unnecessary).

5. **Remove confirm copy and param name**
   - **Choice:** Param `eventId` (not featured-row surrogate — PK is `event_id`). Confirm body MUST state the catalog event is kept / still available under Events. POST calls `removeFeaturedEvent`; missing featured row → treat as success redirect or 404 consistent with delete patterns (prefer redirect-to-list if already gone). Never call `deleteEvent`.
   - **Rationale:** Step brief + parent release criteria; param matches domain API.
   - **Alternatives:** Soft “unfeature” without confirm (weaker safety vs accidental click).

6. **Components vs route wiring**
   - **Choice:** Presentational pages under `apps/web/app/components/admin/` (e.g. `AdminFeaturedListPage`, `AdminFeaturedAddPage`, `AdminFeaturedRemovePage` + small table/result list). Routes: `guardAdminRoute` → load data → `renderAdminPage` / `c.render` with `AdminPageShell` breadcrumbs.
   - **Rationale:** Matches Events/Waitlist split; keeps routes thin.
   - **Alternatives:** All JSX in route files (harder stories/reuse).

7. **i18n keys**
   - **Choice:** Extend `AdminCopy` with `tabFeatured`, list/add/remove titles, subtitles, empty states, add submit, remove confirm/body (function taking title like delete), cancel. EN: “Featured”; DE: “Empfohlen” (or “Featured” if brand prefers — brief suggests Empfohlen).
   - **Rationale:** Tab + page strings already centralized in `admin-content.ts`.
   - **Alternatives:** Separate featured-content module (unnecessary for one tab).

8. **Sitemap**
   - **Choice:** Add rows for `/admin/featured`, `/admin/featured/add?q=`, `/admin/featured/:eventId/remove` under Admin (MVP) table; Auth ✅, Role ADMIN.
   - **Rationale:** Step deliverable; full Gherkin in step 04.

## Risks / Trade-offs

- **[Risk] Admin adds many past events → cluttered Discover later** → Mitigation: intentional; Discover will filter upcoming in step 03; admin sees all for cleanup.
- **[Risk] Duplicate add race / double-submit** → Mitigation: domain unique PK + `ALREADY_FEATURED`; show error on add page.
- **[Risk] Remove confused with delete event** → Mitigation: confirm copy + never call `deleteEvent`; smoke check event remains on `/admin/events`.
- **[Risk] Tab order / story drift** → Mitigation: update `AdminTabNav.stories` for Featured active state.
- **[Trade-off] No e2e in this step** → Mitigation: lint/typecheck + documented manual smoke; step 04 owns BDD/e2e.
- **[Trade-off] openspec capability `admin-events` vs product SoT** → Delta is planning contract; implementers update sitemap now; feature docs in step 04.

## Migration Plan

1. Extend tabs + copy + `AdminTabNav`.
2. Add list / add / remove components + routes; wire domain helpers.
3. Update sitemap admin rows.
4. `bun run lint`, `bun run typecheck`; manual smoke (add, remove, event still in Events).
5. Mark step done in parent guide; note follow-ups for step 03.
6. Rollback = revert routes/components/tab wiring; no schema change this step (table already from 01).

## Open Questions

- None blocking. Parent open questions on membership “active” and nav redirects remain for step 03.
