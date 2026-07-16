## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-card-hover-01-theme-treatment.md` and parent-guide non-goals (no offset shadows, no feed redesign)
- [x] 1.2 Inspect current `.event-card*` CSS in `apps/web/app/styles/globals.css` (~532+) and `packages/ui/src/EventCard.tsx` BEM hooks

## 2. Theme hover treatment

- [x] 2.1 Gate image colorize + availability strip reveal under `@media (hover: hover)` (optionally mirror with `:focus-within`)
- [x] 2.2 Add flat border/contrast emphasis on hover for `.card.event-card` / `.event-card` using theme tokens only (target 2px → 4px or equivalent; no `box-shadow`)
- [x] 2.3 Add `prefers-reduced-motion: reduce` guards so filter/opacity/border transitions are `0s` or omitted
- [x] 2.4 Confirm category chip remains readable when the strip appears; avoid covering the chip
- [x] 2.5 Add a minimal EventCard class hook only if pure CSS cannot target the card border node

## 3. Validation

- [x] 3.1 Sanity-check sold-out (`Available: 0`) and voucher/secret-code ticket-type display on sm+ under hover
- [x] 3.2 Manual visual check: Discover + member feed on desktop hover; spot-check mobile layout (no broken layout / no shadow)
- [x] 3.3 Run `bun run lint` and `bun run typecheck` (both exit 0)

## 4. Cleanup

- [x] 4.1 Mark step 01 done in `.dev-plan/current-iteration/event-card-hover-parent-guide.md`
