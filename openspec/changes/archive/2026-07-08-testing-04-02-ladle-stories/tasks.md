## 1. Setup

- [x] 1.1 Read `docs/migration/ui/ui-component-map.md` and inventory all `apps/web/app/components/**/*.tsx` against scope list
- [x] 1.2 Confirm `ThemeDecorator` applies yellow background in both Ladle servers (`packages/ui` port 61000, `apps/web` port 61001)
- [x] 1.3 Verify `apps/web/.ladle/components.tsx` (or create) wires global `ThemeDecorator` provider

## 2. Shared fixtures

- [x] 2.1 Create `packages/ui/src/stories/event-fixtures.ts` — `EventCardItem` samples including sold-out (`remainingCapacity: 0`) variant
- [x] 2.2 Create `apps/web/app/components/stories/fixtures.ts` — `AppSession` (guest/USER/ADMIN), Drizzle `Event`, admin table rows, placeholder `imageId`
- [x] 2.3 Document `IMAGE_PUBLIC_BASE_URL` fallback for story image URLs (env or static placeholder host)

## 3. EventCard stories (`packages/ui`)

- [x] 3.1 Create `packages/ui/src/EventCard.stories.tsx`
- [x] 3.2 Add Guest — See details story with `remainingCapacity: 0` (guest-first precedence)
- [x] 3.3 Add Member — Waitlist, Unlock, Book Now stories
- [x] 3.4 Add Member saved bookmark on/off variants
- [x] 3.5 Add `de` locale variants for CTA label stories where copy differs

## 4. Phase 0 shell stories (`apps/web`)

- [x] 4.1 `AppShell.stories.tsx` — guest session wrapper with sample child content
- [x] 4.2 `AppNavbar.stories.tsx` — guest, signed-in USER, ADMIN variants
- [x] 4.3 `GuestFooter.stories.tsx`, `Logo.stories.tsx` (black/white/yellow tones)
- [x] 4.4 `NotFoundPage.stories.tsx`, `NavLink.stories.tsx` (active/inactive)

## 5. Phase 1 marketing stories (`apps/web`)

- [x] 5.1 `LandingPage.stories.tsx`, `HowItWorksPage.stories.tsx`, `FaqPage.stories.tsx`
- [x] 5.2 `HelpSection.stories.tsx`, `DiscoverPage.stories.tsx`, `MembershipInfoPage.stories.tsx`
- [x] 5.3 `PageHero.stories.tsx`, `SectionCard.stories.tsx`
- [x] 5.4 `LegalPage.stories.tsx` — one story per legal page type via args (impressum/privacy/terms)

## 6. Phase 2 auth stories (`apps/web`)

- [x] 6.1 `AuthPageLayout.stories.tsx` — default layout with placeholder children
- [x] 6.2 `AuthFormFallback.stories.tsx` — loading and error states if applicable

## 7. Phase 3 onboarding stories (`apps/web`)

- [x] 7.1 `OnboardingLayout.stories.tsx`, `OnboardingStepIndicator.stories.tsx` (steps 1–4)
- [x] 7.2 `OnboardingStepPage.stories.tsx`, `OnboardingFormActions.stories.tsx`
- [x] 7.3 `AgeStepForm.stories.tsx`, `InterestsStepForm.stories.tsx`, `LocationStepForm.stories.tsx`, `TimingStepForm.stories.tsx`

## 8. Phase 4 admin/catalog stories (`apps/web`)

- [x] 8.1 `catalog/EventDetailPage.stories.tsx` — guest CTA view
- [x] 8.2 `admin/AdminLayout.stories.tsx`, `AdminPageShell.stories.tsx`, `AdminTabNav.stories.tsx`
- [x] 8.3 `admin/AdminKpiGrid.stories.tsx`, `AdminDashboardPage.stories.tsx`
- [x] 8.4 `admin/AdminEventsListPage.stories.tsx`, `AdminEventsTable.stories.tsx` (sample rows)
- [x] 8.5 `admin/AdminPartnersListPage.stories.tsx`, `AdminPartnersTable.stories.tsx`
- [x] 8.6 `admin/AdminPagination.stories.tsx` — first, middle, last page states
- [x] 8.7 `admin/AdminSearchForm.stories.tsx`, `AdminFormSelect.stories.tsx`, `EventAdminBaseFields.stories.tsx` (collapsed preview)

## 9. Validation

- [x] 9.1 Every component in scope has at least one story file
- [x] 9.2 EventCard guest story shows "See details" with `remainingCapacity === 0`
- [x] 9.3 `bun run stories` — all stories load without console errors
- [x] 9.4 `bun run lint` and `bun run typecheck` pass
- [x] 9.5 `bun run build` passes (stories excluded from production bundle)

## 10. Cleanup

- [x] 10.1 Mark step 02 done in `.dev-plan/current-iteration/testing-04-parent-guide.md`
- [x] 10.2 Note deferred components (`EventMap`, upload/geo islands) in parent guide if not already listed
