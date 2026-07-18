## Why

Below the fold on the public event detail page, DETAILS is a single left-aligned vertical list inside a wide white card, leaving most of the card empty. Discover EventCards pack label/value rows with icons and clear hierarchy. This step densifies DETAILS + LOCATION so the detail page feels as organized as the event list, adapted for a single-event context, after hero/checkout alignment (step 01).

## What Changes

- Replace the sparse vertical DETAILS stack with a responsive multi-column metadata grid (1 col sm → 2 col md → 3 col lg) of label/value cells for date, accessibility, languages, event type, neighborhood, and age groups.
- Optionally add Lucide icons for date (`Calendar`) and neighborhood (`MapPin`) to echo EventCard scannability — icons inherit theme color, not ad-hoc Tailwind colors.
- Tighten LOCATION card chrome: less empty padding; map uses available card content width; address stays above the map.
- Add `@layer components` theme rules for any new `.event-detail--checkout__meta*` classes; Tailwind for grid/flex/gap only.
- Optional Ladle story tweak to show dense metadata. Product-doc / e2e updates stay in step 05.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Public event detail below-fold DETAILS SHALL use a dense, scannable multi-column label/value layout on medium/large viewports (not a sparse single-column list in a wide empty card). LOCATION SHALL show address + map without large unused bands beside the map content.

## Impact

- **UI:** `apps/web/app/components/catalog/EventDetailPage.tsx` — below-fold DETAILS + LOCATION cards; optional `EventDetailPage.stories.tsx`.
- **Theme:** `apps/web/app/styles/globals.css` — `.event-detail--checkout__meta*` (and LOCATION density) under `@layer components` if needed.
- **Patterns:** Density inspiration from `packages/ui` EventCard + `docs/product/ui/ui-component-map.md` (Calendar / MapPin rows) — not a 1:1 clone.
- **Unchanged:** which metadata fields exist on `Event`; map marker visuals (03); ticket qty logic (04); booking/ledger; yellow page backdrop; no hard drop shadows.
- **Depends on:** `event-detail-ux-01-hero-checkout-layout` (layout baseline available locally or merged).
- **Consumed by:** `event-detail-ux-03-map-pin-marker`.
- **Source brief:** `.dev-plan/current-iteration/event-detail-ux-02-details-metadata-density.md`; feedback `.dev-plan/manual-test-feedback-2.png`, `.dev-plan/manual-test-feedback-3.png`.
- **Verification:** `bun run lint`, `bun run typecheck`; visual check ~1280px (DETAILS ≥2 columns; LOCATION map spans card content width; no new hard drop shadows).
