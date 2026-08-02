## 1. Theme hero framing

- [x] 1.1 Update `.event-detail--checkout__hero` / `__hero-image` in `apps/web/app/styles/globals.css` for full-width frame, horizontal centering, intrinsic aspect (`width: auto; max-width: 100%; height: auto`) — no stretch-to-fill / cover crop
- [x] 1.2 Remove or neutralize unused `.event-detail__hero-image` (`aspect-ratio` + `object-fit: cover`) so it cannot be reattached by mistake
- [x] 1.3 Touch `EventDetailPage.tsx` markup only if centering needs a structural class; keep HeroUI `Surface` + `<img>` exception; no ad-hoc Tailwind visual sizing on the image

## 2. Docs & stories

- [x] 2.1 Update `docs/product/ui/ui-component-map.md` Event detail entry for full-width frame, centered non-stretch image (`max-width: 100%` OK)
- [x] 2.2 Add a short `gaps-and-decisions.md` note if prior wording implied stretch/cover-fill (skip if map update alone is enough)
- [x] 2.3 Align `EventDetailPage.stories.tsx` with theme-owned non-stretch hero classes (no story-only stretch treatment)

## 3. E2e (opportunistic) & parent guide

- [x] 3.1 Grep Playwright for hero width / object-fit / stretch assertions; adjust `e2e/specs/event-discovery.spec.ts` only if old sizing was explicitly asserted (proximity selectors only)
- [x] 3.2 Mark `ux-polish-03-event-detail-hero` done in `.dev-plan/current-iteration/ux-polish-parent-guide.md`

## 4. Verification

- [x] 4.1 Run `bun run lint` — exits 0
- [x] 4.2 Run `bun run typecheck` — exits 0
- [x] 4.3 Visual smoke: primary hero centered in a full-width band, not stretch-filled (prefer a non-banner aspect if available)
  <!-- Source CSS verified: flex center + width:auto/max-width:100%/height:auto; dead cover rule removed. Confirm in Ladle/staging with a non-banner image. -->
