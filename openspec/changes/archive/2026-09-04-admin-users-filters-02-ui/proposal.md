## Why

Membership HQ at `/:locale/admin/users` is unworkable at scale: admins see separate Name/Email columns, no registration date, fixed name-asc ordering, and only `q`+`role` filters, while step 01 (`admin-users-filters-01-domain`) already provides subscription, numeric-range, date-range, and sort backing in `listMembers`/`countMembers` with no UI to reach it.

## What Changes

- Merge Name+Email into one Member column (line 1: display-name link to `/:locale/admin/users/:id`; line 2: email, muted) and add a Created column rendering `users.createdAt` as a Europe/Berlin calendar date.
- Make every data column header a sortable SSR link (toggle direction; new column defaults: member/role/subscription → `asc`, credits/bookings/event-opens/created → `desc`) that preserves all active filters; Actions stays unsorted.
- Replace the `q`+`role`-only form with a single SSR GET filter bar: `q`, role dropdown, subscription dropdown (All + ACTIVE/CANCELLED_PENDING/INACTIVE/PAST_DUE/UNPAID + none), credits/bookings/event-opens min/max native numbers, created from/to native dates, Search submit + Reset-filters link.
- Extend `parseAdminUsersListQuery` / `buildAdminListQueryString` / `adminListPageRedirectPath` and route wiring in `apps/web/app/routes/[locale]/admin/users/index.tsx` to thread all new params into `listMembers`/`countMembers`; invalid values ignored server-side, filters preserved across sort and pagination.
- Add DE/EN copy keys for the new column, sort affordances, and filter controls.

## Capabilities

### New Capabilities

- None — UI binds to the domain capability shipped in step 01.

### Modified Capabilities

- `admin-users`: Membership HQ table layout and controls — merged Member column, Created column, sortable headers, and full SSR GET filter bar (subscription, numeric ranges, date range, reset) with filter/sort/pagination composition.

## Impact

- Affected code: `apps/web/app/routes/[locale]/admin/users/index.tsx`, `apps/web/app/components/admin/AdminUsersTable.tsx`, `AdminUsersListPage.tsx`, `AdminUsersSearchForm.tsx` (extended into full filter bar), `apps/web/app/lib/admin-list.ts` (`AdminUsersListQuery`, parse/build/redirect helpers), `apps/web/app/lib/admin-content.ts` (+ DE/EN keys), `globals.css` theme tweaks only if needed.
- SSR-only, no client filter/sort JS; HeroUI-only markup with native `select`/`input[type=number]`/`input[type=date]` per native-first rule; Tailwind layout-only; admin `noindex` and pagination clamp/redirect unchanged.
- Out of scope: domain predicate changes (step 01), stories/e2e/docs (step 03), detail-page or mutation changes.
