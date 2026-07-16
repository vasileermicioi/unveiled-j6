## Why

Event cards already desaturate the cover and hide the availability strip until hover, but the card surface itself barely changes — so Discover and `/events` feel less interactive than the intended “live” hover. This step adds a stronger flat emphasis (border / contrast) that stays inside theme tokens and [`DESIGN.md`](../../../DESIGN.md) Elevation & Depth (none — no drop shadows).

## What Changes

- Refine `@media (hover: hover)` rules for `.event-card` in `apps/web/app/styles/globals.css`: keep image grayscale → color; keep / refine `.event-card__availability` reveal (capacity + ticket type on sm+).
- Add flat hover emphasis via border width/color and/or foreground contrast on `.event-card` / `.card.event-card` using existing CSS variables (e.g. thicker border or accent edge) — never `box-shadow` or hard-offset shadows.
- Ensure the category chip stays readable when the availability strip appears.
- Add `prefers-reduced-motion` guards so filter/opacity transitions are disabled or near-instant when reduced.
- Optional minimal BEM class hooks in `packages/ui/src/EventCard.tsx` only if pure CSS cannot target the card root cleanly.
- Mark step 01 done in the Event Card Hover parent guide after verification.

**Out of scope:** Ladle stories / product-map hardening (step 02), feed layout changes, new card fields, CTA/bookmark behavior, inspiration-mock neon banners or offset shadows.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Add **EventCard hover affordance** — on hover-capable pointers, EventCard SHALL colorize the cover, reveal the availability strip, and emphasize the card with a stronger flat border or theme accent edge; SHALL NOT use drop shadows; SHALL respect `prefers-reduced-motion` for hover transitions.

## Impact

- **Theme CSS:** `apps/web/app/styles/globals.css` — `.event-card*` block (~532+), especially hover / motion media queries.
- **UI package (optional):** `packages/ui/src/EventCard.tsx` — only if a root/class hook is required for BEM.
- **Surfaces:** Discover (`/:locale`) and member feed (`/events`) EventCard grids — visual only.
- **Planning:** `.dev-plan/current-iteration/event-card-hover-parent-guide.md` — mark step 01 done.
- **Depends on:** none (step 1).
- **Consumed by:** `event-card-hover-02-hardening`.
- **Verification:** `bun run lint`, `bun run typecheck`; manual hover on Discover (strip visible, image colorized, border emphasized, no shadow).
