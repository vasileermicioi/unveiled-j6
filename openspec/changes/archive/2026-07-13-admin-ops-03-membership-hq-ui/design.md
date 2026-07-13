## Context

Steps 01–02 shipped Membership HQ domain APIs in `@unveiled/db` (`listMembers`, `countMembers`, `getMemberDetail`) and capacity helpers. Admin shell already has Overview / Partners / Events tabs, `renderAdminPage` (always `robots: noindex`), `guardAdminRoute`, and list patterns (`AdminSearchForm`, `AdminPagination`, partners/events list pages).

This is Phase 8 step 03 (`admin-ops-03-membership-hq-ui`): read-only SSR UI only. Product SoT: `docs/product/features/admin-users.feature` (list/search/summary/detail), `docs/product/sitemap/sitemap.md` (`/admin/users`, `/admin/users/:id`), pagination defaults in `extras/pagination-and-search.md` (page size 25). Feature language about “expand a row” maps to a dedicated detail page (SSR-only; no client expand panel).

## Goals / Non-Goals

**Goals:**

- Users tab in admin shell → `/:locale/admin/users`.
- List page: search (`q`), optional role filter (`Select`), pagination (`page`), summary columns per feature.
- Detail page: member summary + preferences + history counts + available behavior fields; empty states when sparse.
- ADMIN guard + `noindex` + locale in URL via existing admin helpers.
- Document expected mutation hrefs on detail for step 04; link those paths now (404 until 04 is OK).
- HeroUI-only markup; theme tokens; Tailwind layout only; reuse partners list patterns.

**Non-Goals:**

- Mutation form POST pages (step 04).
- Waitlist admin list / booking cancel UI (step 04).
- GDPR delete-account page or link (→ `gdpr-rights-02`).
- Playwright e2e (step 05); full Ladle story polish may finish in step 05.
- New domain APIs or schema changes.
- `/admin/users/new`.

## Decisions

### 1. Mirror partners list route + page composition

```
apps/web/app/routes/[locale]/admin/users/index.tsx
apps/web/app/routes/[locale]/admin/users/[id].tsx
apps/web/app/components/admin/
  admin-tabs.ts              # add "users"
  AdminTabNav.tsx            # Users tab
  AdminUsersListPage.tsx
  AdminUsersTable.tsx
  AdminUserDetailPage.tsx
  AdminUsersSearchForm.tsx   # optional: q + role Select (GET)
```

Routes: `guardAdminRoute` → `parseAdminListQuery` (+ role) → `countMembers` / `listMembers` or `getMemberDetail` → `renderAdminPage` with `AdminUsersListPage` / `AdminUserDetailPage`.

**Rationale:** Partners list is the proven pattern for admin SSR list + search + pagination; Membership HQ should not invent a second admin list stack.

**Alternatives:** Client-side table with expand rows — rejected (SSR-only mutations/pages; feature “expand” = detail route). New island for list fetch — rejected (no client-only fetch for list).

### 2. Tab wiring and path helpers

Extend `AdminTab`:

```ts
export type AdminTab = "overview" | "partners" | "events" | "users";
export const ADMIN_TAB_ORDER: AdminTab[] = ["overview", "partners", "events", "users"];
```

Add `adminUsersPath(locale)` → `localizedPath(locale, "admin/users")`. Update `inferAdminTab` to treat `/admin/users` as `users` (check before overview fallback). Add `tabUsers`, list/detail titles/subtitles, column labels, empty-state copy to `admin-content.ts` (de + en).

**Rationale:** `inferAdminTab` already drives `AdminLayout` via `renderAdminPage`; pathname-based inference keeps tab highlight free of per-route props.

### 3. Search and role filter

- Reuse GET `q` + `page` via `parseAdminListQuery` / `buildAdminListQueryString` / `adminListPageRedirectPath` (page size 25).
- Domain already filters `role` separately from `q` (name/email only). Add optional `role` query param (`USER` | `ADMIN` | `PARTNER` | empty = all).
- Prefer a small `AdminUsersSearchForm` (or extend search form with an optional role `Select` slot) so role is submitted with `q` and preserved in pagination links. Use HeroUI `Select` — no radios/checkboxes.
- Typing a role string into `q` alone does **not** filter by role (domain contract); the Select is the role search UX.

