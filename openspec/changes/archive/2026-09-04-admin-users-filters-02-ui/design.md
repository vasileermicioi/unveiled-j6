## Context

See `proposal.md` (Why) and `specs/admin-users/spec.md` (behavior contract). Current state: `apps/web/app/routes/[locale]/admin/users/index.tsx` threads only `q`+`role` into `listMembers`/`countMembers`; `AdminUsersTable.tsx` renders separate Name/Email columns with no Created column and unsorted headers; `AdminUsersSearchForm.tsx` is a `q`+role GET form; `admin-list.ts` defines `AdminUsersListQuery` as `{q, page, offset, limit, role?}` with no sort support. Step 01 is merged: `@unveiled/db` exposes `ListMembersOptions` (subscription incl. `NONE`, credits/bookings/eventOpens min/max, `createdFrom`/`createdTo` Berlin-day bounds, `sort: MemberSort` + `dir`) with identical list/count predicates, name-asc default, and per-key dir defaults (`member`/`role`/`subscription` → `asc`, rest → `desc`). The `listMembers` select does not yet expose `users.createdAt` per row. Constraints: SSR-only mutations/pages (no client filter/sort JS), HeroUI-only markup with theme CSS, Tailwind layout-only, native-first controls (`select`, `input[type=number|date]`), admin `noindex`, pagination clamp/redirect pattern.

## Goals / Non-Goals

**Goals:**
- Bind every step-01 filter/sort to SSR GET plumbing so filter + sort + pagination compose and survive round-trips.
- Deliver the requested table (merged Member cell, Created column, sortable headers with direction affordance) and single-GET filter bar with reset, entirely server-rendered.
- Keep URL hygiene: omit defaults (empty filters, default name-asc sort, page 1) so canonical links stay short and stable.

**Non-Goals:**
- No domain predicate or ranking changes (step 01 owns semantics; `countMembers`/`listMembers` parity untouched).
- No stories, Playwright, Gherkin, or pagination/search doc sync (step 03).
- No detail-page, mutation, export/CSV, or client-side table library work.

## Decisions

### 1. Extend `admin-list.ts` following the partners/events sort pattern (not a bespoke users scheme)
Add to `AdminUsersListQuery`: `subscription?: SubscriptionStatus | "NONE"`, `creditsMin/Max`, `bookingsMin/Max`, `eventOpensMin/Max` (numbers), `createdFrom/createdTo` (trimmed `YYYY-MM-DD` strings), `sort?: MemberSort`, `dir?: AdminListSortDir`. Add `isDefaultMemberListSort` (omitted sort == name-asc default), `effectiveMemberListSort`, and `nextMemberColumnSort` mirroring `nextPartnerColumnSort`/`nextEventColumnSort` (same column toggles; new column uses member/role/subscription → `asc`, credits/bookings/eventOpens/created → `desc`). Extend `parseAdminUsersListQuery` (trim + whitelist enums via existing `USER_ROLES`-style sets plus a subscription set incl. `NONE`; `Number` parse for ranges with `Number.isFinite` guard, drop `NaN`/negatives only if domain rejects — otherwise pass through and let the domain ignore invalid; date regex `^\d{4}-\d{2}-\d{2}$`, drop malformed, keep `from > to` and let the domain ignore per its invalid-tolerance), `buildAdminListQueryString` (add all new params, omit empties/default sort/page-1), and `adminListPageRedirectPath` (thread new fields so clamping preserves them). Alternative (separate users-specific query builder) rejected: partners/events already establish the `sort`+`dir` + omit-defaults convention and `AdminPagination` consumes `buildAdminListQueryString`.

### 2. Minimal `MemberListItem.createdAt` addition in `@unveiled/db` (select-only, no predicate change)
Add `createdAt: users.createdAt` to the `listMembers` select and `createdAt: Date` to `MemberListItem`. Rationale: the Created column needs a per-row registration date and the column is already sortable domain-side; selecting the existing `users.createdAt` column is additive and does not alter filter/sort semantics. Alternative (second query per page or formatting from `behavior`) rejected: extra round-trip cost and invented data. Ripple is limited to the users list page and its stories/fixtures.

