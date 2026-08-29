## Context

Parent feature: catalog publish / unpublish (`.dev-plan/current-iteration/catalog-publish-parent-guide.md`). See `proposal.md` for motivation.

Step 01 (archived) shipped `events.published`, `featured_events.published`, `featured_partners.published`, and `setEventPublished` / `setFeaturedEventPublished` / `setFeaturedPartnerPublished` (missing → `EVENT_NOT_FOUND` / `PARTNER_NOT_FOUND`; already-in-state → no-op). Discover already calls `publishedOnly: true`. Admin lists still use unfiltered `listEvents` / `listFeatured*`.

Current admin surfaces:

- Events catalog: `admin/events/index.tsx` → `parseAdminEventsListQuery` (`title`, `partner`, `language`, `sort`, `dir`, `page`) → `listEvents` / `countEvents` (no `published` option) → `AdminEventsListPage` / `AdminEventsListFilters` / `AdminEventsTable`. Actions via `AdminTableActions` (`edit`, `bookings`, `gallery`, `clone`, `delete`, `download`). No status chip. No `?ok=` flash.
- Confirm pattern: `admin/events/[id]/delete.tsx` — `guardAdminRoute`, `getEventById` 404, GET confirm + POST, HeroUI `Form`/`Button`/`Link`, **no** `FormDraftPersistence`. Guest → login, USER → locale home.
- Create success: `admin-event-wizard-http.tsx` `302` to `eventListPath` with no flash and no publish pointer.
- Featured lists: `AdminFeaturedListPage` / `AdminFeaturedPartnersListPage` map rows into manager islands (`AdminFeaturedEventsManager`, `AdminFeaturedPartnersManager`). Islands own drag-reorder POST + checkbox remove. `addFeaturedEvent` / `addFeaturedPartner` redirect to the list with no flash.
- **DTO gap:** `FeaturedEventRow = Event & { sortOrder }` so `row.published` is **catalog** `events.published`, not `featured_events.published`. `FeaturedPartnerRow = Partner & { sortOrder }` — `partners` has no `published`. Admin chips cannot show membership status without extending these types.

Constraints: SSR-only mutations (hard rule 1); HeroUI markup + Tailwind layout only; native `<select>` for the published filter (hard rule 14; `AdminFormSelect` already wraps native select); confirm pages draft-exempt (hard rule 15); `guardAdminRoute`; packages never depend on `apps/web`. Featured reorder MUST stay a permutation POST of ids only.

## Goals / Non-Goals

**Goals:**

- Six delete-class confirm routes that call existing `set*Published` and redirect to the originating list.
- Published/Draft chips + publish/unpublish links on Events, Featured events, and Featured partners.
- Optional Events `published=yes|no` filter wired through parse / count / list / sort / pagination / reset.
- Featured list DTOs expose membership `published` distinct from catalog `Event.published`.
- Create and featured-add success do not imply Browse/Discover is live; they point at publish confirm.
- Sitemap table rows for the new paths. Lint and typecheck green.

**Non-Goals:**

- Playwright / canonical Gherkin / schema-overview / i18n inventory (step 03).
- Event preview (`event-preview-*`).
- `partners.published`, bulk publish, scheduled publish.
- Publish inside featured manager islands (no extra POST).
- Changing `set*Published` semantics or Discover `publishedOnly`.

## Decisions

1. **Confirm routes clone delete, not a new mutation style**
   - **Choice:** Six HonoX files:
     - `apps/web/app/routes/[locale]/admin/events/[id]/publish.tsx`
     - `apps/web/app/routes/[locale]/admin/events/[id]/unpublish.tsx`
     - `apps/web/app/routes/[locale]/admin/featured/[eventId]/publish.tsx`
     - `apps/web/app/routes/[locale]/admin/featured/[eventId]/unpublish.tsx`
     - `apps/web/app/routes/[locale]/admin/featured-partners/[partnerId]/publish.tsx`
     - `apps/web/app/routes/[locale]/admin/featured-partners/[partnerId]/unpublish.tsx`
     Shared presentational `AdminPublishConfirmPage` (title, body naming the event/partner + current state, primary submit, secondary cancel to the list). GET: `guardAdminRoute` → load row → 404 via `NotFoundPage` if missing (catalog event missing, or featured membership missing) → render. POST: same load → `set*Published` → `302` to originating list `?ok=publish` or `?ok=unpublish`. On `CatalogValidationError`, re-render confirm with `mapCatalogError`. **No** `FormDraftPersistence`. Idempotent POST is free (use cases no-op).
   - **Rationale:** Hard rule 1; step plan names delete as the pattern; one component avoids six copy-pasted shells.
   - **Alternatives:** Client toggle on the list (forbidden). One route with `intent` (weaker URLs; sitemap wants six paths).

