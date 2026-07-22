## Why

Steps 01–02 shipped gallery storage and ADMIN manage UI, but public `/:locale/events/:id` still shows only the primary hero. Guests and members browsing Discover-featured (or any stocked) events cannot see the photo set until the detail page renders a gallery section and a prev/next slider.

## What Changes

- Load gallery images in the public event detail route (`listEventGalleryImages`) and pass a view model (ids + variant URLs) into `EventDetailPage`.
- Render a gallery section **after** existing detail content (identity/checkout, hero, DETAILS, LOCATION map) when the gallery is non-empty.
- Thumbnail grid via HeroUI primitives; `<img>` with medium/large (or card/detail) variant URLs from `@unveiled/ui` / `@unveiled/images/urls`.
- Client island lightbox/slider: open on thumbnail activate at that index; previous/next; close; keyboard ←/→ when straightforward; basic focus management.
- Empty gallery: omit the section entirely (no empty-state block).
- DE/EN section heading + slider a11y labels via content helpers (same locale pattern as the rest of event detail).
- Story or unit smoke for empty vs populated gallery.
- Optional draft BDD scenarios OK; full feature/sitemap/docs polish stays step 04.
- **No** JSON-LD expansion to all gallery images this step (defer to step 04 / SEO docs).
- **No** admin gallery changes (unless a tiny bugfix), Discover card multi-image previews, or catalog mutations from the island.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: Public event detail SHALL show an image gallery at the end of the page when the event has one or more gallery images; activating a photo SHALL open a slider with previous/next navigation. Zero gallery images SHALL omit the section.

## Impact

- **Route:** `apps/web/app/routes/[locale]/events/[id].tsx` — fetch gallery after event load; map to public view model; pass into `EventDetailPage`.
- **UI:** Extend `EventDetailPage` (+ Ladle stories) with end-of-page gallery section; new presentational pieces under `apps/web/app/components/catalog/` as needed.
- **Island:** New `apps/web/app/islands/` slider/lightbox (e.g. `EventGallerySlider`) — justified client interactivity; read-only.
- **Domain (consume only):** `@unveiled/db` `listEventGalleryImages` (ordered by `sort_order`); no schema or catalog write changes.
- **Images:** Reuse `buildVariantUrl` / `@unveiled/ui` src helpers (`medium-640` / `large-1280` as appropriate for thumbs vs lightbox).
- **Copy:** DE/EN gallery heading + prev/next/close (and photo) aria labels — either local helpers next to existing `EventDetailPage` strings or a small content module.
- **Auth/SEO:** Public detail stays indexable without auth; gallery is public too; do not expand Event JSON-LD to gallery images this step.
- **Unchanged:** Hero `events.image_id`, checkout/map sections, admin gallery routes, Discover card grid.
- **Source brief:** `.dev-plan/current-iteration/featured-event-gallery-03-public-gallery-and-slider.md`
- **Parent:** `.dev-plan/current-iteration/featured-event-gallery-parent-guide.md`
- **Depends on:** `featured-event-gallery-02-admin-gallery-manage` (done)
- **Consumed by:** `featured-event-gallery-04-docs-and-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`, story/unit empty-vs-populated; manual: featured event with gallery → thumbs at end → click → next/prev
