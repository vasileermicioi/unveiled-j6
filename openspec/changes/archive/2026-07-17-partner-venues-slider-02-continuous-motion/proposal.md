## Why

Step 01 shipped Discover’s Partner venues eyebrow + duplicated horizontal logo track, but the strip is still static. This step adds the continuous, seamless marquee motion (with a reduced-motion static fallback) so the section matches the Partner Venues Slider feature intent without rewriting structure.

## What Changes

- Add CSS `@keyframes` infinite horizontal translation on `.discover-partners__track` (preferred; no JS timers/rAF).
- Seamless loop: animate by exactly 50% of track width while the track holds two identical partner sequences.
- Tune cycle duration to feel calm (~20–40s for a full cycle; adjust with typical demo partner counts).
- `prefers-reduced-motion: reduce`: `animation: none`; show a wrapping static row/flex of logos (may hide the duplicate track).
- Optional: pause animation on `:hover` / `:focus-within` of the viewport without breaking the loop on resume.
- Keep overflow hidden on the viewport; prevent horizontal page-scroll bleed.
- Prefer CSS-only; introduce an island only if pause/duplicate cannot be expressed safely in CSS.
- Decorative images remain `alt=""`; section labeling stays via eyebrow / region `aria-label` (full a11y polish is step 03).

**Out of scope:** stories/docs/e2e close-out (step 03); changing which partners are queried beyond step 01; inspiration offset shadows; partner click-through pages.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `static-marketing-pages`: When the user does not prefer reduced motion, the Discover partner logo strip SHALL scroll horizontally in a continuous, seamless loop. When `prefers-reduced-motion: reduce` is set, the strip SHALL remain static with no auto-scrolling animation.

## Impact

- **Theme CSS (primary):** `apps/web/app/styles/globals.css` — keyframes + animation on `.discover-partners__track`; reduced-motion fallback; optional hover/focus-within pause; overflow/bleed guards.
- **UI (minimal if needed):** `apps/web/app/components/marketing/DiscoverPage.tsx` — only markup tweaks required for reduced-motion static wrap or pause affordance; keep HeroUI composition from step 01.
- **A11y guidance:** `docs/UX_RULES.md`, `docs/product/ui/design-tokens.md` — respect `prefers-reduced-motion`.
- **Planning:** `.dev-plan/current-iteration/partner-venues-slider-parent-guide.md` — mark step 02 done after verification.
- **Depends on:** `partner-venues-slider-01-section-structure` (merged; viewport + duplicated track present).
- **Consumed by:** `partner-venues-slider-03-hardening`.
- **Verification:** `bun run lint`, `bun run typecheck`; manual — loop without jump; reduced-motion static; page width does not grow.
