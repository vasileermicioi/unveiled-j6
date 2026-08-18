## Context

Parent feature: Featured events manager (`.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md`), step 01 of 03 — domain and routes. See `proposal.md` for motivation. Canonical product behavior is `docs/product/features/admin-events.feature` featured scenarios; OpenSpec capability is `event-catalog`. Gherkin / sitemap / Playwright rewrite wait for step 03.

Current state:

- `packages/db/src/catalog/featured-events.ts` already has `listFeaturedEvents`, `listFeaturedEventIds`, `searchEventsNotFeatured`, `addFeaturedEvent`, and `removeFeaturedEvent` (single-id delete of `featured_events` only). `sort_order` exists; there is no reorder or bulk remove.
- Featured partners is the pattern to copy: `reorderFeaturedPartners` / `removeFeaturedPartners` with `FEATURED_PARTNERS_REORDER_TEMP_BASE = 10_000`, POST on `/:locale/admin/featured-partners`, bulk confirm `/:locale/admin/featured-partners/remove?partnerIds=`, parsers `parseFeaturedPartnerIds` / `parseFeaturedPartnerIdsFromQuery`.
- Admin featured list GET is `apps/web/app/routes/[locale]/admin/featured/index.tsx` (no POST). Single-id confirm is `featured/[eventId]/remove.tsx` + `AdminFeaturedRemovePage` (one title/date paragraph). `AdminFeaturedListPage` has no `error` prop. `adminFeaturedRemovePath(locale, eventId)` builds `/admin/featured/${eventId}/remove`.
- Existing Playwright `Scenario: Admin remove from featured keeps catalog event` clicks the per-row Remove link and asserts URL `/admin/featured/.+/remove`.

Constraints: business logic in `@unveiled/db`, not route files; mutations are dedicated SSR form POST (no client-only modal); `guardAdminRoute` on every new/changed route; HeroUI-only markup; native form fields for hidden ids; no schema/migration; no Discover query changes; no list island (step 02).

## Goals / Non-Goals

**Goals:**

- Catalog can reorder the current featured set and remove one or many membership rows without deleting `events`.
- ADMIN can POST order on `/:locale/admin/featured` and bulk-unfeature via `/:locale/admin/featured/remove?eventIds=`.
- Old `/:locale/admin/featured/:eventId/remove` 302s to the bulk URL (or list) so bookmarks still resolve.
- Integration tests cover permutation (including pre-existing featured ids), invalid subset, and bulk remove keeping catalog events.

**Non-Goals:**

- Drag-drop island, native checkboxes, Save order / Remove selected chrome, dropping gallery or per-row delete (step 02).
- Gherkin, sitemap wording, i18n inventory, coverage matrix, Playwright rewrite to checkbox + bulk confirm (step 03) — except a one-line URL regex so the redirect does not fail existing e2e.
- Featured add/search, `featured_events` schema, Discover public query, Featured partners UI.

## Decisions

1. **Copy partner reorder/remove in the catalog domain**
   - **Choice:** Add `FEATURED_EVENTS_REORDER_TEMP_BASE = 10_000` (same numeric offset as partners; do not share the partner constant — keep modules independent). `reorderFeaturedEvents` validates unique ids, same length as `listFeaturedEvents` ids, every id currently featured; two-pass update (temp then `0..n-1`); empty+empty returns `[]`. `removeFeaturedEvents` de-dupes, no-ops on empty, `inArray` delete. `removeFeaturedEvent` becomes `removeFeaturedEvents(db, [eventId])`. New `CatalogErrorCode` `FEATURED_EVENTS_REORDER_INVALID`.
   - **Rationale:** Step plan: same permutation contract and temp-offset uniqueness trick as partners. Shared DBs already have other featured rows — tests MUST include the full current set.
   - **Alternatives:** Single-pass `sort_order` writes (rejected — unique constraint collisions mid-reorder). Partial reorder of a subset (rejected — spec requires a full permutation). Share one `FEATURED_REORDER_TEMP_BASE` across modules (unnecessary coupling).

2. **List POST mirrors featured partners; island comes later**
   - **Choice:** Add `POST` on `featured/index.tsx` that `parseBody({ all: true })`, `parseFeaturedEventIds`, `reorderFeaturedEvents`, 302 to the list on success; on `CatalogValidationError` re-render with `AdminFormError`. Add optional `error` to `AdminFeaturedListPage`. No hidden `eventIds` fields on the current table — step 02’s island will POST them. Empty POST is an invalid permutation if any featured rows exist (show mapped error), or a no-op success if the featured set is empty.
   - **Rationale:** Independently mergeable: GET list unchanged; POST is live for the next step. Do not invent a client form in this step.
   - **Alternatives:** Defer POST until the island exists (rejected — step 01 owns routes). Auto-save on drag (parent non-goal).

3. **Bulk confirm route + legacy single-id 302**
   - **Choice:** New `featured/remove.tsx` cloned from `featured-partners/remove.tsx`: GET parses `eventIds` query (repeated and/or comma-separated), filters to currently featured ids, 302 to list if none remain; POST parses form `eventIds`, empty → 302 list, else `removeFeaturedEvents` then 302 list. `featured/[eventId]/remove.tsx` GET+POST both 302: if `eventId` is currently featured → `adminFeaturedRemovePath(locale, [eventId])`; else → list (missing event or not featured). Do not mutate on the old POST.
   - **Rationale:** One confirm implementation. Bookmarks and the per-row Remove link (still on the table until step 02) land on bulk confirm. HonoX static `featured/remove` does not collide with `featured/[eventId]/remove`.
   - **Alternatives:** Keep rendering the old single-id page (two UIs). Have old POST still delete (split writers). 404 the old route (breaks bookmarks / current click path).

