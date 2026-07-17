## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/discovery-booking-ux-01-page-section-header.md`, parent-guide non-goals, and this change’s proposal/design/specs
- [x] 1.2 Confirm Discover `.discover-events-heading` still matches `.dev-plan/1-page-header.png`; skim `PageHero` vs on-yellow header contrast

## 2. Shared header

- [x] 2.1 Add `apps/web/app/components/marketing/PageSectionHeader.tsx` (HeroUI `Surface` + muted uppercase eyebrow `Paragraph` + `Heading`; props: `eyebrow`, `headline`, optional `id`, optional `level` default 1)
- [x] 2.2 Introduce shared theme class `.page-section-header` in `globals.css` (rule + spacing from `.discover-events-heading`); migrate Discover and remove or alias the old class
- [x] 2.3 Refactor Discover live-preview header to use `PageSectionHeader`

## 3. Adoption & copy

- [x] 3.1 Adopt on `FaqPage` (subheadline below the ruled header); consolidate FAQ display type under the shared class if needed
- [x] 3.2 Adopt on `AuthPageLayout`; add DE/EN `eyebrow` strings in `auth-content.ts`; keep description below the header
- [x] 3.3 Adopt on `EventFeedPage` and `SavedEventsPage` (add eyebrows in content modules if missing); keep feed map Link as sibling, not inside the header
- [x] 3.4 Leave `MembershipInfoPage` card hero and `PageHero` pages unchanged; note deliberate deferral for step 04 / follow-up
- [x] 3.5 Add Ladle story for `PageSectionHeader` (default + long-headline wrap)

## 4. Validation

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (both exit 0)
- [x] 4.2 Run `bun run stories` (or repo Ladle build) — `PageSectionHeader` story renders without error
- [x] 4.3 Manual smoke: `/de`, `/de/faq`, `/de/login`, `/de/events` show eyebrow + headline + bottom rule; spot-check mobile wrap

## 5. Cleanup

- [x] 5.1 Mark step 01 done in `.dev-plan/current-iteration/discovery-booking-ux-parent-guide.md`
- [x] 5.2 Do not start step 02 until verification above passes
