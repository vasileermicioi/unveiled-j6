## Context

Event Card Hover step 01 is **theme-first**: strengthen the existing `.event-card` hover in `apps/web/app/styles/globals.css` without redesigning the card or copying the inspiration mock’s hard black offset shadow (`.dev-plan/2-event-hover.png` is interaction-only).

Current behavior (~532+ in `globals.css`):

- Cover `.event-card__image-el` is `grayscale(100%)` → `grayscale(0%)` on `.event-card:hover` with a `0.2s` filter transition.
- `.event-card__availability` is `opacity: 0` → `1` on hover; ticket type shows at `min-width: 640px`.
- Hover rules are **not** gated by `@media (hover: hover)` (unlike nav/footer patterns elsewhere in the same file).
- No card-surface border emphasis on hover; HeroUI cards use the default flat 2px border.
- No `prefers-reduced-motion` guard for the filter/opacity transitions.
- Markup already exposes `Card className="event-card"` and BEM hooks (`event-card__availability`, `__category`, `__image-el`) — prefer pure CSS.

Constraints: theme-only visuals; no `box-shadow` / Tailwind shadow utilities; HeroUI-only structure; [`DESIGN.md`](../../../DESIGN.md) Elevation & Depth = none (depth via 2px–4px borders).

## Goals / Non-Goals

**Goals:**

- On hover-capable pointers: colorize image, reveal availability strip, emphasize card with thicker/stronger flat border (or accent edge) using theme tokens.
- Gate hover-driven reveals with `@media (hover: hover)` so coarse pointers are not stuck mid-transition.
- Shorten/disable image/strip transitions under `prefers-reduced-motion: reduce`.
- Keep category chip readable when the strip appears; keep sold-out (`Available: 0`) visible on hover.
- Optional: `:focus-within` parity for keyboard users if it comes for free with the same CSS rules (do not invent new keyboard UX beyond that — detail page remains capacity SoT).

**Non-Goals:**

- Stories / product-map / a11y doc hardening (step 02).
- Feed grid layout, new fields, CTA precedence, bookmark SSR changes.
- Copying inspiration neon strip colors or offset shadows outside theme tokens.
- Always-visible availability strip on all viewports (touch strategy can be documented in step 02 if needed).

## Decisions

1. **Hover media query first**  
   Wrap image colorize, strip reveal, and border emphasis in `@media (hover: hover)` so touch devices keep the resting (grayscale + strip hidden) state unless they also match hover. Matches existing nav patterns in `globals.css`. Alternatives: keep bare `:hover` (current) — rejected because it can flash on tap; always-show strip — deferred (parent risk; step 02 may document).

2. **Flat “pop” = border width 2px → 4px on the card root**  
   Prefer `.card.event-card` (or `.event-card`) `border-width` / `border-color` transition using `var(--border)` (and optionally `var(--accent)` only if 4px dark border alone feels weak). This maps directly to DESIGN.md (“2px–4px dark borders”). Alternatives considered: (a) translate/scale — can cause layout shift, rejected; (b) background fill invert — too loud for a list card; (c) box-shadow — **forbidden**.

3. **Keep availability strip tokens as-is**  
   Retain `color-mix(... var(--foreground) ...)` bar + `var(--accent)` text. Do not introduce a one-off yellow banner color in TSX/CSS. Refine opacity transition only; ensure padding/z-index so `.event-card__category` (top-left Chip) is not covered awkwardly — strip is bottom-anchored today, so chip conflict is mainly contrast/readability, not overlap.

4. **Pure CSS unless Card root selector fails**  
   `EventCard` already sets `className="event-card"`. Only add a BEM hook if HeroUI Card border lives on an inner node that `.event-card` cannot reach; otherwise leave TSX untouched.

5. **Reduced motion = zero-duration transitions**  
   Under `@media (prefers-reduced-motion: reduce)`, set filter/opacity/border transitions on `.event-card*` to `0s` (or omit). Instant state change on hover is fine; do not remove the hover affordance itself.

6. **Sold-out / voucher / secret-code**  
   No special-case CSS: strip already shows `Available: 0` and ticket-type labels from `EventCard.tsx`. Sanity-check visually on sm+ after CSS changes.

## Risks / Trade-offs

- **[Risk] 4px border causes 2px layout shift in a dense grid** → Mitigation: use `outline` of matching color/width **or** transparent/default border reserved at 4px with color change only; prefer `outline`/`outline-offset: -4px` only if box border shift is visible — otherwise accept micro-shift consistent with neo-brutalist chrome (navbar already uses 4px). Prefer testing both; pick the one with no reflow if possible.
- **[Risk] Hover-only capacity on touch** → Mitigation: capacity remains on public detail; step 02 documents touch choice; do not block booking on strip visibility.
- **[Risk] Focus-within missing** → Mitigation: add `:focus-within` alongside `:hover` inside the hover media query if keyboard tabbing into card actions should also reveal strip; HeroUI focus ring stays for focus indication.
- **[Trade-off] OpenSpec vs product docs** → Product SoT remains `docs/product/`; this delta archives the hover requirement for apply/sync. Step 02 updates `ui-component-map.md` wording if needed.

## Migration Plan

1. Edit `.event-card*` rules in `globals.css` (hover media, border emphasis, reduced-motion).
2. Touch `EventCard.tsx` only if a class hook is required.
3. Manual hover on Discover + spot-check `/events`; check sold-out and ticket-type on sm+.
4. Run `bun run lint` and `bun run typecheck`.
5. Mark step 01 done in `event-card-hover-parent-guide.md`.
6. Rollback: revert the CSS block (and any optional class hook).

## Open Questions

- None blocking. Touch always-visible strip vs hover-only is deferred to step 02 documentation if product wants stronger guidance.
