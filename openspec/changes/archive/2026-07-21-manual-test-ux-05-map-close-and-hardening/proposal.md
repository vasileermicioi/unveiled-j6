## Why

Event map popups still expose a tiny MapLibre close “×” that is hard to tap or click (ref: `.dev-plan/manual-test-map.png`). Steps 01–04 already shipped guest detail gating, auth width, native preference controls + i18n, membership benefits, and shared page headers — this final step enlarges the close control and hardens the feature with product docs, e2e/selector alignment, and parent release criteria so Manual-test UX polish can be marked released.

## What Changes

- Enlarge the map popup close control hit target (min ~44px or equivalent visible/padded control) via theme CSS on MapLibre’s `.maplibregl-popup-close-button` under `.event-map__canvas-wrap`.
- Keep keyboard/focus behavior accessible; do not regress prior popup focus (`focusAfterOpen`, focus-visible ring, popup link styles).
- Style via theme only — no hard drop shadows; layout-only Tailwind on wrappers if needed.
- Update `docs/product/` so guest detail gating, auth width, native preference controls + i18n, membership benefits, page headers, and map close match shipped UX.
- Fix or extend Playwright under `e2e/specs/` for discovery/onboarding/membership/booking impacted by steps 01–04; add a proximity assertion for map popup close when map e2e already opens popups.
- Mark all five steps done in the parent guide; note residual risks if any.

**Out of scope:** New map features; clustering; partner portal; redesign of map markers or popup content layout beyond the close control.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: Event map popups SHALL provide a close control with a sufficiently large hit target for pointer and touch; the control SHALL remain keyboard-accessible and SHALL NOT regress popup focus behavior. Product docs / Gherkin / Playwright SHALL reflect this and the Manual-test UX contracts from steps 01–04 that touch discovery surfaces.

## Impact

- **UI / theme:** `apps/web/app/styles/globals.css` (`.event-map__*` / `.maplibregl-popup-close-button`); optionally `apps/web/app/islands/EventMap.tsx` only if close button needs a class hook (prefer CSS override of MapLibre default).
- **Product SoT:** `docs/product/features/event-discovery.feature` (map popup close); `docs/product/ui/ui-component-map.md` (map / discovery notes); other `docs/product/` files as needed to lock steps 01–04 contracts (auth width, native forms, membership benefits, headers) if gaps remain after those steps.
- **E2E:** `e2e/specs/event-discovery.spec.ts` (and onboarding/auth/membership/booking specs broken by 01–04); proximity selectors per `docs/product/testing/bdd-and-e2e.md` — no pixel OCR.
- **Planning:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md` — mark 01–05 done; release criteria checkable against `.dev-plan/manual-test-*.png` refs.
- **Depends on:** `manual-test-ux-01` … `04` (done / archived).
- **Consumed by:** closes the Manual-test UX polish feature.
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-05-map-close-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Verification:** `bun run lint`, `bun run typecheck`; manual map popup close on desktop + narrow viewport; targeted Playwright when env allows
