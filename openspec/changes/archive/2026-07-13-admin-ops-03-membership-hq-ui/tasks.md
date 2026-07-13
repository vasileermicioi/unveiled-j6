## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/admin-ops-03-membership-hq-ui.md`, parent guide, and this change’s proposal/design/specs
- [x] 1.2 Confirm `@unveiled/db` exports `listMembers`, `countMembers`, `getMemberDetail` and skim partners list route/components (`AdminPartnersListPage`, `AdminSearchForm`, `AdminPagination`, `renderAdminPage`)

## 2. Admin shell — Users tab

- [x] 2.1 Extend `AdminTab` / `ADMIN_TAB_ORDER` / `adminUsersPath` / `inferAdminTab` in `admin-tabs.ts` for `users` → `/admin/users`
- [x] 2.2 Wire Users tab in `AdminTabNav` and re-export path helper from `AdminPageShell` if partners/events are exported there
- [x] 2.3 Add de/en Membership HQ copy in `admin-content.ts` (tab label, list/detail titles, column labels, empty states, search/role labels, mutation CTA labels)

## 3. Members list UI

- [x] 3.1 Add list helpers for optional `role` query param (parse + preserve in pagination query string alongside `q`/`page`)
- [x] 3.2 Build `AdminUsersSearchForm` (GET `q` + HeroUI `Select` for role; no radio/checkbox) and `AdminUsersTable` with summary columns and detail links
- [x] 3.3 Build `AdminUsersListPage` composing search, table, and `AdminPagination`
- [x] 3.4 Add route `apps/web/app/routes/[locale]/admin/users/index.tsx` — `guardAdminRoute`, `countMembers`/`listMembers`, page clamp redirect, `renderAdminPage` (`noindex`)

## 4. Member detail UI

- [x] 4.1 Build `AdminUserDetailPage` with summary, preferences, history, and behavior sections (empty states when sparse; no invented metrics)
- [x] 4.2 Add stub Links to `adjust-credits`, `freeze`, `comp-ticket`, and `refund` under `/:locale/admin/users/:id/…`; do not link delete-account
- [x] 4.3 Add route `apps/web/app/routes/[locale]/admin/users/[id].tsx` — ADMIN guard, `getMemberDetail`, 404 on not found/deleted, `renderAdminPage` (`noindex`)

## 5. Ladle (minimal)

- [x] 5.1 Add fixtures + stories for `AdminUsersListPage` and `AdminUserDetailPage` (full polish OK to finish in step 05)

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.2 Spot-check locally: admin → `/en/admin/users` lists seed users; search/sort; detail loads preferences/history/behavior sections
- [x] 6.3 Mark step 03 done in `admin-ops-parent-guide.md`; note mutation hrefs for step 04; no `docs/product/` edits unless sitemap paths diverged
