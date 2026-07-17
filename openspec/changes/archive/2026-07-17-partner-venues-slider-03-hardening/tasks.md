## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/partner-venues-slider-03-hardening.md`, parent release criteria in `partner-venues-slider-parent-guide.md`, and this change’s `proposal.md` / `design.md` / `specs/static-marketing-pages/spec.md`
- [x] 1.2 Confirm step 02 motion is present (keyframes + reduced-motion) on Discover; skim `DiscoverPage.tsx` partners block for clone `aria-hidden` / decorative `alt`
- [x] 1.3 Grep `docs/product/` (and agent UI notes if needed) for “partner tiles” / address-grid / “grid of up to 8” wording that still contradicts the logo marquee

## 2. A11y & empty state

- [x] 2.1 Wire a single accessible section name on the partners region (prefer `aria-labelledby` → eyebrow `id`; fallback `aria-label` from eyebrow copy)
- [x] 2.2 Verify duplicate sequence is hidden from AT (`aria-hidden` on clones or a single wrap around the second map); keep logo `alt=""` and primary-cell names once
- [x] 2.3 Hide the entire Partner venues section when `partners.length === 0` (no empty track, no new empty-copy string)

## 3. Ladle stories

- [x] 3.1 Update `DiscoverPage.stories.tsx` with a multi-partner marquee story (mix logo + initial mocks) so the strip reads as a slider in Ladle
- [x] 3.2 Add an Empty partners story (`partners={[]}`) that shows the section absent
- [x] 3.3 Note in story description/meta that reduced-motion is CSS `@media (prefers-reduced-motion: reduce)` — not a story prop

## 4. Product doc sync

- [x] 4.1 Update `docs/product/ui/static-pages-content.md` § Partner venues: continuous marquee + reduced-motion static + empty → hidden; remove “follow-up step” motion language
- [x] 4.2 Update `docs/product/ui/ui-component-map.md` Discover home row to mention Partner venues logo marquee (not address-card grid)
- [x] 4.3 Fix any leftover i18n inventory / related lines that still say “grid of up to 8 partner tiles” or address-card partners on Discover

## 5. Validation & cleanup

- [x] 5.1 Spot-check `e2e/specs/event-discovery.spec.ts` partners eyebrow proximity assert still valid with seeded partners; adjust only if labeling/empty-hide breaks it
- [x] 5.2 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 5.3 Load Discover stories via `bun run stories` (or package equivalent); manual AT skim — section named once, logos decorative, no double-announce
- [x] 5.4 Walk parent release criteria checklist; mark step 03 done and **Partner Venues Slider** feature complete in `.dev-plan/current-iteration/partner-venues-slider-parent-guide.md`
