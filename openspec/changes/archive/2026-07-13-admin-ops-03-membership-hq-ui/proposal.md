## Why

Steps 01–02 shipped Membership HQ domain APIs (`listMembers`, `countMembers`, `getMemberDetail`, capacity helpers), but admins still have no UI to find or inspect members. Phase 8 needs a read-only Membership HQ surface under `/:locale/admin/users` so support can open seed members today and so step 04 can hang mutation CTAs off a real detail page.

## What Changes

- Add a **Users** tab to the admin shell (`admin-tabs.ts`, `AdminTabNav`, i18n copy) pointing at `/:locale/admin/users`
- Add SSR list route `/:locale/admin/users` with search (`q`), optional role filter (`Select`), pagination (`page`), and summary columns (role, subscription status, credits, booking count, event-open count)
- Add SSR detail route `/:locale/admin/users/:id` with summary plus preferences, history counts, and available behavior analytics (empty states when sparse)
- Wire `requireRole(ADMIN)` / existing `guardAdminRoute`, `robots: noindex`, locale in URL
- Reuse `AdminSearchForm`, `AdminPagination`, `AdminPageShell`, and partners list/table patterns; HeroUI-only markup
- Expose forward links from detail to step-04 mutation paths (adjust-credits, freeze, comp-ticket, refund) and document expected hrefs; hide or omit GDPR delete until `gdpr-rights-02`
- **No** mutation form POSTs, waitlist admin list, Playwright, or product-doc edits unless sitemap paths diverge (they should not)

## Capabilities

### New Capabilities

- _(none)_ — Membership HQ remains the existing `admin-users` capability; this step adds the SSR UI layer over shipped domain APIs

### Modified Capabilities

- `admin-users`: Add requirements for ADMIN-only, `noindex` Membership HQ list and detail pages at `/:locale/admin/users` and `/:locale/admin/users/:id` (searchable rows with summary columns; detail with preferences, history, and available behavior fields)

## Impact

- **Code:** `apps/web` only — `admin-tabs.ts`, `AdminTabNav`, `admin-content` copy, new routes under `app/routes/[locale]/admin/users/`, new components under `app/components/admin/` (e.g. `AdminUsersListPage`, `AdminUsersTable`, `AdminUserDetailPage`); Ladle-ready compositions optional/partial (full stories OK in step 05)
- **Packages:** consume existing `@unveiled/db` admin exports (`listMembers`, `countMembers`, `getMemberDetail`); no new domain writers
- **Database:** none
- **Downstream:** Consumed by `admin-ops-04-admin-mutation-pages`, `admin-ops-05-ladle-e2e`, `gdpr-rights-02` (delete link target)
- **Docs:** step plan `.dev-plan/current-iteration/admin-ops-03-membership-hq-ui.md`; mark step 03 done in `admin-ops-parent-guide.md` after apply; no `docs/product/` changes expected
- **Out of scope:** mutation POSTs (step 04); GDPR delete page; Playwright (step 05); `/admin/waitlist` list (step 04); `/admin/users/new`
