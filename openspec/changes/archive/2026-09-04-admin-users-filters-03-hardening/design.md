## Context

See `proposal.md` (Why) and `specs/{admin-users,bdd-and-e2e}/spec.md` (release contract). Step 02 is merged: `/:locale/admin/users` renders one merged Member column (display-name link line 1, muted email line 2), Created column (`users.createdAt` as Europe/Berlin calendar date), sortable SSR header links (same-column toggles; new-column defaults member/role/subscription → `asc`, credits/bookings/event-opens/created → `desc`, filters preserved), and a single SSR GET filter bar (`q`, role + subscription native selects incl. `NONE`, three min/max native numbers, created from/to native dates, Search + Reset link) threaded through `parseAdminUsersListQuery` / `buildAdminListQueryString` / `adminListPageRedirectPath` into `listMembers`/`countMembers`.

What is stale: `AdminUsersListPage.stories.tsx` only exports `Default`/`Empty` (single `mockMemberListItem`, old `mockAdminListQuery` shaped `{q, page, limit}`); `mockMemberListItem` already carries `createdAt: storyNow` but has no empty-date / sorted / filtered variants; `e2e/specs/admin-users.spec.ts` only covers List/Search/summary/detail/mutations with `searchMembers(page, email)` helper — no merged-cell, Created, sort, per-column-filter, composition, or reset assertions; `docs/product/features/admin-users.feature` still describes "sorted by name, then email" + "search by name, email, or role" only; `docs/product/extras/pagination-and-search.md` §2–§3 still rows `q`-only users search with page size 25; `docs/product/testing/coverage-matrix.md` + `e2e/README.md` have no filter/sort rows. Constraints: BDD proximity/layout selectors only; no silent skips (named `DATABASE_URL` / `E2E_ADMIN_*` env-skips only); admin pages stay `noindex`; HeroUI-only story markup; Tailwind layout-only.

## Goals / Non-Goals

**Goals:**
- Ladle stories that pin the shipped filter table (merged cell, Created set/empty, sorted states, filtered + filtered-empty states, DE+EN) so visual regressions fail fast via `bun run stories`.
- Playwright scenarios in `admin-users.spec.ts` with verbatim Gherkin titles + proximity selectors that prove merged display, Created presence, sort round-trips, each filter family, filter+sort+pagination composition, and reset.
- Canonical docs (`admin-users.feature`, pagination-and-search, coverage matrix, `e2e/README.md`) describing exactly what ships, with every touched Scenario mapped to a Playwright title or a named env-skip.

**Non-Goals:**
- No domain predicate, sort-semantic, or table-layout changes (steps 01/02 own them; stories/e2e assert current behavior).
- No new fixtures harness, seed pipeline, or unrelated admin-tab coverage.
- No copy redesign or new theme tokens (stories reuse shipped `admin-content.ts` DE/EN keys + `admin-table` theme classes).

## Decisions

### 1. Stories: extend `AdminUsersListPage.stories.tsx` + minimal fixture deltas, not a new story harness

Follow the existing `AdminUsersListPage` + `mockMemberListItem` / `mockAdminListQuery` pattern (same as `DiscoverPage.stories.tsx` locale convention via `storyLocale` / `getPageContent`-style locale prop):

- Keep `Default`/`Empty`; add `MergedCell` (2–3 members with distinct names/emails to show name-link line 1 + muted email line 2), `CreatedDates` (one row with `createdAt: storyNow`, one with far-past date, one with `createdAt: null`/epoch-empty to pin the empty-state rendering the table actually ships), `SortedStates` (same rows rendered with `query={{...q, sort: "created", dir: "desc"}}` vs `sort: "member", dir: "asc"}` to pin header `aria-sort`/indicator), `Filtered` (query with `subscription: "ACTIVE", creditsMin: 10` + 1 matching + note), `FilteredEmpty` (query matching zero rows → empty-state card), each parameterized or duplicated for `de`/`en` via the file's existing locale idiom.
- Fixture delta is additive only: extend `mockAdminListQuery` shape to the shipped `AdminUsersListQuery` (add `subscription`, `creditsMin/Max`, `bookingsMin/Max`, `eventOpensMin/Max`, `createdFrom/CreatedTo`, `sort`/`dir` defaults) and add 1–2 `mockMemberListItem` variants (second member, empty-Created member) without changing the existing export's identity. Alternative (new story-only types) rejected: stories must track the real `MemberListItem` / `AdminUsersListQuery` so type drift fails at `typecheck`.
- Verify with `bun run stories` build + visual check of merged cells / Created dates / sort indicators in both locales.

### 2. Playwright: extend `admin-users.spec.ts` in place with verbatim titles + region-scoped proximity selectors

Edit `e2e/specs/admin-users.spec.ts` only (plus `e2e/fixtures/admin-users.ts` helpers if a `filterMembers` / `sortByColumn` helper avoids triplication — no new fixture file):

