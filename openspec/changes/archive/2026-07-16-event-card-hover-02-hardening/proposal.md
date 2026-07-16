## Why

Step 01 shipped the flat EventCard hover (colorize, availability strip, inward 4px outline, reduced-motion guards), but Ladle stories and the product UI map still only describe resting cards — reviewers cannot see the hover/availability contract without a live browser hover. This close-out documents the contract, confirms no shadow regressions, and completes the **Event Card Hover** feature.

## What Changes

- Update `packages/ui/src/EventCard.stories.tsx` with a default vs forced hover / “availability visible” state (CSS class or story decorator).
- Sync `docs/product/ui/ui-component-map.md` EventCard bullet with the flat-border hover (not offset shadow); optionally one short sentence on touch / `prefers-reduced-motion`.
- Confirm Theme Overview / DS notes do not prescribe shadows for cards (spot-check only; fix contradictions if found).
- Quick a11y pass: focus-visible still clear; strip text contrast on the dark availability bar acceptable.
- Mark step 02 done and the parent **Event Card Hover** feature complete after verification.

**Out of scope:** Redesigning CTA buttons, changing capacity math, partner slider work, new hover-only e2e screenshot tests, reworking theme CSS from step 01 unless a shadow regression is found.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Add **EventCard hover documented in stories** — `@unveiled/ui` EventCard Ladle stories SHALL include a state that demonstrates the hover/availability reveal (or an equivalent forced-visible strip) so theme reviews do not require a live browser hover.

## Impact

- **Stories:** `packages/ui/src/EventCard.stories.tsx` (and a small CSS hook in theme or story decorator if needed to force the hover/availability-visible state).
- **Product docs:** `docs/product/ui/ui-component-map.md` EventCard section; optionally a one-line motion/touch note in `docs/product/ui/design-tokens.md` if helpful.
- **DS spot-check:** `docs/product/ui/design-system.md` / Theme Overview — confirm no card shadow prescription; touch only if contradictory.
- **Theme CSS (verify only):** `apps/web/app/styles/globals.css` `.event-card*` — confirm no `box-shadow` / Tailwind shadow utilities crept in.
- **Planning:** `.dev-plan/current-iteration/event-card-hover-parent-guide.md` — mark step 02 done and feature complete.
- **Depends on:** `event-card-hover-01-theme-treatment` (merged/archived).
- **Consumed by:** closes the Event Card Hover feature.
- **Verification:** `bun run lint`, `bun run typecheck`, EventCard stories load via `bun run stories` (or package story script).
