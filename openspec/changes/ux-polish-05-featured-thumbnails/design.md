## Context

Parent feature: UX polish (`.dev-plan/current-iteration/ux-polish-parent-guide.md`), step 05 — final slice: Featured event list thumbnails.

Current state:

- **Data:** `listFeaturedEvents` / `searchEventsNotFeatured` already return full `Event` rows (`FeaturedEventRow = Event & { sortOrder }`); `events.imageId` is required UUID. No URL map is built for featured routes.
- **UI:** `AdminFeaturedTable` / `AdminFeaturedAddResults` render Title, Partner, Date, Actions only — no image column. Pages/routes pass `events` only.
- **Existing pattern:** Admin events list builds `imageUrls` via `buildVariantUrl(imageId, "small-320.webp")` with try/catch; `AdminEventsTable` leading logo column uses `Surface.admin-table__logo` + `<img>` or `admin-table__logo--placeholder`. Featured partners add-results already pass `logoUrls` the same way. Theme sizes thumbs at 3rem × 3rem (`object-fit: cover`).

Constraints: HeroUI chrome + `<img>` exception (AGENTS §8); theme-only visual styles (reuse `.admin-table__logo`); proximity-only e2e; no new image variants; independently mergeable; closes parent feature when done.

## Goals / Non-Goals

**Goals:**

- Build and pass `imageUrls: Record<string, string | undefined>` for featured list and add-results (prefer `small-320.webp`).
- Render compact thumbnail cells matching `AdminEventsTable` / featured-partners add pattern.
- Placeholder when URL missing; broken images MUST NOT prevent add/remove/gallery actions.
- Align Gherkin, ui-component-map, coverage matrix, Playwright proximity asserts.
- Mark step 05 done in parent guide (feature complete).

**Non-Goals:**

- Discover `EventCard` redesign or card image sizes (`medium-640.webp`).
- Featured partners grid changes; drag-reorder of featured events.
- New image variants or schema/migrations.
- Partner portal; Phase 6+ booking.

## Decisions

1. **Reuse events-list URL builder pattern (try/catch per row)**
   - **Choice:** In featured list + add routes (or a tiny shared helper next to events' `buildEventImageUrls` / extract `buildEventImageUrls` to `apps/web/app/lib/` if duplication is trivial), map each event id → `buildVariantUrl(event.imageId, "small-320.webp")`; on throw → `undefined`.
   - **Rationale:** Parent brief prefers `small-320.webp`; matches admin events + partners; keeps broken/missing IDs from crashing SSR.
   - **Alternatives:** Client-only URL construction (rejected — need SSR props like other admin tables); use `medium-640.webp` (rejected — admin list convention is small).

2. **Mirror `AdminEventsTable` logo column**
   - **Choice:** Leading column with `copy.tableLogo`; `Surface` + `<img alt="">` when URL present; placeholder Surface when absent. Same for add-results. Pass `imageUrls` through list/add page shells into table components.
   - **Rationale:** Visual/UX consistency; theme already styles `.admin-table__logo`; AGENTS allows `<img>` inside HeroUI wrappers.
   - **Alternatives:** Text-only “—” without Surface (weaker; events table already uses placeholder Surface); custom featured-only thumb size (rejected — theme tokens).

3. **Broken-image resilience is soft, not blocking**
   - **Choice:** Missing URL → placeholder cell. If the browser fails to load a valid URL, actions remain clickable (no overlay/spinner that traps clicks). Optional: `onError` on `<img>` to swap to placeholder in client tables (nice-to-have if already used elsewhere; not required if events table does not).
   - **Rationale:** Spec: “Missing/broken thumbs MUST NOT block add/remove actions.”
   - **Alternatives:** Hard-fail row render (rejected).

4. **Optional extract of shared `buildEventImageUrls`**
   - **Choice:** Prefer extracting the events-index helper to something like `apps/web/app/lib/admin-event-image-urls.ts` and reuse from events + featured routes **if** the implementer touches events index anyway; otherwise duplicate the 10-line loop in featured routes only (acceptable for this small slice).
   - **Rationale:** Avoid drive-by refactors; DRY is optional.
   - **Alternatives:** Force extract in this PR (unnecessary scope if copy-paste is clearer).

5. **Docs + e2e in the same change**
   - **Choice:** Extend “List featured events” (and add-results / remove scenarios as needed) so rows include a primary-image thumbnail; Playwright asserts `img` (or placeholder) near the event title via proximity selectors; update coverage matrix; note components in ui-component-map. Existing R2/env skips stay unchanged.
   - **Rationale:** Parent release criteria; product SoT is `docs/product/`.

## Risks / Trade-offs

- **[Risk] `IMAGE_PUBLIC_BASE_URL` unset locally** → Mitigation: try/catch + placeholder; e2e keeps existing R2/env skip patterns.
- **[Risk] Broken remote image still shows broken-icon briefly** → Mitigation: actions never disabled by image state; optional `onError` → placeholder if cheap.
- **[Trade-off] Duplicate URL builder vs extract** → Prefer minimal diff; extract only if it stays a tiny shared helper without broader admin refactors.
- **[Trade-off] No assert on exact `src` host** → Proximity: thumbnail associated with the row (img near title / in logo cell), not brittle CDN URL matching.

## Migration Plan

1. Wire `imageUrls` in featured list + add routes; extend page/table props; render logo columns.
2. Update `admin-events.feature`, ui-component-map, coverage matrix, Playwright proximity asserts.
3. Run lint, typecheck, touched featured Playwright.
4. Mark `ux-polish-05-featured-thumbnails` done in parent guide (all five children complete).
5. Rollback: revert PR (UI-only; no DB migration).

## Open Questions

- None blocking. Whether to extract `buildEventImageUrls` is an apply-time preference (duplicate OK).
