## Why

The account page stacks Credit wallet, Personal details, and an Account link list (Vibes / Preferences, Billing, Change password, Export data, Delete account) as separate cards (see `.dev-plan/manual-test-profile.png`, `manual-test-profile2.png`). Admin and the event feed already use a horizontal link tablist. Members should reach account sections the same way — without a long stacked card list — now that step 04 shared `PageSectionHeader` chrome is in place.

## What Changes

- Add profile tab helpers (`profile-tabs.ts`: tab ids, order, localized path builders, active-tab inference) modeled on `admin-tabs.ts`.
- Add `ProfileTabNav` reusing `admin-tabs` / `admin-tabs__track` / `admin-tabs__tab` classes (same pattern as `EventFeedViewTabs` / `AdminTabNav`).
- Add `ProfileLayout` that renders `PageSectionHeader` + tab nav above page content for account routes.
- Split the monolithic `/profile` stacked cards into tab targets:
  - Credit wallet (default `/profile`)
  - Personal details (`/profile/details` — new route if needed)
  - Vibes / Preferences (`/profile/preferences`)
  - Billing (`/profile/billing`)
  - Change password (`/profile/security`)
  - Export data (`/profile/data-export`)
  - Delete account (`/profile/delete-account`)
- Remove the stacked Account link card once tabs replace it.
- Keep deep links working with the correct active tab (including billing cancel under the Billing tab).
- Update DE/EN tab labels in content modules; update sitemap + `profile.feature` IA notes; update stories/e2e that assumed stacked cards.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-profile`: Account sections SHALL be navigational tabs (link tablist, active tab via route) using the same pattern as admin; the stacked Account link card SHALL be removed; wallet and personal details SHALL be separate tab targets; identity and preference mutations remain SSR form POSTs on their dedicated routes.

## Impact

- **UI:** New `apps/web/app/components/profile/{profile-tabs.ts,ProfileTabNav.tsx,ProfileLayout.tsx}`; refactor `ProfilePage` (and sibling account pages) to render inside the tabbed shell; new `/profile/details` route module if identity moves off `/profile`.
- **Routes:** `apps/web/app/routes/[locale]/profile.tsx` + `profile/*`; wire `ProfileLayout` + `activeTab` from each module.
- **Copy:** `apps/web/app/lib/profile-content.ts` (and billing/gdpr copy only if tab labels live there) — tab labels DE/EN.
- **CSS:** Reuse existing `.admin-tabs*` in `globals.css`; allow horizontal overflow on small screens (parent guide risk note) rather than a second tab system.
- **Product docs:** `docs/product/sitemap/sitemap.md`, `docs/product/features/profile.feature` for tabbed IA / `/profile/details`.
- **Stories / e2e:** Profile Ladle stories and any Playwright steps that click the old stacked Account links.
- **Unchanged:** Billing/Stripe flows; GDPR domain behavior; onboarding wizard; membership page; HeroUI-only markup; theme tokens for tab look (reuse admin).
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-05-profile-account-tabs.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Depends on:** `manual-test-ux-04-profile-page-header` (done)
- **Consumed by:** closes the feature
- **Verification:** `bun run lint`, `bun run typecheck`; manual tab navigation on `/en/profile*`; identity/preferences POSTs still succeed
