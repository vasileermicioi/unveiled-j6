## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-05-map-close-and-hardening.md`, parent release criteria, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm steps 01–04 behaviors are present on the branch (guest detail gating, auth width, native prefs + i18n, membership benefits, PageSectionHeader on book/confirm/waitlist)
- [x] 1.3 Locate MapLibre popup close DOM/CSS: `EventMap.tsx` (`closeButton: true`, `focusAfterOpen: false`) and `.event-map__canvas-wrap .maplibregl-popup-close-button` in `globals.css`; note default tiny close vs `.dev-plan/manual-test-map.png`

## 2. Map popup close control

- [x] 2.1 Enlarge `.event-map__canvas-wrap .maplibregl-popup-close-button` hit target (~44×44px min via width/height/padding/font-size) in `apps/web/app/styles/globals.css`
- [x] 2.2 Adjust popup content padding if the larger close overlaps title; keep flat theme (no hard drop shadows)
- [x] 2.3 Verify focus-visible ring / hover and that `focusAfterOpen: false` plus popup link styles are unchanged; do not rewrite Popup construction unless CSS alone is insufficient

## 3. Product docs & e2e hardening

- [x] 3.1 Update `docs/product/features/event-discovery.feature` and/or `docs/product/ui/ui-component-map.md` for the large map popup close control
- [x] 3.2 Grep `docs/product/` for stale 01–04 claims (guest credits/date, auth width, HeroUI-only checkboxes, three-up membership cards, bare book H1); fix remaining gaps only
- [x] 3.3 Fix or extend Playwright under `e2e/specs/` for discovery/onboarding/auth/membership/booking broken by steps 01–04 (proximity selectors; no pixel OCR)
- [x] 3.4 Optional: when a map popup is already openable after consent, assert `.maplibregl-popup-close-button` visible/enabled and dismisses on activate; skip if consent gate blocks CI

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` (exit 0)
- [x] 4.2 Run `bun run typecheck` (exit 0)
- [x] 4.3 Manual: open map popup on desktop + narrow viewport — close control is easy to tap/click; Esc/close still works
- [x] 4.4 Run targeted Playwright for discovery/map (+ any updated onboarding/auth specs) when credentials/`SITE_URL` available; document env blockers
- [x] 4.5 Mark `manual-test-ux-05-map-close-and-hardening` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`; confirm 01–04 remain done; note residual risks under parent Risks if any