2. **Path helpers on `admin-tabs.ts`**
   - **Choice:** `adminEventPublishPath` / `adminEventUnpublishPath`; `adminFeaturedPublishPath` / `adminFeaturedUnpublishPath`; `adminFeaturedPartnerPublishPath` / `adminFeaturedPartnerUnpublishPath`. `inferAdminTab` unchanged (prefix `/admin/events`, `/admin/featured`, `/admin/featured-partners` already correct).
   - **Rationale:** Same as bookings/gallery helpers; featured publish must not be inferred as Events.
   - **Alternatives:** Inline `localizedPath` in tables (easy to drift).

3. **Events list: status column + icon action; optional `published=` filter**
   - **Choice:** Add a Status column on `AdminEventsTable` with HeroUI `Chip` (`Published` / `Veröffentlicht` vs `Draft` / `Entwurf`) from `event.published`. Add `AdminTableActionIcon` `"publish"` | `"unpublish"` and SVGs `apps/web/public/icons/admin-publish.svg` / `admin-unpublish.svg` (same 16–24px stroke as existing admin icons). Show Publish when `published === false`, Unpublish when true (one action, not both). Preserve existing action order; insert publish/unpublish after edit (visibility is the next catalog concern).
   - **Filter:** `published=yes` → `listEvents`/`countEvents` `{ published: true }`; `published=no` → `{ published: false }`; omitted/invalid → no published predicate. Native select via existing `AdminFormSelect` (already a native `<select>`): empty = all, `yes`, `no`. Extend `AdminEventsListQuery`, `parseAdminEventsListQuery`, `buildAdminListQueryString`, `adminListPageRedirectPath` inputs, `AdminEventsListFilters` (preserve sort + published), `AdminEventsTable` `sortHref`, list `hasFilters` / `resetHref`, and `eventListFilterConditions` / `ListEventsOptions` / `CountEventsOptions` with `published?: boolean`.
   - **Flash:** `AdminEventsListPage` reads `ok=publish|unpublish|created` like `AdminUsersListPage` (`admin-flash admin-flash--success`).
   - **Rationale:** Step plan optional filter; chips + icon actions match the Events table; query plumbing must stay consistent or pagination/sort drop the filter.
   - **Alternatives:** Text-only status (weaker scan). HeroUI `Select` (hard rule 14). Filter-only without chips (admin cannot see state when unfiltered).

4. **Featured DTO: `featuredPublished` distinct from catalog `published`**
   - **Choice:** Change `FeaturedEventRow` to `Event & { sortOrder: number; featuredPublished: boolean }`. `listFeaturedEvents` selects `featuredEvents.published` and maps `featuredPublished: row.featuredPublished` (do **not** overwrite `Event.published`). Change `FeaturedPartnerRow` to `Partner & { sortOrder: number; featuredPublished: boolean }` the same way (`partners` has no publish flag). `addFeatured*` return `featuredPublished: false` (insert default). Reorder returns `listFeatured*` so the new field stays populated. Admin chips and confirm GET use `featuredPublished`. Confirm POST still calls `setFeatured*Published` only.
   - **Rationale:** Today `row.published` on a featured event is the catalog flag — a published featured card on a draft event would look live, and a draft featured card on a live event would look unpublished. Partners cannot show a chip at all.
   - **Alternatives:** Second query in the web layer (duplicates join). Reuse `published` on the spread Event (wrong flag). Hide catalog `published` on featured rows (loses “Discover needs both” context on the confirm page).

5. **Featured islands: chip + link out; reorder POST unchanged**
   - **Choice:** Extend `AdminFeaturedEventManagerItem` / `AdminFeaturedPartnerManagerItem` with `featuredPublished`, `statusLabel`, `publishHref`, `publishLabel`. Render HeroUI `Chip` beside the title and a `Link` to the confirm page. Apply the same `stopDragGesture` handlers used on the checkbox so drag does not steal the click. Do **not** add hidden fields or a second form to the reorder POST. Confirm pages for featured events MAY mention when the catalog event is still draft (`event.published === false`) so publish-featured does not look broken when Discover still omits the card (parent: both flags required).
   - **Rationale:** Step plan: islands stay reorder/remove-only; publish is a navigation.
   - **Alternatives:** Publish POST from the island (forbidden client mutation / extra POST). Status only on a new SSR table (throws away the shipped drag manager).