**Alternatives:** Only `q` without role Select — incomplete vs feature “search by … role”. Client filter over full list — rejected (server-side pagination).

Extend `buildAdminListQueryString` (or a users-specific wrapper) to optionally include `role` so pagination/search round-trips keep the filter.

### 4. List row summary and navigation

Each row shows: display name (or email fallback), email, role, subscription status (or empty), credits, booking count, event-open count (`MemberListItem.eventOpenCount`, may be null → show “—” / empty).

Row primary action: Link to `/:locale/admin/users/:id` (not in-place expand).

### 5. Detail page sections

Load `getMemberDetail(db, id)`. On `AdminMemberError` `USER_NOT_FOUND` (or soft-deleted) → 404.

Layout sections (HeroUI `Card` / `Heading` / `Paragraph` / chips as needed):

1. **Summary** — name, email, role, credits, subscription status/plan when present.
2. **Preferences** — from `user.profile`: interests, moods, districts, timing, preferred_days, preferred_languages, age_group, max_distance (radius), accessibility. Empty/missing → empty-state copy.
3. **History** — counts: bookings, waitlist entries, saved events; plus `behavior.session_count` when present.
4. **Behavior** — render available `user.behavior` fields only (event opens, filter applies, saves/unsaves, last view/seen, last booked/waitlisted, recent_event_ids, etc.). Do **not** invent metrics; empty section when sparse.

### 6. Forward mutation CTAs (stub links)

On detail, show secondary/primary Links to paths that step 04 will implement:

| Action | Href |
|---|---|
| Adjust credits | `/:locale/admin/users/:id/adjust-credits` |
| Freeze / unfreeze | `/:locale/admin/users/:id/freeze` |
| Comp ticket | `/:locale/admin/users/:id/comp-ticket` |
| Manual refund | `/:locale/admin/users/:id/refund` |

**Do not** link `.../delete-account` until `gdpr-rights-02`. Accept temporary 404 on mutation paths until step 04 merges — prefer real future paths over fake placeholders.

**Alternatives:** Hide CTAs until 04 — also acceptable per step plan; linking is preferred so 04 only wires POST handlers and forms.

### 7. Ladle

Add minimal stories for `AdminUsersListPage` / `AdminUserDetailPage` with fixtures (mock `MemberListItem` / detail props), mirroring partners stories. Full story polish and Playwright deferred to step 05.

## Risks / Trade-offs

- **[Mutation links 404 until step 04]** → Acceptable per step plan; document hrefs in component comments / this design; do not invent interim POST handlers.
- **[Sparse behavior analytics]** → Empty states only; never fabricate counts (parent guide risk).
- **[Feature “expand row” vs dedicated page]** → Dedicated `/admin/users/:id` matches sitemap and SSR rules; e2e in step 05 should assert detail page, not accordion expand.
- **[Role not in free-text `q`]** → Mitigated with Select filter; document in search placeholder/help copy if needed.
- **[Admin users in list]** → Domain returns all non-deleted roles; admins can see ADMIN rows — matches feature “all member accounts” / role search; no special exclusion.

## Migration Plan

1. Extend tabs + copy + path helpers.
2. Add list/detail components and routes.
3. Wire search/role/pagination to `listMembers` / `countMembers` / `getMemberDetail`.
4. Add stub mutation Links + optional Ladle stories.
5. Run `bun run lint` and `bun run typecheck`.
6. Manual: admin sign-in → `/en/admin/users` lists seed users; open detail.
7. Mark step 03 done in `admin-ops-parent-guide.md`. No DB migration; rollback = remove routes/tab.

## Open Questions

- None blocking. If copy wants Membership HQ vs Users as tab label, default to “Users” / “Mitglieder” aligned with partners/events naming; subtitle can say Membership HQ.
