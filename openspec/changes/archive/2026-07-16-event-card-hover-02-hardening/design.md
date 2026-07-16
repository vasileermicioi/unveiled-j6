## Context

Event Card Hover step 02 closes the feature after step 01 shipped theme hover in `apps/web/app/styles/globals.css` (`.card.event-card*` ~532–620):

- Resting: grayscale cover, availability strip `opacity: 0`, transparent 2px inward outline reserved.
- `@media (hover: hover)` + `:hover` / `:focus-within`: full-color image, strip visible, outline 4px `var(--border)` (no reflow, no `box-shadow`).
- `prefers-reduced-motion: reduce`: transitions `none`.

Gaps for release:

- `packages/ui/src/EventCard.stories.tsx` has CTA/locale stories only — no forced hover / availability-visible story for theme review without a live pointer.
- EventCard component CSS lives in **apps/web** `globals.css`, while `@unveiled/ui` Ladle loads only `stories.css` → `brand-theme.css`. Stories therefore do not share the production hover rules (design-system ownership says EventCard + brand theme live in `@unveiled/ui`).
- `docs/product/ui/ui-component-map.md` mentions “hover availability strip” but not flat-border emphasis, touch, or reduced-motion.
- Parent guide still lists step 02 open; release criteria require stories + map sync + no shadow regressions.

Constraints: stories stay in `@unveiled/ui`; no apps/web one-off card styles for this step; HeroUI-only markup; no hover-only e2e screenshots unless already patterned; product SoT remains `docs/product/`.

## Goals / Non-Goals

**Goals:**

- Ladle shows resting EventCard and a forced hover / availability-visible state (capacity + ticket type on media) without requiring a live browser hover.
- Production and Ladle share one EventCard theme CSS source under `@unveiled/ui`.
- `ui-component-map.md` EventCard note matches shipped flat-border hover (not offset shadow); short touch / reduced-motion note.
- Confirm DS / Theme Overview do not prescribe card shadows; quick a11y pass (focus-visible, strip contrast).
- Parent guide: step 02 done + **Event Card Hover** feature complete.

**Non-Goals:**

- Redesigning CTAs, capacity math, feed layout, or partner slider work.
- New Playwright/hover screenshot e2e.
- Reworking step 01 hover behavior unless a shadow or contrast regression is found.
- Always-visible strip on all touch viewports (document choice only).

## Decisions

1. **Share EventCard CSS via `brand-theme.css`**  
   Move the `.event-card*` / `.card.event-card` block from `apps/web/app/styles/globals.css` into `packages/ui/src/styles/brand-theme.css` (`@layer components`). App already imports brand-theme; Ladle gets the same rules. Alternatives: (a) duplicate hover CSS only in `stories.css` — rejected (two sources of truth); (b) leave CSS in apps/web and import globals into Ladle — rejected by design-system.md (do not permanently cross-import apps/web CSS).

2. **Forced story state = modifier class + Surface wrapper (no production prop required)**  
   Add `.card.event-card.event-card--availability-visible` (name may be shortened) in brand-theme that applies the same visual outcomes as `:hover` / `:focus-within` (outline emphasis, grayscale off, strip `opacity: 1`) **outside** the hover media query so Ladle always shows the reveal. Story wraps `EventCard` in HeroUI `Surface` with a story-scoped class (e.g. `event-card-story--availability-visible`) that targets the inner `.card.event-card`, **or** pass a merged `className` if EventCard gains a thin optional `className` merge — prefer wrapper CSS if it avoids API churn; allow optional `className` merge only if the modifier must sit on the Card root for selector parity. Alternatives: (a) `:hover` pseudo in Chromatic — not available; (b) `forceHover` prop — unnecessary if CSS modifier + wrapper works.

3. **Stories: keep existing CTA matrix; add one EN “availability visible” story (+ optional DE if cheap)**  
   Use `sampleEventAvailable` (non-zero capacity) so strip copy is meaningful; ticket type visible at story viewport ≥640px (Ladle default desktop). Name clearly: e.g. `EventCard / Hover — availability visible`. Do not replace resting stories — reviewers need default vs reveal side by side.

4. **Product map wording**  
   Update EventCard bullet to state: on hover-capable pointers (and keyboard `focus-within`), strip reveals remaining capacity + ticket type (sm+); card gains flat border/outline emphasis; **no** drop shadows. One short sentence: touch devices may keep the strip hidden until hover/focus — capacity remains on public detail; `prefers-reduced-motion` disables transitions. Optional identical one-liner in `design-tokens.md` only if the motion/shadow section needs an EventCard cross-ref; do not rewrite the whole shadows section.

5. **DS / Theme Overview spot-check**  
   Confirm “no drop shadows” / flat bordered cards language stands. Touch files only if something newly contradicts EventCard hover.

6. **A11y pass (manual, no new e2e)**  
   Keyboard: tab into card actions — `focus-within` should reveal strip (already in CSS); focus ring remains from HeroUI. Strip: accent-on-dark bar is theme tokens — accept unless contrast is obviously broken; do not invent a one-off yellow banner color.

7. **Stories verification**  
   `bun run stories` (root runs UI + web Ladle) or `bun --filter @unveiled/ui stories` — smoke that EventCard stories load. Typecheck covers story TS.

## Risks / Trade-offs

- **[Risk] Moving CSS breaks subtle app-only selectors** → Mitigation: move the whole `.event-card*` block verbatim; grep apps/web for leftover references; visual smoke Discover after move.
- **[Risk] Forced modifier drifts from real `:hover` rules** → Mitigation: define shared declarations once (grouped selectors: `:hover`, `:focus-within`, `.event-card--availability-visible`) so story and interaction stay in sync.
- **[Risk] HeroUI-only rule vs wrapper** → Mitigation: use `Surface`, not raw `<div>`.
- **[Risk] Touch users never see capacity on card** → Mitigation: document in map; detail page remains SoT; do not gate booking on strip visibility.
- **[Trade-off] OpenSpec delta vs product docs** → Product map is the implementer-facing SoT for the note; OpenSpec archives the stories requirement for apply/sync.

## Migration Plan

1. Move `.event-card*` rules into `brand-theme.css`; remove duplicate from apps/web `globals.css`.
2. Add forced availability-visible selector alongside hover/focus-within.
3. Add Ladle story (+ wrapper/class) for the reveal state.
4. Update `ui-component-map.md` (optional design-tokens one-liner); DS spot-check.
5. Grep EventCard CSS for `box-shadow` / `shadow-` / `.unveiled-shadow`.
6. Run lint, typecheck, stories smoke; a11y spot-check.
7. Mark step 02 + feature complete in parent guide.
8. Rollback: revert CSS move/story/doc commits; step 01 behavior remains in git history.

## Open Questions

- None blocking. If reviewers prefer an EventCard `className` prop over a story wrapper, either satisfies the stories requirement.