6. **Create and featured-add success point at publish, not Browse/Discover**
   - **Choice:** After successful `createEvent`, redirect to `adminEventPublishPath(locale, event.id)` (GET confirm), not a silent list redirect. After successful `addFeaturedEvent` / `addFeaturedPartner`, redirect to that row’s featured publish confirm. Confirm cancel returns to the list; POST publish lands on the list `?ok=publish`. Edit wizard stays on `eventListPath` after save (already-published or draft unchanged) but `EventAdminForm` / edit chrome adds a text `Link` to publish or unpublish confirm (not a modal, not a primary submit).
   - **Rationale:** Step plan: create-success MUST NOT imply Browse is live; “point at publish confirm”. Landing on the confirm page is the strongest pointer without inventing a toast island. Featured add default is unpublished — same pointer.
   - **Alternatives:** List `?ok=created` plus a sentence (weaker pointer). Auto-publish on create (violates parent default-false). Stay on edit after create (no publish prompt).

7. **Copy keys (verbatim DE/EN)**
   - **Choice:** Add to `AdminCopy` + both locale objects:
     | Key | DE | EN |
     |---|---|---|
     | `statusPublished` | Veröffentlicht | Published |
     | `statusDraft` | Entwurf | Draft |
     | `publishAction` | Veröffentlichen | Publish |
     | `unpublishAction` | Veröffentlichung aufheben | Unpublish |
     | `eventsPublishedFilter` | Status | Status |
     | `eventsPublishedAll` | Alle | All |
     | `publishEventTitle` | Event veröffentlichen | Publish event |
     | `publishEventBody` | `(title, date) =>` `„${title}“ (${date}) veröffentlichen? Es erscheint danach auf Browse, wenn das Datum noch ansteht.` | `Publish “${title}” (${date})? It will appear on Browse when the date is still upcoming.` |
     | `unpublishEventTitle` | Veröffentlichung aufheben | Unpublish event |
     | `unpublishEventBody` | `(title) =>` `„${title}“ von Browse nehmen? Das Event bleibt im Katalog. Bestehende Buchungen bleiben.` | `Unpublish “${title}” from Browse? The event stays in the catalog. Existing bookings stay.` |
     | `publishFeaturedEventTitle` | Empfohlenes Event veröffentlichen | Publish featured event |
     | `publishFeaturedEventBody` | `(title) =>` `„${title}“ auf Discover zeigen? Discover listet es nur, wenn auch das Katalog-Event veröffentlicht ist.` | `Show “${title}” on Discover? Discover lists it only when the catalog event is also published.` |
     | `unpublishFeaturedEventTitle` | Empfohlenes Event zurückziehen | Unpublish featured event |
     | `unpublishFeaturedEventBody` | `(title) =>` `„${title}“ von Discover nehmen? Die Featured-Mitgliedschaft und das Katalog-Event bleiben.` | `Remove “${title}” from Discover? Featured membership and the catalog event stay.` |
     | `publishFeaturedPartnerTitle` | Empfohlenen Partner veröffentlichen | Publish featured partner |
     | `publishFeaturedPartnerBody` | `(name) =>` `„${name}“ unter Partner venues auf Discover zeigen?` | `Show “${name}” under Partner venues on Discover?` |
     | `unpublishFeaturedPartnerTitle` | Empfohlenen Partner zurückziehen | Unpublish featured partner |
     | `unpublishFeaturedPartnerBody` | `(name) =>` `„${name}“ von Discover Partner venues nehmen? Der Partner bleibt im Katalog und auf der Featured-Liste.` | `Remove “${name}” from Discover Partner venues? The partner stays in the catalog and on the featured list.` |
     | `publishConfirm` | Veröffentlichen | Publish |
     | `unpublishConfirm` | Veröffentlichung aufheben | Unpublish |
     | `okPublish` | Veröffentlichung gespeichert. | Publish status saved. |
     | `okUnpublish` | Veröffentlichung aufgehoben. | Unpublished. |
     | `featuredCatalogDraftNote` | Das Katalog-Event ist noch ein Entwurf. Discover zeigt die Karte erst, wenn beides veröffentlicht ist. | The catalog event is still a draft. Discover shows the card only when both are published. |
   - Confirm submit uses `publishConfirm` / `unpublishConfirm`; cancel reuses `copy.cancel`.
   - **Rationale:** Hard rule 5 — lock strings here so implementers do not improvise. Step 03 adds i18n inventory rows.
   - **Alternatives:** Approximate wording (rejected).

