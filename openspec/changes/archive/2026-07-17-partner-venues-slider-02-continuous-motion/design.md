## Context

Partner Venues Slider step 02 adds continuous marquee motion on top of step 01’s structure.

Current state (step 01 merged):

- `DiscoverPage.tsx`: eyebrow (`content.partners.eyebrow`) → `.discover-partners__viewport` → `.discover-partners__track` with partners mapped twice (`${id}-a` / `${id}-b`). Logo-forward cells (`PartnerLogoCell`); decorative `alt=""`; name via `aria-label` on the item.
- `globals.css`: `.discover-partners__viewport` already `overflow: hidden`; `.discover-partners__track` is `display: flex`, `width: max-content`, `animation: none` (explicit baseline for this step).
- Flat bordered logo cells on theme tokens; yellow page field — no offset shadows.
- A11y floor: `docs/UX_RULES.md` / `docs/product/ui/design-tokens.md` — respect `prefers-reduced-motion`.

Constraints: motion styles in `globals.css` theme layer (not Tailwind animate utilities); no JS timers/rAF unless unavoidable; HeroUI-only markup; packages never own this CSS; step 03 owns stories/docs/e2e close-out.

## Goals / Non-Goals

**Goals:**

- Infinite horizontal CSS animation on `.discover-partners__track` that loops seamlessly (translate by 50% with duplicated sequence).
- Calm cycle duration (~20–40s), tuned for typical demo partner counts (limit 8).
- `prefers-reduced-motion: reduce` → no auto-scroll; static wrapping/clipped logo row (hide duplicate sequence if needed).
- Optional pause on viewport `:hover` / `:focus-within` that resumes without a jump.
- No horizontal page-scroll bleed from the marquee.

**Non-Goals:**

- Stories, product-copy sync, e2e (step 03).
- Changing partner query/limit beyond step 01.
- JS-driven marquee (rAF / requestAnimationFrame) as the default path.
- Inspiration off-white band or hard-offset shadows.
- Partner click-through / admin CRUD / portal.

## Decisions

1. **CSS `@keyframes` + `translateX(-50%)` (preferred)**  
   Animate `.discover-partners__track` from `translateX(0)` to `translateX(-50%)` with `animation-timing-function: linear` and `animation-iteration-count: infinite`. Because the track contains two identical sequences at equal width, −50% lands on the start of the duplicate and the loop is seamless.  
   Alternatives rejected: JS rAF (unnecessary complexity / battery); animating `scrollLeft` (harder reduced-motion + pause); two independently animated sibling tracks (harder sync).

2. **Duration ~20–40s, linear**  
   Start around **30s** for a full cycle with up to 8 partners; tighten toward 20s if the strip feels sluggish, or lengthen toward 40s if it feels rushed. Keep `linear` so speed is constant (ease curves create a visible hitch at the loop point).

3. **Reduced-motion: kill animation + static wrap**  
   Under `@media (prefers-reduced-motion: reduce)`:
   - Set `animation: none` on the track.
   - Switch the track (or viewport contents) to a wrapping flex row (`flex-wrap: wrap`, normal width) so logos remain visible without scrolling.
   - Hide the duplicate sequence with CSS when possible (e.g. target second half via a modifier class on duplicate items, or a `.discover-partners__track--duplicate` sibling if markup is adjusted). Prefer a **minimal** markup tweak (e.g. `aria-hidden` duplicate group or a class on the second map) over an island.  
   Do not leave a half-visible sliding strip frozen mid-translate.

4. **Optional pause via CSS only**  
   On `.discover-partners__viewport:hover` and `:focus-within`, set `animation-play-state: paused` on the track. Resume restores the same animation timeline — no jump. Skip pause if it conflicts with touch/reduced-motion; reduced-motion already has no animation.

5. **Overflow / bleed guards**  
   Keep `overflow: hidden` on `__viewport`. Ensure the track’s transformed overflow does not expand document width (viewport clips; avoid `overflow-x` on `body`). Spot-check narrow mobile widths.

6. **Empty / single partner**  
   If `partners.length === 0`, keep step 01 empty behavior (eyebrow + empty viewport). If one partner, duplication still enables a loop though it may look repetitive — acceptable; do not add JS multipliers in this step unless the visual QA with seed data is clearly broken (document if a CSS `min-width` or extra duplication pass is needed).

7. **No island unless CSS fails**  
   Prefer CSS-only. Only introduce `apps/web/app/islands/` if pause or duplicate-hiding cannot be expressed safely — that path is unlikely given play-state + media queries.

## Risks / Trade-offs

- **[Risk] Visible jump at loop point** → Mitigation: exact 50% translate; equal duplicated sequences; linear timing; no `gap` asymmetry between sequences (gap is between items only, already in track).
- **[Risk] Sparse strip with few partners** → Mitigation: accept duplicate repetition; optional later multiplier deferred unless QA forces a same-step fix.
- **[Risk] Reduced-motion still shows duplicate logos twice in a wrap** → Mitigation: hide second sequence under reduced-motion via class/markup hook.
- **[Risk] Hover pause on touch devices** → Mitigation: pause is optional enhancement; sticky `:hover` on some touch UAs is low impact (pause then resume on tap elsewhere).
- **[Trade-off] OpenSpec vs product docs** → Behavior delta lives here; step 03 syncs stories/docs; product SoT remains `docs/product/`.

## Migration Plan

1. Confirm step 01 track duplication is present in `DiscoverPage.tsx`.
2. Add `@keyframes` + animation rules on `.discover-partners__track` in `globals.css`.
3. Add reduced-motion static fallback (+ optional hover/focus-within pause).
4. Minimal markup class hooks only if needed for hiding the duplicate under reduced-motion.
5. Manual QA: seamless loop; OS reduced-motion static; no page width growth; narrow mobile.
6. `bun run lint` + `bun run typecheck`.
7. Mark step 02 done in `partner-venues-slider-parent-guide.md`.
8. Rollback: revert CSS (and any tiny markup class) — structure from step 01 remains.

## Open Questions

- None blocking. Exact duration (within 20–40s) is a visual tune during implementation.
