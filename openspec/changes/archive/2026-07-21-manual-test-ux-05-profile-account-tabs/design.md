## Context

`ProfilePage` still stacks three cards: Credit wallet, Personal details (identity form POST to `/profile`), and an Account link list to preferences / billing / security / data-export / delete-account. Step 04 already aligned account pages to `PageSectionHeader`. Admin uses `AdminTabNav` + `AdminLayout` with navigational `Link`s and `.admin-tabs*` theme classes; the event feed reuses the same classes via `EventFeedViewTabs`. Source brief: `.dev-plan/current-iteration/manual-test-ux-05-profile-account-tabs.md`. Evidence: `.dev-plan/manual-test-profile.png`, `manual-test-profile2.png`.

## Goals / Non-Goals

**Goals:**

- Account destinations are horizontal link tabs with the same interaction/visual pattern as admin.
- Wallet and personal details are separate tab panels/pages; other destinations keep their existing routes.
- Default `/profile` shows the wallet tab; deep links activate the correct tab.
- Stacked Account link card is removed.
- Identity and preference mutations remain SSR form POSTs on dedicated routes.
- Sitemap / `profile.feature` / stories / e2e reflect the tabbed IA.

**Non-Goals:**

- New billing/Stripe flows or GDPR behavior changes beyond information architecture.
- Onboarding wizard or membership page work.
- Client-only tab state / radios / checkboxes for tab selection.
- A second tab design system (colors, new BEM block) — reuse `.admin-tabs*`.
- Partner routes.

## Decisions

1. **Mirror admin tab helpers + nav + layout**
   - **Choice:** Add `apps/web/app/components/profile/profile-tabs.ts`, `ProfileTabNav.tsx`, and `ProfileLayout.tsx` parallel to `admin-tabs.ts` / `AdminTabNav` / `AdminLayout`.
   - **Rationale:** Proven SSR link-tablist pattern; `EventFeedViewTabs` already proved class reuse outside admin.
   - **Alternatives:** Client-side HeroUI Tabs with local state (rejected — SSR-only nav, admin parity); share one generic `LinkTabNav` package component in this step (optional later; YAGNI for now).

2. **Tab ids, order, and paths**
   - **Choice:**
     | Tab id | Path | Label source (reuse / add) |
     |---|---|---|
     | `wallet` | `/:locale/profile` | `walletTitle` |
     | `details` | `/:locale/profile/details` | `identityTitle` |
     | `preferences` | `/:locale/profile/preferences` | `preferencesLink` / vibes title |
     | `billing` | `/:locale/profile/billing` | `billingLink` |
     | `security` | `/:locale/profile/security` | `passwordLink` |
     | `data-export` | `/:locale/profile/data-export` | `dataExportLink` |
     | `delete-account` | `/:locale/profile/delete-account` | `deleteAccountLink` |
     Order: wallet → details → preferences → billing → security → data-export → delete-account.
   - **Rationale:** Matches brief destinations; reuses existing copy keys for labels where possible; short dedicated `tabNavLabel` for `aria-label` on the tablist.
   - **Alternatives:** Keep identity on `/profile` and put wallet elsewhere (rejected — wallet is the natural default home); nest destructive tabs behind a menu (out of scope).

3. **Default `/profile` = wallet; new `/profile/details` for identity**
   - **Choice:** GET `/profile` renders only the wallet card inside `ProfileLayout` with `activeTab="wallet"`. New route `profile/details.tsx` hosts the identity form; move `handleProfileIdentityPost` consumption there so form `action` is `/:locale/profile/details`. Successful save redirects to `/profile/details?saved=identity` (or equivalent). Keep `handleProfileIdentityPost` helper in `profile-route.ts`; only the route module binding moves.
   - **Rationale:** Separates tabs cleanly; avoids dual POST targets; deep link to details works.
   - **Alternatives:** POST identity to `/profile` while GET `/profile` is wallet-only (confusing); redirect `/profile` → `/profile/wallet` (extra path, unnecessary).

