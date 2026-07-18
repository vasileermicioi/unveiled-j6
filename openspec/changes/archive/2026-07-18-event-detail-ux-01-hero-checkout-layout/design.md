## Context

`/:locale/events/:id` already ships the checkout-focused composition from `discovery-booking-ux-03`: identity column + dark `EventDetailCheckoutCard`, theme rules under `.event-detail--checkout__*`, public indexing/JSON-LD preserved. Manual QA (`.dev-plan/manual-test-feedback-1.png`) shows a vertical offset: close chrome sits in a full-width row above the grid (`event-detail--checkout__chrome mb-6 flex justify-end`), so the identity eyebrow starts lower than the checkout card top. The hero uses `aspect-ratio: 4 / 3` and reads as a small inset on `lg` despite `width: 100%` of the identity column.

This is step **01** of Event Detail UX (parent: `.dev-plan/current-iteration/event-detail-ux-parent-guide.md`). Steps 02–05 own DETAILS density, map pin, dynamic ticket max, and product/e2e hardening. Constraints: HeroUI-only markup (`<img>` exception for hero), theme-only visuals, Tailwind layout-only, yellow `#FAFF86` backdrop, no drop shadows, no booking POSTs on detail.

## Goals / Non-Goals

**Goals:**

- On `lg+`, identity column content and checkout card share a common top edge within the main content grid.
- Hero image fills the identity column width with a larger, wider aspect on `md`/`lg` (prefer ~`16/9` or EventCard-like), `object-fit: cover`, responsive `sizes` matching breakpoints.
- On `sm`/`md`, stacked identity → checkout remains readable; close control is not clipped and does not create large empty bands beside the hero.
- Guest and eligible checkout cards still render beside (or below) identity with unchanged CTA semantics.

**Non-Goals:**

- DETAILS / LOCATION density (step 02).
- Map marker icon (step 03).
- Dynamic ticket quantity max (step 04).
- Product doc / Gherkin / e2e updates (step 05).
- Booking domain, book route, Stripe, or CTA matrix behavior changes.
- Redesigning Discover EventCards or the yellow page field tokens.

## Decisions

1. **Close control: remove the offsetting chrome row**
   - **Choice:** Stop dedicating a full-width flex row above the grid. Prefer either:
     - **A (preferred):** Place the close `Link` in a shared top row inside/over the layout that both columns respect (e.g. grid area spanning both columns, or absolute positioning within a `relative` layout wrapper so the identity/checkout grid starts at the same Y), or
     - **B:** Move close into the checkout column’s top-right (still a Link, not a modal) so the identity column’s first line aligns with the card’s top edge.
   - **Rationale:** Current `chrome` + `mb-6` is the misalignment root; mockup/feedback want identity eyebrow ≈ card top.
   - **Alternatives:** Keep chrome and pad the checkout card down to match (rejected; wastes yellow field and fights sticky checkout).

2. **Grid alignment**
   - **Choice:** Keep `lg:grid-cols-2` + `lg:items-start` on `event-detail--checkout__layout`; ensure no sibling above the grid shifts only the left column. Optional `lg:sticky lg:top-*` on the checkout card wrapper if it improves parity without overlapping the hero awkwardly — only if visual check confirms.
   - **Rationale:** Spec requires common top alignment; sticky is optional polish, not a requirement.
   - **Alternatives:** Single-column forever (rejected; fails lg composition); CSS subgrid spanning chrome (unnecessary if chrome is removed from the offset path).

3. **Hero sizing in theme CSS**
   - **Choice:** Update `.event-detail--checkout__hero-image` in `globals.css`: keep `width: 100%`, `object-fit: cover`, flat `2px` border; change aspect from permanent `4 / 3` to responsive wider ratios (e.g. default closer to `4 / 3` on small if needed, `16 / 9` from `md` or `lg` via `@media`). Ensure `.event-detail--checkout__hero` does not constrain max-width below the column. Update `<img sizes>` if breakpoints change (today `(max-width: 1024px) 100vw, 50vw` is roughly correct for 2-col).
   - **Rationale:** Theme owns aspect/border; Tailwind stays layout-only on wrappers.
   - **Alternatives:** Inline aspect utility classes (rejected; AGENTS theme rule); keep `4 / 3` and only widen container (insufficient per feedback).

4. **Markup / islands**
   - **Choice:** Touch `EventDetailPage.tsx` for chrome/layout structure; leave `EventDetailCheckoutCard` behavior alone unless a sticky class must live on a wrapper Surface around the island.
   - **Rationale:** Minimal blast radius; checkout island already correct for guest/eligible.
   - **Alternatives:** Rewrite checkout island layout (out of scope).

5. **Stories**
   - **Choice:** Optional small `EventDetailPage.stories.tsx` frame tweak only if Ladle needs a wider viewport frame to review alignment; no new story matrix required in 01.
   - **Rationale:** Visual verification is the bar; hardening owns broader story/e2e coverage.

## Risks / Trade-offs

- **[Risk] Absolute close overlaps title on narrow viewports** → Mitigation: keep hit target ≥ 2.5rem; reserve padding or stack close above identity on `sm` without recreating the lg offset (e.g. close only overlays on `lg+`).
- **[Risk] Sticky checkout covers below-fold DETAILS when scrolling** → Mitigation: skip sticky if awkward; DETAILS density is step 02.
- **[Risk] Wider `16/9` crops important subject on portrait venue photos** → Mitigation: `object-fit: cover` is intentional; accept EventCard-consistent crop.
- **[Trade-off] Parent guide currently marks 01–05 done** → Treat iteration markdown + this change as the active plan for residual layout debt; mark parent guide honestly after merge (cleanup task).
- **[Trade-off] Spec drift vs `docs/product/` until step 05** → Acceptable per step plan; delta lives here and in iteration file.

## Migration Plan

1. Implement close + grid + hero theme/`sizes` changes.
2. Spot-check guest and eligible CTAs still beside identity on `lg`.
3. `bun run lint` && `bun run typecheck`.
4. Visual check ~1280px and ~375px (or Ladle).
5. Update parent guide step 01 checkbox on merge; no DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Prefer decision 1A (shared relative wrapper + overlay close on `lg+`) unless implementer finds 1B cleaner with less CSS — either satisfies the alignment requirement.
