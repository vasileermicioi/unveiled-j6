## 1. Setup & view model

- [x] 1.1 Confirm prerequisites: `listEventGalleryImages`, `EventDetailPage`, public `[locale]/events/[id]` route, `@unveiled/ui` / `@unveiled/images/urls` helpers; skim parent guide non-goals
- [x] 1.2 Add DE/EN gallery copy (section heading, prev/next/close aria labels, photo alt pattern) next to event-detail locale helpers
- [x] 1.3 Add mapper from `EventGalleryImageRow[]` → public gallery view model (thumb + lightbox URLs via medium/large helpers; skip broken URLs per image)

## 2. Public gallery UI & slider island

- [x] 2.1 Fetch gallery in `apps/web/app/routes/[locale]/events/[id].tsx` and pass view model into `EventDetailPage`
- [x] 2.2 Add end-of-page gallery section on `EventDetailPage` (HeroUI); render nothing when empty; place after DETAILS/LOCATION
- [x] 2.3 Implement `EventGallerySlider` island with thumbnail activation, prev/next, close, keyboard ←/→ when straightforward, basic focus management
- [x] 2.4 Wire island into the gallery section (open at clicked index); no catalog mutations from the island

## 3. Stories, handoff & verification

- [x] 3.1 Add Ladle story and/or unit smoke for empty vs populated gallery on event detail
- [x] 3.2 Mark `featured-event-gallery-03-public-gallery-and-slider` done in the parent guide; note JSON-LD/SEO follow-ups for step 04
- [x] 3.3 Run `bun run lint` and `bun run typecheck`
- [ ] 3.4 Manual smoke: open featured (or any) event with gallery → thumbnails at end → click → next/prev/close works; event with zero gallery images unchanged