4. **`ProfileLayout` owns shared chrome**
   - **Choice:** `ProfileLayout` renders the outer `Surface` (`max-w-7xl`, padding), shared `PageSectionHeader` (account eyebrow + page headline from the active page’s copy), then `ProfileTabNav`, then `children`. Sibling pages drop their own duplicate outer shell / header when wrapped — pass `headline` (and optional page-specific title for `<title>`) from the route.
   - **Rationale:** One place for header + tabs; matches AdminLayout’s job for tabs while keeping step 04 header.
   - **Alternatives:** Each page keeps its own `PageSectionHeader` and only inserts `ProfileTabNav` below (acceptable fallback if headlines differ wildly — still fine; prefer layout ownership to avoid double padding). Billing cancel stays under Billing tab: `inferProfileTab` maps `/profile/billing/*` → `billing`.

5. **Active tab inference**
   - **Choice:** `inferProfileTab(pathname): ProfileTab` like `inferAdminTab` — match longest/most specific path segments (`details`, `preferences`, `billing`, `security`, `data-export`, `delete-account`); default `wallet` for `/profile` and unknown under `/profile`.
   - **Rationale:** Routes can pass `activeTab` explicitly; inference helps cancel and future nested paths.
   - **Alternatives:** Only explicit `activeTab` props (also fine; still implement path helpers).

6. **Overflow on small screens**
   - **Choice:** Reuse `.admin-tabs__track` as-is; if track already scrolls horizontally, keep it. If not, add a layout-only overflow rule scoped to profile (or shared track) — `overflow-x-auto` / nowrap — without new colors. Do not invent a second tab visual system.
   - **Rationale:** Parent guide calls out seven tabs vs admin’s five.
   - **Alternatives:** Two-row tabs or Select dropdown (rejected — breaks admin parity / no radios-checkboxes pattern for primary nav).

7. **Remove Account links card; split `ProfilePage`**
   - **Choice:** Replace monolithic `ProfilePage` with focused presentational pieces (e.g. `ProfileWalletPanel` + `ProfileDetailsPanel`, or slim `ProfilePage` props that only accept wallet vs details). Remove `linksTitle` card and link buttons. Prefer deleting unused link copy keys after grep, or leave unused until cleanup if stories still reference them briefly.
   - **Rationale:** Tabs are the navigation; stacked list is the bug.
   - **Alternatives:** Keep hidden links for SEO (unnecessary — authenticated `noindex` pages).

8. **Docs / e2e**
   - **Choice:** Document `/profile/details` in sitemap; note tabbed IA in `profile.feature`. Update Playwright selectors that clicked stacked Account link button names to use tablink names / `role="tablist"` proximity per BDD contract.
   - **Rationale:** Product SoT is `docs/product/`; openspec delta is historical workflow only.

## Risks / Trade-offs

- **[Risk] Seven tabs overflow on mobile** → Mitigation: horizontal scroll on track; short labels from existing copy; verify at ~375px width.
- **[Risk] Identity POST URL change breaks bookmarks/tests expecting POST `/profile`** → Mitigation: move handler intentionally; update e2e; optional 302 from POST `/profile` to details is unnecessary if nothing external posts there.
- **[Risk] Billing cancel / nested routes show wrong tab** → Mitigation: `inferProfileTab` treats `/profile/billing` prefix as `billing`.
- **[Risk] Duplicate headers if layout + page both render `PageSectionHeader`** → Mitigation: page components inside layout render only panel content (cards/forms).
- **[Trade-off] openspec/specs are not product SoT** → Update `docs/product/` on implement; delta archives with the change.

## Migration Plan

1. Add `profile-tabs.ts`, `ProfileTabNav`, `ProfileLayout`.
2. Add `/profile/details` route; move identity GET/POST UI there; slim `/profile` to wallet.
3. Wrap all account routes (including billing cancel) in `ProfileLayout` with correct `activeTab`.
4. Remove Account links card; update copy/stories/e2e/sitemap/`profile.feature`.
5. Lint, typecheck, manual smoke of every tab + identity/preferences POST.
6. Mark step 05 done in parent guide. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Optional: slightly shorter tab labels (e.g. “Password” vs “Change password”) if overflow is ugly in QA — prefer existing link copy first.