4. **Path helpers: bulk signature + named legacy helper**
   - **Choice:** Change `adminFeaturedRemovePath(locale, eventIds?: string[])` to `/admin/featured/remove` plus repeated `eventIds` query params (same construction as `adminFeaturedPartnersRemovePath`). Add `adminFeaturedEventRemovePath(locale, eventId)` for `/admin/featured/${eventId}/remove`. `AdminFeaturedTable` keeps using the **legacy** helper until step 02 drops per-row delete, so the 302 is actually exercised. Bulk confirm form `action` is the bulk helper (no query needed; ids go in hidden `eventIds` inputs). Re-export both from `AdminPageShell` if current imports go through it.
   - **Rationale:** Step plan: bulk helper plus a named helper for the old URL. Table → legacy URL → 302 is the compatibility path.
   - **Alternatives:** Point the table straight at the bulk URL (works, but never hits the redirect). Keep the old helper name for bulk (confusing; signature change would silently break callers expecting a path id).

5. **Generalize `AdminFeaturedRemovePage` to a selected-id list**
   - **Choice:** Props become `events`, `imageUrls`, `selectedEventIds`, optional `error` — layout copied from `AdminFeaturedPartnersRemovePage` (list selected rows: thumb or placeholder, title, date via existing `formatEventDateTime`). Hidden `eventIds` inputs. Change `featuredRemoveBody` from `(title, date) => string` to a static DE/EN sentence parallel to `featuredPartnersRemoveBody` (events stay in the catalog under Events). Confirm button copy can stay `featuredRemoveConfirm`. Map `FEATURED_EVENTS_REORDER_INVALID` in `mapCatalogErrorCode` with partners-parallel wording.
   - **Rationale:** Confirm page is in this step; island is not. Native hidden inputs + HeroUI `Form`/`Button`/`Link`/`Paragraph`/`Surface`. i18n inventory docs wait for step 03; strings in `admin-content.ts` are required to compile.
   - **Alternatives:** Keep single-event copy interpolation for one id and a different bulk template (extra branches). Client modal (hard-rule violation).

6. **Parsers sit next to partner parsers; do not change partner parsers**
   - **Choice:** `parseFeaturedEventIds(body, asString)` reads repeated/single `eventIds`; `parseFeaturedEventIdsFromQuery` delegates to existing `parseIdListFromQuery`. Same de-dupe/trim behavior as partners.
   - **Rationale:** One query/form convention across featured lists.
   - **Alternatives:** Reuse partner parsers with a field-name argument (wider refactor, not asked).

7. **Loosen the existing Playwright URL assertion only**
   - **Choice:** In `e2e/specs/admin-events.spec.ts`, change `/\/admin\/featured\/.+\/remove/` to also accept `/admin/featured/remove` (e.g. `/\/admin\/featured\/(?:.+\/)?remove/`). Do not change the scenario to checkboxes, do not drop the per-row link click, do not edit Gherkin/sitemap.
   - **Rationale:** Step 01 must stay independently mergeable. The redirect would otherwise fail that assertion on main until step 03. This is compatibility, not the hardening rewrite.
   - **Alternatives:** Leave the regex (breaks CI if this step merges first). Skip the test (hides a still-valid flow). Rewrite the scenario now (step 03’s job).

## Risks / Trade-offs

- **[Risk] Shared DB featured rows make a 2-id permutation fail** → Mitigation: integration test builds `nextOrder` from newly added ids plus `existingOthers`, same as `reorderFeaturedPartners`.
- **[Risk] Unique `sort_order` collisions during reorder** → Mitigation: two-pass temp offset `10_000 + i` then `i` (decision 1).
- **[Risk] HonoX matches `featured/remove` as `[eventId]=remove`** → Mitigation: static file `featured/remove.tsx` must win over `featured/[eventId]/remove.tsx` (same layout as partners). If a request to `/admin/featured/remove` ever hits the dynamic route, `eventId === "remove"` is not featured → 302 list. Verify with a GET after both files exist.
- **[Risk] Existing e2e URL assertion fails after redirect** → Mitigation: decision 7.
- **[Risk] Confirm copy change (`featuredRemoveBody` signature) breaks other callers** → Mitigation: grep; only `AdminFeaturedRemovePage` uses it today.
- **[Trade-off] List POST exists with no Save-order control** → Acceptable; step 02 wires the form. Empty/malicious POSTs get validation errors, not a crash.
- **[Trade-off] Per-row Remove remains until step 02** → It 302s into bulk confirm (one event selected). Gallery shortcut also stays until step 02.

## Migration Plan

1. Domain helpers + error code + integration tests.
2. Parsers, path helpers, error copy, list `error` prop, generalized confirm page.
3. List POST, bulk `remove.tsx`, legacy route 302.
4. Loosen Playwright URL regex; run lint, typecheck, featured-events integration test.
5. Mark `02-featured-events-manager-01-domain-and-routes` done in the parent guide (steps 02–03 still open). Canonical product docs wait for step 03.
6. **Rollback:** revert the PR (no DB migration). Old single-id remove behavior is restored; `featured_events` rows are unchanged by rollback.

## Open Questions

- None blocking. Discover continues to order by existing `sort_order`; this step only gives admins a way to write it.