8. **Sitemap this step; Gherkin waits**
   - **Choice:** Add six ADMIN rows next to the existing delete/featured rows. Update the Events list row query string to include `published=`. Do not rewrite `admin-events.feature` / Playwright titles.
   - **Rationale:** Step plan allows sitemap rows now; canonical Gherkin is step 03.
   - **Alternatives:** Defer sitemap entirely (then step 03 must invent the paths).

9. **Shared confirm loaders**
   - **Choice:** Event confirms: `getEventById` (admin, includes drafts). Featured event confirms: `listFeaturedEvents` (unfiltered) find by `event.id`, or a one-row select in the route file via existing catalog helpers — prefer filtering `listFeaturedEvents` result by id (admin lists are small) **or** add a tiny `getFeaturedEventRow(db, eventId)` next to `setFeaturedEventPublished` if a single select is cleaner. Missing featured membership → 404 even if the catalog event exists. Featured partner: same with `listFeaturedPartners` / `getPartnerById` + membership check. Do not call `getPublicEventById` on admin confirms.
   - **Rationale:** 404 when the featured row is gone matches delete-missing. Unfiltered list keeps drafts.
   - **Alternatives:** 302 to the featured list when membership is missing (hides bad bookmarks less clearly).

10. **Domain filter is the only `@unveiled/db` write besides DTO**
    - **Choice:** `published?: boolean` on `ListEventsOptions` / `CountEventsOptions` / `eventListFilterConditions` (`eq(events.published, true|false)` when defined). No new migration. Package tests: `listEvents({ published: false })` returns drafts only; count matches. Featured DTO mapping covered by existing featured list tests plus an assertion that `featuredPublished` is independent of `event.published`.
    - **Rationale:** Step plan allows `listEvents` optional published. Filtering only in SSR would drift from `countEvents` and featured-add search (do **not** pass `published` into `searchEventsNotFeatured` unless we also add the UI — featured-add stays unfiltered so drafts can be curated).
    - **Alternatives:** Filter in the route after fetch (breaks pagination). Hide drafts from featured-add (would block curating a draft event).

## Risks / Trade-offs

- **[Risk] `FeaturedEventRow.published` is mistaken for membership** → Mitigation: new field `featuredPublished`; chips and links read only that; design/tasks call it out; add a package assertion.
- **[Risk] Create redirect to publish confirm surprises admins who wanted the list** → Mitigation: cancel on confirm returns to the list; event remains draft; edit still reachable from the list.
- **[Risk] Publish featured while catalog event is draft looks like a no-op on Discover** → Mitigation: confirm body + `featuredCatalogDraftNote` when `event.published === false`.
- **[Risk] `published=` dropped on sort/page** → Mitigation: thread the param through every query builder listed in decision 3; extend `admin-route.test.ts`.
- **[Risk] Island drag captures the publish link** → Mitigation: reuse `stopDragGesture` on the link/chip wrapper.
- **[Trade-off] Sitemap updated before Gherkin** → Accepted; step 03 owns scenarios.
- **[Trade-off] No Playwright this step** → Manual ADMIN/USER/guest check in verification.

## Migration Plan

1. DTO + `listEvents`/`countEvents` `published?` (safe; admin UI not reading the new field yet).
2. Copy, path helpers, icons, `AdminTableActions`.
3. Events filter + table chip + actions; list flash.
4. Six confirm routes + shared page; wire edit + create/featured-add redirects.
5. Featured list chips + island links.
6. Sitemap rows; `bun run lint` / `typecheck`; mark step done in the parent guide.
7. Rollback: revert the web PR; unused `featuredPublished` / `published?` filter is harmless. Successful POSTs are ordinary boolean flips (re-publish to undo).

## Open Questions

- None blocking. Preview CTA on the confirm page waits for `event-preview-*`.
