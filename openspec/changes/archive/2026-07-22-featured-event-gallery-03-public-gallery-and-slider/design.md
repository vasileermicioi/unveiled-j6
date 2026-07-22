## Context

Parent feature: Featured Event Gallery (`.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`). Steps 01–02 are done:

- Schema `event_gallery_images` + domain `listEventGalleryImages` / add / remove (max 12)
- ADMIN SSR gallery manage under `/:locale/admin/events/:id/gallery*`

Public detail today: `apps/web/app/routes/[locale]/events/[id].tsx` loads `getPublicEventById`, builds viewer/qty/SEO, renders `EventDetailPage` + Event JSON-LD. `EventDetailPage` order: identity + checkout → hero → DETAILS card → LOCATION/map. No gallery fetch or UI yet.

Constraints: HeroUI-only markup (`<img>` exception inside wrappers); theme tokens for visuals; Tailwind layout only; yellow page backdrop unchanged; public detail stays indexable without auth; islands only for justified client interactivity; no catalog mutations from the island; JSON-LD gallery expansion deferred to step 04.

## Goals / Non-Goals

**Goals:**

- Fetch gallery on the public detail route and pass ordered view-model items into `EventDetailPage`.
- Gallery section last on the page when non-empty; omit when empty.
- Thumbnail grid + client slider island (open at index, prev/next, close, keyboard ←/→ if straightforward, basic focus management).
- DE/EN heading + a11y labels; Ladle/story or unit smoke for empty vs populated.
- Mark step done in parent guide; note SEO follow-ups for step 04.

**Non-Goals:**

- Admin gallery UI changes (except tiny bugfix).
- Discover card multi-image previews.
- Expanding Event JSON-LD / OG to all gallery images.
- Full BDD/feature/sitemap/component-map polish (step 04; draft scenarios OK).
- Drag-and-drop reorder; partner portal; mutating gallery from the public surface.
- Gating display to Discover-featured only (default: any event with a non-empty gallery).

## Decisions

1. **When to show the gallery**
   - **Choice:** Show whenever `listEventGalleryImages` returns ≥ 1 row for that event — not gated on `featured_events` membership.
   - **Rationale:** Parent guide default; simplest; Discover-featured events are the product target but storage is per-event. Featured-only gating can be added later without schema changes.
   - **Alternatives:** Gate on featured membership (extra join; rejected for MVP of this feature).

2. **Data loading & view model**
   - **Choice:** In `[locale]/events/[id].tsx`, after a successful event load, call `listEventGalleryImages(db, eventId)`. Map each row to a public item:
     - `imageId`, `sortOrder`
     - `thumbSrc` / `thumbSrcSet` via `buildCardImageSrc` / `buildCardImageSrcSet` (or equivalent `medium-640` / `small-320` ladder)
     - `fullSrc` / `fullSrcSet` via `large-1280` (+ medium) — reuse helpers from `@unveiled/ui` / `@unveiled/images/urls`; add a thin `buildGalleryLightboxSrc(Set)` in `@unveiled/ui` only if existing helpers are awkward
   - Pass `galleryImages: PublicEventGalleryImage[]` (empty array OK) into `EventDetailPage`.
   - Swallow/skip broken URL builds per image (same try/catch pattern as hero) rather than failing the whole page.
   - **Rationale:** Route stays the data owner; component stays presentational; domain list already orders by `sort_order`.
   - **Alternatives:** Fetch inside a child component (harder SSR); N+1 image table joins (not needed — variant URLs are deterministic from `imageId`).

3. **Page composition / placement**
   - **Choice:** Append gallery as the last block inside `EventDetailPage`’s outer `Surface`, after the DETAILS + LOCATION `event-detail--checkout__below` section (gallery last relative to current content).
   - Prefer a small presentational `EventDetailGallery` (or inline section) that receives items + copy + the slider island; if `items.length === 0`, return `null`.
   - **Rationale:** Matches step brief; keeps checkout/map untouched; empty = omit.
   - **Alternatives:** Separate route fragment (unnecessary); place gallery above map (conflicts with “gallery last”).

4. **Thumbnail grid UX**
   - **Choice:** Responsive CSS grid (`grid` + gap layout classes only) of HeroUI-wrapped buttons/links that activate the slider at that index. Each cell: `<img>` with thumb src/srcSet, `loading="lazy"`, alt from localized “Photo N” (or event title + index). Section heading via HeroUI `Heading` / `Card.Title` pattern consistent with DETAILS/LOCATION cards — prefer a `Card` or titled `Surface` using existing detail section rhythm.
   - Do **not** use ad-hoc color/border/shadow Tailwind; theme owns look.
   - **Rationale:** SSR-friendly thumbs; activation is the only interactive need that forces the island.
   - **Alternatives:** Pure island for grid + slider (worse SSR/SEO for thumbs); masonry (overbuilt).

