## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-05-profile-account-tabs.md`, parent guide non-goals, and this change’s `design.md` / specs
- [x] 1.2 Confirm step 04 is merged (shared `PageSectionHeader` on account pages)
- [x] 1.3 Inventory `profile/*` routes, `ProfilePage` card sections, `AdminTabNav` / `EventFeedViewTabs`, and e2e/stories that click stacked Account links

## 2. Tab helpers and shell

- [x] 2.1 Add `apps/web/app/components/profile/profile-tabs.ts` (tab ids, order, path builders, `inferProfileTab`)
- [x] 2.2 Implement `ProfileTabNav` using `admin-tabs` / `admin-tabs__track` / `admin-tabs__tab` classes + localized labels
- [x] 2.3 Implement `ProfileLayout` (outer shell + `PageSectionHeader` + tab nav + children)
- [x] 2.4 Add DE/EN `tabNavLabel` (and any missing short tab labels) in `profile-content.ts`; ensure horizontal overflow is acceptable on small screens

## 3. Split wallet vs details; wrap routes

- [x] 3.1 Slim `/profile` to wallet-only panel inside `ProfileLayout` (`activeTab="wallet"`); remove stacked Account links card
- [x] 3.2 Add `/profile/details` route + personal-details panel; move identity form POST (`handleProfileIdentityPost`) to that route without changing package persistence helpers
- [x] 3.3 Wrap preferences, billing, billing/cancel, security, data-export, and delete-account routes in `ProfileLayout` with the correct active tab
- [x] 3.4 Ensure nested billing cancel keeps the billing tab active via `inferProfileTab` or explicit prop

## 4. Docs, stories, e2e

- [x] 4.1 Update `docs/product/sitemap/sitemap.md` for `/profile/details` and tabbed account IA
- [x] 4.2 Update `docs/product/features/profile.feature` notes for tab navigation vs stacked Account card
- [x] 4.3 Update profile Ladle stories for layout/tabs; drop assumptions about the stacked links card
- [x] 4.4 Update Playwright/e2e selectors that clicked the old stacked Account links to use the tablist

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` (exit 0)
- [x] 5.2 Run `bun run typecheck` (exit 0)
- [x] 5.3 Manual: `/en/profile` shows tablist; switch through wallet, details, preferences, billing, security, export, delete; no stacked Account link card; identity + preferences POSTs succeed
- [x] 5.4 Mark `manual-test-ux-05-profile-account-tabs` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