### 3. Route wiring stays thin: parse → count → clamp-redirect → list → render
`index.tsx` calls `parseAdminUsersListQuery`, passes the full filter/sort object to `countMembers` (filters only) and `listMembers` (filters + `sort`/`dir` + `limit`/`offset`), keeps the `adminListPageRedirectPath` clamp, and builds one canonical query string reused for pagination and sort links. No POST, no client fetch. Preserves the existing guard (`guardAdminRoute`), `renderAdminPage` shell, and `?ok=delete-account` flash.

### 4. Table: merged Member cell + Created column + header sort links (HeroUI `Table`, links preserve filters)
Rebuild `AdminUsersTable.tsx` to accept `members`, `locale`, current `sort`/`dir`, and a `sortHref(column)` builder from the page: columns Member (line 1 `Link` with `memberDisplayName`, line 2 muted email), Role, Subscription (`usersNoValue` for null), Credits, Bookings, Event opens (`usersNoValue` for null), Created (Europe/Berlin date via the shared `getBerlinCalendarDate`/`Intl.DateTimeFormat` Europe/Berlin helper used by catalog datetime — date-only, no time), Actions (unsorted). Each data header renders a GET `Link` from `nextMemberColumnSort` + `buildAdminListQueryString` with an `aria-sort` / text dir indicator (e.g. `▲`/`▼` from copy keys, not color alone). Styling via existing `admin-table` theme classes; Tailwind for layout only.

### 5. Filter bar: extend `AdminUsersSearchForm.tsx` into a single GET form with native controls
One `<Form method="get">` keeping `q` (search `Input`), adding native `select` for role (existing `AdminFormSelect`) and subscription (All + 5 statuses + none), native `input[type=number]` for the three min/max pairs (`min=0`, `inputMode=numeric`), native `input[type=date]` for created from/to, Search submit (`button--secondary`) + Reset-filters `Link` to the bare list path. All inputs named to match `parseAdminUsersListQuery`; current values fed as defaults so refresh/sort/pagination preserve state. Server ignores invalid values (no error UI beyond ignoring). Alternative (HeroUI `Select`/`NumberField`/`DatePicker`) rejected per native-first rule §14; exceptions do not apply here.

### 6. Copy keys in `admin-content.ts` (DE/EN), theme untouched unless a token is missing
Add keys for member/created column headers, sort indicators, subscription options incl. none, numeric/date labels, reset link — both locales, matching existing `usersCol*`/`usersRole*` naming. No new CSS unless the dir indicator or two-line member cell needs a theme token; never per-route color/border/shadow classes.

## Risks / Trade-offs

- [Risk] `eventOpenCount` null rows vs. numeric range semantics → Mitigation: rely on step-01 domain behavior (range applies to supplied values; null handling already tested); do not add UI-side filtering.
- [Risk] Berlin-day bounds confusion (`from > to`, partial range, timezone) → Mitigation: pass raw `YYYY-MM-DD` through; domain maps inclusive Berlin days to UTC and ignores inverted/malformed input; UI keeps both fields independent with no client validation.
- [Risk] URL bloat from 10+ filter params → Mitigation: omit empties/defaults in `buildAdminListQueryString`; sort links and pagination reuse the same builder so URLs stay minimal.
- [Risk] NULL subscription sort order surprises → Mitigation: domain default null ordering + deterministic tiebreak (display name, email, id); UI does not special-case it.
- [Risk] `MemberListItem.createdAt` addition ripples to stories/fixtures → Mitigation: additive optional-at-first field if needed for back-compat; update `AdminUsersListPage.stories.tsx` and `e2e/fixtures/admin-users.ts` data in step 02 if they construct items; full story/fixture refresh stays in step 03.
- Trade-off: server-ignored invalid input (no error message) keeps the form simple and matches the spec, at the cost of silent typos — accepted per spec ("ignored without error").

## Migration Plan

No DB migration (no schema change; select-only addition). Deploy as a single route change behind the existing ADMIN guard; `noindex` unchanged. Rollback: revert the change — old `?q`/`?role`/`?page` URLs remain parseable by the extended parser (unknown params ignored, missing params = defaults).

## Open Questions

- None. Dir-indicator glyph choice (`▲/▼` vs. copy-worded "asc/desc") is deferrable and does not change specs, approach, or tasks.
