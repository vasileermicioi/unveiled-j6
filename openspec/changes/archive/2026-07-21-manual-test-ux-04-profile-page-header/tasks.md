## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-04-profile-page-header.md`, parent guide non-goals, and this change’s `design.md` / specs
- [x] 1.2 Diff `ProfilePage` intro vs `SavedEventsPage` / `MyTicketsPage`; confirm touch points (seven profile components + stories + content modules)
- [x] 1.3 Confirm `PageSectionHeader` API (`eyebrow` + `headline`) needs no changes

## 2. Copy and page headers

- [x] 2.1 Add DE/EN eyebrow fields to `profile-content.ts`, `billing-content.ts`, and `gdpr-content.ts` (prefer shared Account/`Konto` eyebrow per design)
- [x] 2.2 Replace H1 + muted subtitle intros with `PageSectionHeader` on `ProfilePage`, `PreferencesPage`, `BillingPage`, `SecurityPage`, `DataExportPage`, `DeleteAccountPage`, and `BillingCancelPage`
- [x] 2.3 Stop rendering page-level muted subtitles under the title; relocate any unique instructional subtitle into existing card body copy if still needed
- [x] 2.4 Update profile Ladle stories that assume the old intro

## 3. Docs and cleanup

- [x] 3.1 Grep for unused subtitle fields; leave or remove only if safe (no SEO/meta consumers)
- [x] 3.2 Update `docs/product/ui/ui-component-map.md` and/or `static-pages-content.md` if account routes omit `PageSectionHeader`

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` (exit 0)
- [x] 4.2 Run `bun run typecheck` (exit 0)
- [x] 4.3 Manual: `/en/profile` header matches eyebrow/headline pattern on `/en/saved` and `/en/bookings`; spot-check key subpages
- [x] 4.4 Mark `manual-test-ux-04-profile-page-header` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
