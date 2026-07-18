## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-detail-ux-03-map-pin-marker.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm `EventMap` island (`createMarkerElement`) and `.event-map__marker` square CSS still exist
- [x] 1.3 Review `.dev-plan/manual-test-feedback-4.png` against the current black-square marker
- [x] 1.4 Skim MapLibre Marker `anchor` / `offset` docs if tip alignment needs tuning

## 2. Pin marker implementation

- [x] 2.1 Redesign `createMarkerElement(marker)` in `EventMap.tsx` to build a pin silhouette (inline SVG under `.event-map__marker`)
- [x] 2.2 Set `role="img"` + `aria-label` from event title; pass marker at all Marker construction call sites
- [x] 2.3 Construct MapLibre `Marker` with `anchor: "bottom"` (and `offset` if needed) so the tip marks lat/lng
- [x] 2.4 Update `.event-map__marker` (and SVG child rules) in `globals.css` `@layer components` — remove square-as-marker look; brand-dark fill / brand-yellow accent via CSS variables; no glow/shadows
- [x] 2.5 Confirm detail LOCATION map and member `/events/map` both use the shared island (no forked marker code)

## 3. Stories & verification

- [x] 3.1 Update or add Ladle coverage in `EventMap.stories.tsx` so pin chrome is visible without a full map tile load when feasible
- [x] 3.2 Run `bun run lint` (exit 0)
- [x] 3.3 Run `bun run typecheck` (exit 0)
- [x] 3.4 Visual check with cookie consent accepted: detail LOCATION and/or member map show a pin silhouette (not a square); tip sits on the venue point

## 4. Handoff

- [x] 4.1 Mark step 03 accurately in `.dev-plan/current-iteration/event-detail-ux-parent-guide.md` after merge (correct premature “done” if still wrong)
- [x] 4.2 Defer product-doc map marker note to step 05 if not already covered
- [x] 4.3 Prepare PR/handoff linking this change id and the parent guide; no new packages
