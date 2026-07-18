## Context

`EventMap` (`apps/web/app/islands/EventMap.tsx`) builds MapLibre markers with `createMarkerElement()`, which sets `className="event-map__marker"` and `role="img"` on an empty `div`. Theme CSS paints that element as a 1×1rem square (`background: brand-dark`, yellow border). QA captured the square on the public LOCATION map (`.dev-plan/manual-test-feedback-4.png`). The same island powers `/:locale/events/map`, so both surfaces need one fix.

Parent: `.dev-plan/current-iteration/event-detail-ux-parent-guide.md`. Source brief: `event-detail-ux-03-map-pin-marker.md`. Constraints: MapLibre requires DOM via `document.createElement` (allowed HeroUI exception for canvas overlay); theme colors via CSS variables already used by `.event-map__marker`; flat neo-brutalist (no purple/glow/soft shadows); no new packages; cookie-consent gating and OSM attribution unchanged. Step 02 may have tightened LOCATION chrome; marker work is independent of that layout.

## Goals / Non-Goals

**Goals:**

- Markers render as a recognizable location-pin silhouette (teardrop / MapPin) at default zoom.
- Pin tip anchors the event lat/lng (not the center of a square).
- Brand-dark fill + brand-yellow accent via theme tokens; high contrast on OSM tiles.
- Accessible name on the marker element (event title when available).
- Detail LOCATION map and member map share the same marker treatment (single code path).
- Ladle can show pin chrome without a full tile load when feasible.

**Non-Goals:**

- Changing tile provider, clustering, or popup booking POST.
- Ticket quantity / credits ∩ capacity (step 04).
- Product BDD/e2e beyond keeping stories compiling (step 05).
- Forking marker code per surface or adding Lucide as a React tree inside MapLibre DOM.
- Admin `EventGeoPicker` marker (out of scope unless it already shares `.event-map__marker` — it does not).

## Decisions

1. **Pin construction: SVG inside the marker element + theme CSS**
   - **Choice:** In `createMarkerElement(marker?)`, create a `div.event-map__marker` and append a small inline SVG pin (teardrop path + optional circular head accent). Style fill/stroke with CSS variables on `.event-map__marker` / `svg` (e.g. `fill: var(--color-brand-dark)`, `stroke: var(--color-brand-yellow)`). Remove square `width`/`height`/`background` as the primary look; size the SVG (~24–32px tall) so it reads at zoom 11–13.
   - **Rationale:** SVG gives a crisp tip and silhouette without new deps; CSS variables keep brand consistency with DESIGN.md; EventCard’s Lucide `MapPin` is visual inspiration only — MapLibre DOM cannot host React Lucide cleanly without extra wiring.
   - **Alternatives:** Pure CSS clip-path / bordered diamond (harder tip precision, brittle); Lucide icon as SVG string copied from the icon path (acceptable if path matches MapPin — still not a React import); default MapLibre marker (rejected; not brand).

2. **Anchor / offset: tip at lat/lng**
   - **Choice:** Pass MapLibre `Marker` options so the geographic point sits at the pin tip — prefer `anchor: "bottom"` on the marker (element’s bottom center = tip). If the SVG viewBox tip is not exactly at the element bottom, add a small pixel `offset: [0, y]` so the tip coincides with lng/lat. Verify on detail (single marker, zoom 13) and member map (multi-marker fitBounds).
   - **Rationale:** Current square is center-anchored by default, which misplaces the venue when switching to a tall pin.
   - **Alternatives:** Keep default center anchor and visually center the pin (rejected; tip must mark the point per spec).

3. **Accessible name**
   - **Choice:** Keep `role="img"`. Set `aria-label` to the event title when `createMarkerElement` receives the marker (or title string). For multi-marker member map, each marker gets its own title. Fallback label if title missing: locale-agnostic short “Event location” only if title can be empty in practice — prefer always passing `marker.title` from existing `EventMapMarker`.
   - **Rationale:** Step plan requires aria-label or named `role="img"`; title is already on the type and used in popups.
   - **Alternatives:** `aria-hidden` on decorative markers (rejected; pin conveys location identity).

4. **API shape for `createMarkerElement`**
   - **Choice:** Change signature to `createMarkerElement(marker: EventMapMarker): HTMLDivElement` (or `(title: string)`) and call sites pass the current marker. Do not fork a second factory for detail vs member.
   - **Rationale:** Accessibility needs per-marker title; both call sites already iterate markers.
   - **Alternatives:** Global unlabeled pin (fails a11y); data attribute set after create (more fragile).

5. **Theme CSS**
   - **Choice:** Replace square rules on `.event-map__marker` with pin-sized box (`width`/`height` matching SVG, transparent background, no 1rem square fill). Style SVG children under `.event-map__marker svg` (fill/stroke from brand tokens). Optional `.event-map__marker-pin` class on the SVG root. Cursor pointer retained for popup open. No box-shadow / glow.
   - **Rationale:** AGENTS theme-only visual styling; existing BEM under `event-map__*`.
   - **Alternatives:** Inline SVG presentation attributes only (rejected; harder to theme; duplicates tokens).

6. **Ladle story**
   - **Choice:** Add or extend a story that renders static pin chrome (e.g. a `Surface` containing a div with the same classes/SVG markup, or export a tiny `renderEventMapMarkerElement`-like helper used by both island and story). Prefer not requiring cookie consent + network tiles to see the pin shape. Keep existing consent-gated island story.
   - **Rationale:** Step plan: “visible without a full map load if feasible.”
   - **Alternatives:** Only visual check on live map (acceptable minimum if extracting markup is awkward — prefer a static chrome story).

## Risks / Trade-offs

- **[Risk] Tip still slightly off after `anchor: "bottom"`** → Mitigation: tune SVG viewBox so tip is at bottom center; adjust `offset` with a one-time visual check at zoom 13.
- **[Risk] Pin too small/large on multi-marker map** → Mitigation: ~24–32px tall; avoid huge markers that obscure Berlin tiles; same size on detail and member map.
- **[Risk] Parent guide already checks 03 done** → Mitigation: implement residual debt; flip parent guide checkbox to accurate state on merge (done only when pin ships).
- **[Risk] Cookie consent blocks visual QA in some sessions** → Mitigation: accept consent for map check; static Ladle chrome story covers shape without tiles.
- **[Trade-off] Spec delta vs `docs/product/` until step 05** → Acceptable per step plan; defer product-doc map marker note to 05.
- **[Trade-off] Inline SVG path vs Lucide parity** → Prefer a simple teardrop path that reads as a pin; exact Lucide path copy is optional, not required.

## Migration Plan

1. Confirm `EventMap` island + `.event-map__marker` still square.
2. Implement pin SVG + CSS + Marker anchor/offset + aria-label.
3. Optional static Ladle pin chrome story.
4. `bun run lint` && `bun run typecheck`.
5. Visual check with consent: detail LOCATION + member map — pin not square; tip on venue.
6. Update parent guide step 03 honestly. Rollback = revert PR. No DB/env migration.

## Open Questions

- None blocking. If extracting shared marker markup for Ladle proves noisy, ship island+CSS first and document a manual visual check; static story remains preferred.