5. **Slider / lightbox island**
   - **Choice:** New island e.g. `apps/web/app/islands/EventGallerySlider.tsx` (default export, HonoX island convention).
     - Props: `images` (full URLs + alts), `locale` or precomputed labels (`previous`, `next`, `close`, `galleryLabel`), optional `initialIndex` controlled by parent open state **or** island owns open state and exposes activation via rendering both grid controls and overlay (prefer: parent SSR grid triggers island with `openIndex` / controlled open — simplest workable split: island wraps both closed trigger hooks and overlay, OR SSR grid buttons are part of the island so click state stays client-local).
     - **Preferred split:** Island owns interactive state. SSR still renders the section chrome + heading; the island receives the full image list and renders the thumbnail buttons **and** the overlay (avoids SSR/client split for open index). If that makes the section too client-heavy, acceptable alternative: island is overlay-only and mounts with `data-` / props updated — but HonoX islands are typically self-contained; **choose overlay+triggers inside the island** for reliable open-at-index.
     - Overlay: HeroUI `Modal` (or Dialog) if it fits focus trap + close; otherwise HeroUI `Surface` + `Button` chrome with Escape/close. Prev/next cycle or clamp at ends — **prefer wrap-around** for small galleries (≤12) unless Modal patterns make clamp easier; document choice in code comment.
     - Keyboard: ArrowLeft / ArrowRight when open; Escape closes (Modal usually provides Escape).
     - Focus: move focus to close or dialog on open; restore to triggering thumb on close when straightforward.
     - No network calls; no form POSTs.
   - **Rationale:** Prev/next + keyboard justify an island; max 12 images keeps payload tiny.
   - **Alternatives:** Full-page route per photo (heavy); CSS-only `:target` lightbox (weaker a11y/keyboard).

6. **i18n**
   - **Choice:** Add DE/EN strings alongside existing `EventDetailPage` locale helpers (or a tiny `event-detail-gallery-copy.ts` next to other catalog copy): section title (“Gallery” / “Galerie”), previous/next/close aria-labels, photo alt pattern (“Photo {n}” / “Foto {n}”).
   - **Rationale:** Event detail already inlines many DE/EN helpers; avoid bloating admin-content. Step 04 may move strings into the i18n inventory.
   - **Alternatives:** Full content-module extraction now (nice but optional).

7. **SEO / JSON-LD**
   - **Choice:** Do not add gallery image URLs to `buildEventJsonLd` this step. Note follow-up for step 04 against SEO docs.
   - **Rationale:** Explicit non-goal in the step brief.

8. **Tests / stories**
   - **Choice:** Extend `EventDetailPage.stories.tsx` with “with gallery” and “without gallery” (or a focused gallery story). Optionally a tiny unit test for view-model mapping if extracted to `apps/web/app/lib/`.
   - **Rationale:** Step verification asks for story or unit smoke; Ladle already covers EventDetailPage.

## Risks / Trade-offs

- **[Risk] Island hydration flash / layout shift when thumbs are island-only** → Mitigation: keep section heading SSR; size thumb grid with stable aspect/layout classes; island may render thumbs (acceptable) as long as empty state stays omitted server-side when `images.length === 0` (pass empty → render null before island).
- **[Risk] Broken/missing variant URLs for some image ids** → Mitigation: per-image try/catch; skip bad URLs or omit that thumb; never 500 the detail page.
- **[Risk] HeroUI Modal styling fights yellow page / flat theme** → Mitigation: use theme tokens / existing Modal patterns (e.g. nav Drawer); avoid ad-hoc shadows; Tailwind layout only.
- **[Risk] Focus trap regressions with MapLibre or checkout islands on the same page** → Mitigation: only mount/open overlay when active; restore focus on close; don’t auto-open.
- **[Trade-off] No e2e this step** → Mitigation: lint/typecheck + story smoke + manual; step 04 owns BDD.
- **[Trade-off] Slider island includes thumbnails** → Mitigation: keeps open-index state simple; payload ≤12 images; SSR heading still present when wrapping carefully — if SEO of thumb `<img>` in island is a concern, render SSR thumb grid that calls into island via a minimal bridge; prefer self-contained island unless SSR thumb indexing is trivial.

## Migration Plan

1. Add view-model mapper + DE/EN gallery copy helpers.
2. Fetch gallery in event detail route; pass props into `EventDetailPage`.
3. Implement gallery section + `EventGallerySlider` island; wire open-at-index / prev / next / close.
4. Add Ladle stories (empty vs populated); run lint/typecheck.
5. Manual smoke on an event with gallery photos; confirm empty events unchanged.
6. Mark step 03 done in parent guide; note JSON-LD/SEO for step 04.
7. Rollback = revert route/UI/island/copy; no schema migration this step.

## Open Questions

- None blocking. Lightbox wrap-around vs clamp at ends can be decided at implement time (prefer wrap-around). Whether thumbs live inside the island vs SSR grid is an implementation preference — design prefers island-owned triggers for state simplicity unless SSR `<img>` indexing is free.
