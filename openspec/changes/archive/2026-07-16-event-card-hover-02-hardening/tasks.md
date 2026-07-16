## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-card-hover-02-hardening.md`, parent release criteria, and this change’s `proposal.md` / `design.md` / `specs/event-catalog/spec.md`
- [x] 1.2 Confirm step 01 is marked done in `event-card-hover-parent-guide.md` and skim shipped `.event-card*` CSS + current `EventCard.stories.tsx` / ui-component-map EventCard entry

## 2. Shared theme CSS + forced hover state

- [x] 2.1 Move the `.event-card*` / `.card.event-card` block from `apps/web/app/styles/globals.css` into `packages/ui/src/styles/brand-theme.css` (`@layer components`) so Ladle and app share one source; remove the duplicate from globals
- [x] 2.2 Add a forced availability-visible selector (e.g. `.card.event-card.event-card--availability-visible` or story-wrapper target) grouped with `:hover` / `:focus-within` outcomes so strip, colorize, and flat outline stay in sync — no `box-shadow`
- [x] 2.3 Grep EventCard-related CSS for `box-shadow`, `.unveiled-shadow`, and Tailwind `shadow-*`; remove any regressions

## 3. Ladle stories

- [x] 3.1 Add an EventCard story (EN; optional DE) that forces the hover/availability-visible state via HeroUI `Surface` wrapper and/or modifier class — use an available sample event so capacity + ticket type show on the media area
- [x] 3.2 Keep existing resting CTA stories so default vs reveal can be compared; name the new story clearly (e.g. `EventCard / Hover — availability visible`)
- [x] 3.3 Spot-check stories load via `bun run stories` or `bun --filter @unveiled/ui stories`

## 4. Docs + a11y

- [x] 4.1 Update `docs/product/ui/ui-component-map.md` EventCard description for flat-border/outline hover + availability strip (not offset shadow); add one short sentence on touch / `prefers-reduced-motion` if helpful
- [x] 4.2 Optional: one-line EventCard motion cross-ref in `docs/product/ui/design-tokens.md` only if the shadows/motion section needs it
- [x] 4.3 Confirm Theme Overview / `design-system.md` do not prescribe card drop shadows; fix only contradictions
- [x] 4.4 Quick a11y pass: keyboard `focus-within` still reveals strip / focus ring clear; strip accent-on-dark contrast acceptable with theme tokens

## 5. Validation & cleanup

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 5.2 Confirm parent release criteria (hover contract documented; no shadow pop; stories show default + reveal)
- [x] 5.3 Mark step 02 done and mark **Event Card Hover** feature complete in `.dev-plan/current-iteration/event-card-hover-parent-guide.md`
