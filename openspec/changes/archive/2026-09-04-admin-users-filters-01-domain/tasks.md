## 1. Setup

- [x] 1.1 Read the step brief, parent guide, `list-members.ts`, `admin-members.integration.test.ts`, events `eventListFilterConditions`/`eventListOrderBy`, and `berlinInclusiveDateRange`, and confirm the name-asc default stays — verify by noting the existing `[userB, userA]` order assertion to preserve
- [x] 1.2 Confirm test DB availability for `bun test packages/db/src/admin` (DATABASE_URL set, tests skip cleanly when unset) — verify with a dry `bun test packages/db/src/admin` run before changes

## 2. Domain filters and sort

- [x] 2.1 Extend `ListMembersOptions` with `subscription`, `creditsMin/Max`, `bookingsMin/Max`, `eventOpensMin/Max`, `createdFrom/To`, `sort: MemberSort`, `dir`, and widen `countMembers` filter pick — verify `bun run typecheck` passes on the new types
- [x] 2.2 Extract shared `memberListFilterConditions` (search, role, subscription incl. NONE via `isNull`, numeric ranges via SQL expressions, created via `berlinInclusiveDateRange` with invalid-input omit) and call it from both `listMembers` and `countMembers` (adding the `LEFT JOIN subscriptions` to count) — verify list and count return identical totals on an unfiltered query
- [x] 2.3 Add `memberListOrderBy` covering `member | role | subscription | credits | bookings | eventOpens | created` in both dirs with deterministic tiebreaks and name-asc default when `sort` is omitted/unknown — verify default order matches the pre-change `[display-name, email, id]` sequence

## 3. Integration tests

- [x] 3.1 Add per-filter cases (subscription incl. NONE, credits/bookings/event-opens ranges, created Berlin-day range) each asserting list rows match and `countMembers` parity — verify new cases pass with `bun test packages/db/src/admin`
- [x] 3.2 Add per-sort-key cases in both dirs plus a combined filter+sort+pagination case — verify ordering assertions and page slices pass with `bun test packages/db/src/admin`
- [x] 3.3 Add invalid-input tolerance cases (unknown enum/sort, malformed date, inverted range, non-numeric bound → ignored, no throw) — verify cases pass with `bun test packages/db/src/admin`

## 4. Verification

- [x] 4.1 Run `bun run lint` — exits 0
- [x] 4.2 Run `bun run typecheck` — exits 0
- [x] 4.3 Run `bun test packages/db/src/admin` — exits 0 with new filter/sort/parity cases green without external services beyond the test DB