- New tests mirror the exact Gherkin titles added to `admin-users.feature` (e.g. `Scenario: Member rows show combined name and email`, `Scenario: Created column shows registration date`, `Scenario: Sort members via header links`, `Scenario: Filter members by subscription / numeric range / created range`, `Scenario: Sort and filter compose through pagination`, `Scenario: Reset filters`). Titles are verbatim — the coverage-matrix check greps them.
- Selectors are `getByRole("table")` / `getByRole("columnheader")` / `getByRole("row")` + `getByLabel` for `q`/selects/numbers/dates + `getByRole("link", {name: /sort|…/i})` for headers, scoped to the table region (`table.filter({hasText})`, `row.filter({hasText: email})` idiom already in the file). No CSS-class hooks, no bare `input[name=…]` for labeled fields. Sort round-trip: click Created header → assert `sort=created` URL + row reorder; click again → `dir` toggles; assert `q`/filter params survive in the URL. Filter round-trips: fill subscription select / numeric min-max / date from-to via accessible labels → submit Search → assert URL params + single matching row + count text; pagination composition: with a filter + sort active, follow page-2 link and assert params persist; reset: click Reset-filters link → assert bare list URL + default name-asc order.
- Env gating follows the file's existing `beforeEach` (`test.skip(!hasDatabaseUrl())`, `test.skip(!hasAdminCredentials())` with those exact reason strings); no other `test.skip` — flakes are fixed, not silently skipped. Seed via existing helpers (`onboardFreshMember`, `activateMemberForBooking`) so filters have deterministic rows; prefer narrowing by unique `q` + one filter dimension per test to avoid cross-test seed interference.
- Alternative (separate `admin-users-filters.spec.ts`) rejected: the `bdd-and-e2e` contract maps one feature file to one spec file, and the matrix already points `admin-users.feature` at `admin-users.spec.ts`.

### 3. Docs: single-pass sync of Gherkin + pagination extras + matrix + README

- `docs/product/features/admin-users.feature`: extend `List all members` (merged Member column + Created date + default name-asc) and `Search members` (full filter bar: `q`, role, subscription incl. none, three numeric ranges, created range, reset) or add the narrow filter/sort scenarios the Playwright titles quote — whichever keeps titles stable for existing passing tests; new titles match Playwright `test()` strings character-for-character.
- `docs/product/extras/pagination-and-search.md`: update §2 param table (add `subscription`, `creditsMin/Max`, `bookingsMin/Max`, `eventOpensMin/Max`, `createdFrom/CreatedTo`, `sort`/`dir` for `/admin/users`; keep page size 25 unchanged) and §3 users row (server-side `ILIKE` for `q` + enum/range/date predicates + stable default sort with `id` tiebreak; invalid input ignored without error).
- `docs/product/testing/coverage-matrix.md`: add/refresh `admin-users.feature` rows for merged display, Created, sort, each filter family, composition, reset — each pointing at the new Playwright title with `pass` or named env `skip` (`DATABASE_URL` / `E2E_ADMIN_*`); delete or mark removed any row describing the old two-column unsorted table (never leave it as `pass`).
- `e2e/README.md`: update the `admin-users.spec.ts` inventory line + env-prerequisite note (filter/sort scenarios need seeded members + admin session; same `DATABASE_URL` / `E2E_ADMIN_*` gate, no new env var).
- Verify with `rg` that every touched Gherkin Scenario has a same-titled Playwright test and a matrix row, and that `admin-users.feature` no longer claims `q`+`role`-only filtering.

## Risks / Trade-offs

- [Risk] Seed interference makes range/date assertions flaky (other members fall inside the range) → Mitigation: scope each filter test with a unique `q` (fresh onboarded email prefix) plus one filter dimension, and assert row-count == 1 for the seeded member rather than exact global ordering.
- [Risk] Date-boundary flakes (Europe/Berlin vs UTC) → Mitigation: use wide-open ranges (`createdFrom` = today-30d, `createdTo` = today+1d) for positive assertions and far-past/future ranges for empty-state; never assert exact midnight conversion in e2e (domain unit tests own Berlin-day bounds).
- [Risk] Story fixture drift from shipped `AdminUsersListQuery` → Mitigation: type stories against the real query/item types so `bun run typecheck` fails on drift; keep fixture edits additive.
- [Risk] Verbatim-title drift between `.feature` and spec → Mitigation: final `rg "Scenario:"` cross-check across `admin-users.feature`, `admin-users.spec.ts`, and `coverage-matrix.md` before handoff.
- Trade-off: e2e suite runtime grows (6–8 new scenarios, each onboarding a member) — accepted; reuses existing seed helpers and the file's existing env-gate so CI without creds stays fast.

## Migration Plan

No schema, domain, or route changes — stories + e2e + docs only. Merge, staging deploy, run `bun run lint`, `bun run typecheck`, `bun run test:e2e -- e2e/specs/admin-users.spec.ts` (in-scope scenarios pass or named env-skips only). Rollback is a plain revert. On merge, mark `admin-users-filters-03-hardening` done in `05-admin-users-filters-parent-guide.md`, closing `admin-users-filters`.

## Open Questions

- None. Exact new Gherkin titles and story export names are resolved at implementation time from the shipped table copy and Ladle conventions without changing specs, approach, or tasks.
