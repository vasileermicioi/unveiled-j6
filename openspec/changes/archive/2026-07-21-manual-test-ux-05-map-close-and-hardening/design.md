## Context

Manual-test UX polish steps 01–04 are done (parent: `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`). Step 05 is the release closer:

| Step | Shipped truth |
|---|---|
| 01 | Guest / non–booking-eligible detail omits credits + date chrome |
| 02 | Auth form cards match skeleton/header width after hydrate |
| 03 | Native preference/qty controls + DE/EN preference labels |
| 04 | Vertical membership icon benefits; book/confirm/waitlist use `PageSectionHeader` |

Remaining gap (ref: `.dev-plan/manual-test-map.png`): MapLibre’s default `.maplibregl-popup-close-button` is a tiny “×” in the popup corner. `EventMap` already creates popups with `closeButton: true` and `focusAfterOpen: false`; theme already clears default focus outline and adds `:focus-visible` ring under `.event-map__canvas-wrap`, but does **not** enlarge the hit target.

Constraints: theme-only visuals in `globals.css`; no hard drop shadows; HeroUI for app chrome (MapLibre injects the close button DOM — style via CSS, do not replace with a React modal); proximity e2e selectors; product SoT is `docs/product/`.

## Goals / Non-Goals

**Goals:**

- Enlarge map popup close hit target (~44×44px min or equivalent padding + font size) on member map and detail LOCATION map (same `EventMap` island / CSS scope).
- Preserve Esc/close, keyboard focus-visible, and prior popup link styles.
- Align `docs/product/` + Playwright with steps 01–05 contracts; mark parent guide done.

**Non-Goals:**

- Custom React close button / island rewrite of MapLibre Popup.
- Clustering, new popup fields, marker redesign.
- Partner portal maps.
- Pixel OCR / visual screenshot diffs of map tiles.
- Re-opening design debates from steps 01–04 unless e2e reveals a regression to fix.

## Decisions

1. **CSS override of MapLibre close button (not a custom DOM close)**
   - **Choice:** Under `.event-map__canvas-wrap`, style `.maplibregl-popup-close-button` with larger `font-size`, `width`/`height` (or min dimensions), and padding so the hit area is ≥ ~44px. Keep `closeButton: true` in `EventMap.tsx`.
   - **Rationale:** Least invasive; MapLibre already wires close + Esc; matches prior focus-ring CSS pattern.
   - **Alternatives:** `closeButton: false` + custom button in `createPopupContent` (more a11y work, duplicates MapLibre); increase only font-size without padding (still hard to tap).

2. **Scope both map surfaces via shared wrapper class**
   - **Choice:** Target `.event-map__canvas-wrap .maplibregl-popup-close-button` so member `/events/map` and detail LOCATION map both get the larger control.
   - **Rationale:** Same island + class; screenshot complaint is the MapLibre chrome, not one route.
   - **Alternatives:** Detail-only (leaves member map tiny); global `.maplibregl-popup-close-button` outside wrapper (broader than needed if MapLibre CSS leaks).

3. **No drop shadow / flat theme**
   - **Choice:** Enlarge + position only; optional transparent/subtle brand hover via existing tokens — no `box-shadow` on the close control.
   - **Rationale:** `AGENTS.md` / `DESIGN.md` flat bordered surfaces.
   - **Alternatives:** Match MapLibre default hover rgba wash (acceptable if already inherited; do not add hard shadows).

4. **Do not regress `focusAfterOpen: false`**
   - **Choice:** Leave popup construction options as-is; keep existing `:focus` / `:focus-visible` rules; verify close still receives focus-visible when keyboard-activated.
   - **Rationale:** Prior map focus work intentionally avoided stealing focus into the popup on open.
   - **Alternatives:** Re-enable `focusAfterOpen` (rejected — regresses prior fix).

5. **Product docs: map close + gap-fill for 01–04**
   - **Choice:** Add a short Gherkin / ui-component-map note for large popup close. Grep `docs/product/` for stale claims from 01–04 (guest credits, auth width, HeroUI-only checkboxes, three-up membership cards, bare book H1) and fix only remaining gaps — do not rewrite already-correct docs.
   - **Rationale:** Hardening step; 01–04 may have already updated most SoT.
   - **Alternatives:** Full rewrite of all five contracts every time (noise).

6. **Playwright: optional close assertion when popup is openable**
   - **Choice:** If an existing discovery/map scenario can open a marker popup after consent, assert `.maplibregl-popup-close-button` (or role/name) is visible and has usable dimensions / is enabled; clicking it dismisses the popup. Skip when consent gate blocks the map in CI (same owner pattern as pin marker).
   - **Rationale:** Brief says optional; avoid new flaky tile waits.
   - **Alternatives:** Dedicated new scenario always — only if opening a popup is already stable in the suite.

7. **Parent guide closure**
   - **Choice:** After lint/typecheck + manual close check, mark step 05 (and confirm 01–04) done; note residual e2e/env risks under parent Risks.
   - **Rationale:** Closes the feature per parent release criteria.

## Risks / Trade-offs

- **[Risk] Larger close overlaps popup title on narrow popups** → Mitigation: pad popup content top/right if needed (`.maplibregl-popup-content` or `.event-map__popup` padding) so title clears the control; verify on narrow viewport.
- **[Risk] MapLibre vendor CSS in `public/assets/globals.css` fights theme** → Mitigation: keep overrides in `apps/web/app/styles/globals.css` `@layer components` with equal/higher specificity under `.event-map__canvas-wrap`.
- **[Risk] Popup close e2e flakes on consent / tiles** → Mitigation: conditional skip with documented owner; do not require tile OCR.
- **[Risk] Docs churn for already-shipped 01–04** → Mitigation: grep-driven gap fill only.
- **[Trade-off] openspec/specs are not product SoT** → Still write delta; update `docs/product/` for implementers.

## Migration Plan

1. Enlarge close button CSS; manual verify desktop + narrow.
2. Gap-fill product docs + e2e selectors/assertions.
3. `bun run lint` && `bun run typecheck`; targeted Playwright when env allows.
4. Mark parent guide steps done. Rollback = revert PR. No DB/env migration.

## Open Questions

- None blocking. Default hit-target target: **min 44×44px** (WCAG-inspired); if MapLibre’s absolutely positioned “×” cannot grow without overlapping content, prefer padding the button box over shrinking content further.
