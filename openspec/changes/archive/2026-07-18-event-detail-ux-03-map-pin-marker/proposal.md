## Why

The MapLibre HTML marker is a 1×1rem black square (`.event-map__marker`), which QA flagged as a broken/placeholder pin (`manual-test-feedback-4.png`). Public event detail LOCATION and the member events map share the same `EventMap` island, so both surfaces still look unfinished at default zoom.

## What Changes

- Rebuild the marker element into a recognizable location-pin silhouette (teardrop / MapPin shape) via CSS and/or inline SVG in `createMarkerElement()`.
- Anchor the pin tip at the geographic lat/lng (MapLibre `Marker` `anchor` / offset as needed).
- Keep brand-dark fill + brand-yellow accent via existing theme CSS variables; flat neo-brutalist (no glow, no soft shadows).
- Add an accessible name (`aria-label` or keep `role="img"` with a name) using the event title when available.
- Update Ladle coverage so pin chrome is visible without requiring a full map tile load when feasible.
- Shared island only — detail + `/events/map` both pick up the change; no forked marker code.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: MapLibre event markers (member map and public event detail LOCATION map) SHALL render a recognizable location-pin icon in brand colors, not a plain black rectangle/square. The pin tip SHALL mark the event’s lat/lng. OSM attribution and cookie-consent gating remain unchanged.

## Impact

- **Island:** `apps/web/app/islands/EventMap.tsx` — `createMarkerElement()` and Marker construction (anchor/offset, aria).
- **Theme:** `apps/web/app/styles/globals.css` — `.event-map__marker` (and any `::after` / pin parts) under `@layer components`.
- **Stories:** `apps/web/app/components/discovery/EventMap.stories.tsx` — optional static pin chrome story / update.
- **Unchanged:** tile provider, clustering, popup booking POST, ticket quantity (04), product BDD/e2e beyond story compile (05).
- **Depends on:** `event-detail-ux-02-details-metadata-density` (ordering); `EventMap` island must be present (may proceed if 02 left the island untouched).
- **Consumed by:** `event-detail-ux-04-dynamic-ticket-limits` (no hard dep).
- **Source brief:** `.dev-plan/current-iteration/event-detail-ux-03-map-pin-marker.md`; feedback `.dev-plan/manual-test-feedback-4.png`.
- **Verification:** `bun run lint`, `bun run typecheck`; visual check with cookie consent accepted — pin silhouette, tip on venue point.
- **Note:** Parent guide currently marks step 03 done, but the square marker remains in code — treat this change as residual UX debt and mark the parent guide honestly after merge.
