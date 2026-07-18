## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-detail-ux-01-hero-checkout-layout.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites exist: `EventDetailPage.tsx`, `EventDetailCheckoutCard.tsx`, `.event-detail--checkout__*` in `globals.css`, feedback image
- [x] 1.3 Review `manual-test-feedback-1.png` against current chrome row + `aspect-ratio: 4 / 3` hero

## 2. Layout & close control

- [x] 2.1 Remove or restructure `event-detail--checkout__chrome` so close no longer offsets identity below the checkout card top on `lg+`
- [x] 2.2 Implement preferred close placement (relative layout wrapper + overlay close on `lg+`, or close in checkout column top-right) while keeping HeroUI `Link` + existing `returnTo` / Discover / feed hrefs
- [x] 2.3 Keep `lg:grid-cols-2 lg:items-start` grid tops aligned; verify gap and `max-w-7xl` container; optionally add sticky checkout only if it does not overlap the hero awkwardly
- [x] 2.4 On `sm`, ensure stack order identity → checkout and close is not clipped/overlapping

## 3. Hero sizing

- [x] 3.1 Update `.event-detail--checkout__hero-image` theme rules: full column width, `object-fit: cover`, responsive wider aspect on `md`/`lg` (prefer ~`16/9`)
- [x] 3.2 Confirm `<img sizes>` / `srcSet` match real breakpoints (adjust if grid breakpoints change)
- [x] 3.3 Spot-check guest and eligible checkout cards still render beside identity on `lg`

## 4. Stories & verification

- [x] 4.1 Optionally tweak `EventDetailPage.stories.tsx` frame if Ladle needs a wider viewport to review alignment
- [x] 4.2 Run `bun run lint` (exit 0)
- [x] 4.3 Run `bun run typecheck` (exit 0)
- [x] 4.4 Visual check ~1280px (identity eyebrow top ≈ checkout card top; hero fills identity column) and ~375px (stack + close usable)

## 5. Handoff

- [x] 5.1 Mark step 01 done in `.dev-plan/current-iteration/event-detail-ux-parent-guide.md` if not already accurate
- [x] 5.2 Leave product-doc / e2e wording to step 05; note any layout hooks step 02 needs
- [x] 5.3 Prepare PR/handoff linking this change id and the parent guide
