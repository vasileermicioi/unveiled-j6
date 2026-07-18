## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-detail-ux-02-details-metadata-density.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm step 01 layout baseline is available (`EventDetailPage` identity/checkout alignment + hero theme rules)
- [x] 1.3 Skim `packages/ui` EventCard meta rows (Calendar / MapPin) for density inspiration — not a 1:1 clone
- [x] 1.4 Review `.dev-plan/manual-test-feedback-2.png` and `.dev-plan/manual-test-feedback-3.png` against current DETAILS stack + LOCATION card

## 2. DETAILS metadata grid

- [x] 2.1 Replace sparse vertical DETAILS stack in `EventDetailPage.tsx` with responsive grid (`grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3`) of label/value cells
- [x] 2.2 Preserve existing fields and i18n helpers (when, accessibility, languages, age groups, type, neighborhood); omit empty optional fields as today
- [x] 2.3 Add Lucide `Calendar` on date and `MapPin` on neighborhood only (`aria-hidden`); theme class for icon color
- [x] 2.4 Add `@layer components` rules for `.event-detail--checkout__meta*` (grid/cell/icon as needed); keep Tailwind to grid/flex/gap/items only

## 3. LOCATION chrome

- [x] 3.1 Tighten LOCATION card spacing (less empty padding/gap) while keeping address above map
- [x] 3.2 Ensure map wrapper uses full card content width (`w-full` / theme width); do not change marker visuals
- [x] 3.3 Spot-check events without coordinates still omit LOCATION card

## 4. Stories & verification

- [x] 4.1 Optionally update `EventDetailPage.stories.tsx` fixture so dense metadata is visible in Ladle
- [x] 4.2 Run `bun run lint` (exit 0)
- [x] 4.3 Run `bun run typecheck` (exit 0)
- [x] 4.4 Visual check ~1280px: DETAILS ≥2 columns filling horizontal space; LOCATION map spans card content width; no new hard drop shadows

## 5. Handoff

- [x] 5.1 Mark step 02 accurately in `.dev-plan/current-iteration/event-detail-ux-parent-guide.md` after merge
- [x] 5.2 Defer product-doc / e2e wording to step 05; note any new CSS class names for step 05 docs
- [x] 5.3 Prepare PR/handoff linking this change id and the parent guide
