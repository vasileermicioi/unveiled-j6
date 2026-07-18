## Why

Manual QA shows the public event detail page’s identity column and dark checkout card starting at different vertical positions, with the hero image stuck in a narrow 4/3 box that wastes yellow page field on large viewports. This step is the layout foundation of **Event Detail UX**: align identity and checkout as one composition and grow the hero across sm/md/lg before density, map, and ticket-limit work.

## What Changes

- Reposition the close control so it no longer pushes identity content above the checkout card (overlay/absolute close or a shared header row both columns respect).
- Tighten `event-detail--checkout__layout` so on `lg+` identity and checkout share a common top edge (`items-start`, consistent gap; optional sticky checkout if it keeps parity without fighting the hero).
- Grow `.event-detail--checkout__hero-image` via theme rules: full identity-column width, wider aspect on `md`/`lg` (closer to EventCard / `16/9`), `object-fit: cover`; keep responsive `sizes`/`srcSet` matched to real breakpoints.
- Keep Tailwind layout-only on HeroUI nodes; borders/colors stay in `globals.css`. No booking/ledger POSTs on detail; qty remains navigation state.
- Optional Ladle story frame tweak if layout variants need it. Product-doc / e2e updates stay in step 05.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Public checkout-focused detail layout gains an explicit large-viewport alignment requirement (identity + summary card share a common top) and responsive hero sizing (full identity-column width; not a permanently undersized inset).

## Impact

- **UI:** `apps/web/app/components/catalog/EventDetailPage.tsx` (chrome + grid); optional `EventDetailPage.stories.tsx`.
- **Theme:** `apps/web/app/styles/globals.css` — `.event-detail--checkout__*` layout/hero rules (hero currently `aspect-ratio: 4 / 3`).
- **Island:** `EventDetailCheckoutCard` stays as-is unless a sticky wrapper requires a thin class hook.
- **Unchanged:** booking domain, `/events/:id/book`, CTA matrix semantics, yellow page backdrop, SEO/JSON-LD, DETAILS/LOCATION density (02), map pin (03), dynamic ticket max (04).
- **Depends on:** none (first Event Detail UX step).
- **Consumed by:** `event-detail-ux-02-details-metadata-density`.
- **Source brief:** `.dev-plan/current-iteration/event-detail-ux-01-hero-checkout-layout.md`; feedback `.dev-plan/manual-test-feedback-1.png`.
- **Verification:** `bun run lint`, `bun run typecheck`; visual check ~1280px (tops align, hero fills column) and ~375px (stack identity → checkout, close not clipped).
