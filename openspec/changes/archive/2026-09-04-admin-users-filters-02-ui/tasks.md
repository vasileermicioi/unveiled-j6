## 1. Setup and domain confirm

- [x] 1.1 Read `.dev-plan/current-iteration/07-admin-users-filters-02-ui.md`, the parent guide, and `specs/admin-users/spec.md`, and confirm `MemberSort`/`ListMembersOptions` exist in `packages/db/src/admin/list-members.ts` by grepping for `MemberSort` and verifying each sort key — verify by listing the confirmed keys in the task handoff.
- [x] 1.2 Skim `apps/web/app/routes/[locale]/admin/users/index.tsx`, `AdminUsersListPage.tsx`, `AdminUsersTable.tsx`, `AdminUsersSearchForm.tsx`, and `apps/web/app/lib/admin-list.ts` to record current `q`+`role` wiring — verify by noting the files to touch in the PR description.

## 2. Query plumbing and route wiring

- [x] 2.1 Extend `AdminUsersListQuery` in `apps/web/app/lib/admin-list.ts` with subscription, credits/bookings/eventOpens min/max, createdFrom/createdTo, `sort`/`dir`, plus `isDefaultMemberListSort`, `effectiveMemberListSort`, and `nextMemberColumnSort` following the partners/events pattern — verify with `bun run typecheck` passing for the package boundary.
- [x] 2.2 Extend `parseAdminUsersListQuery`, `buildAdminListQueryString`, and `adminListPageRedirectPath` for all new params (whitelist enums incl. `NONE`, numeric `Number.isFinite` guard, `YYYY-MM-DD` date regex, omit empties/default sort/page-1, preserve filters on clamp) — verify by unit-exercising a round-trip URL (`?subscription=ACTIVE&creditsMin=10&createdFrom=2026-01-01&sort=created&dir=desc&page=2`) through parse→build and confirming identical output.
- [x] 2.3 Add `createdAt` to the `listMembers` select and `MemberListItem` in `packages/db/src/admin/list-members.ts` (select-only, no predicate change) — verify with `bun run typecheck` and a quick `listMembers` call returning a `Date` per row.
- [x] 2.4 Rewire `apps/web/app/routes/[locale]/admin/users/index.tsx` to pass all parsed filters into `countMembers`/`listMembers` (filters + sort/dir + limit/offset) and to build one canonical query string reused for pagination and sort links — verify with `bun run typecheck` and by confirming the rendered page keeps `?subscription=ACTIVE&creditsMin=10` across a pagination link.

## 3. Table rebuild

- [x] 3.1 Rebuild `AdminUsersTable.tsx` with one Member column (display-name `Link` line 1, muted email line 2), Role, Subscription, Credits, Bookings, Event opens, Created (Europe/Berlin date), Actions, using HeroUI `Table` + `admin-table` theme classes only — verify by rendering `/en/admin/users` and confirming merged cells plus Created dates with no raw HTML table elements.
- [x] 3.2 Make every data header a GET sort link built from `nextMemberColumnSort` + `buildAdminListQueryString` (toggle dir, new-column defaults member/role/subscription→asc else desc, `aria-sort`/dir indicator, filters preserved, Actions unsorted) — verify by clicking Member then Created headers and confirming `sort`/`dir` URLs toggle while active filters stay in the query string.

## 4. Filter bar and copy

- [x] 4.1 Extend `AdminUsersSearchForm.tsx` into a single GET filter bar (`q`, role + subscription native selects, three min/max native numbers, created from/to native dates, Search submit + Reset-filters link to the bare list path) threaded through `AdminUsersListPage.tsx` defaults — verify by submitting `?subscription=ACTIVE&creditsMin=10&createdFrom=2026-01-01` and confirming the form re-renders with those values and Reset returns to the default list.
- [x] 4.2 Add DE/EN copy keys in `apps/web/app/lib/admin-content.ts` for the Member/Created headers, sort affordances, subscription options incl. none, numeric/date labels, and reset link — verify by loading `/de/admin/users` and `/en/admin/users` with no missing-copy fallbacks.

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck`, fix all findings — verify both commands exit 0.
- [x] 5.2 Manual smoke on `/en/admin/users`: merged Member cells, Created column, sortable headers, and a filter round-trip (`?subscription=ACTIVE&creditsMin=10&createdFrom=2026-01-01`) that survives pagination and reset with invalid input ignored — verify by recording the observed URLs and row behavior in the handoff.
- [x] 5.3 Prepare a PR/handoff linking change `admin-users-filters-02-ui` and the parent guide, noting the `MemberListItem.createdAt` addition and any story/fixture ripple left for step 03 — verify the PR description lists scope, verification results, and out-of-scope items.
