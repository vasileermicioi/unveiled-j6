## 1. Setup

- [x] 1.1 Confirm step 01 track duplication is present in `DiscoverPage.tsx` (viewport + track with `-a`/`-b` sequences)
- [x] 1.2 Read reduced-motion guidance in `docs/UX_RULES.md` / `docs/product/ui/design-tokens.md` and this change’s design decisions

## 2. Continuous motion

- [x] 2.1 Add `@keyframes` + infinite linear animation on `.discover-partners__track` translating by exactly 50% (seamless loop over duplicated sequence); tune duration ~20–40s for typical demo partner counts
- [x] 2.2 Confirm viewport `overflow: hidden` and prevent page-level horizontal scroll bleed from the marquee
- [x] 2.3 Implement `prefers-reduced-motion: reduce` static fallback (`animation: none`; wrapping static row; hide duplicate sequence if needed via minimal class/markup hook)
- [x] 2.4 Optional: pause animation on `.discover-partners__viewport:hover` / `:focus-within` via `animation-play-state: paused` (CSS-only; no JS timers/rAF)

## 3. Validation

- [x] 3.1 Manual Discover check: loop without a visible jump; OS reduced-motion shows static strip; page width does not grow; spot-check narrow mobile width
- [x] 3.2 Run `bun run lint` and `bun run typecheck` (both exit 0)

## 4. Cleanup

- [x] 4.1 Mark step 02 done in `.dev-plan/current-iteration/partner-venues-slider-parent-guide.md`
