## Context

See `proposal.md` for motivation. Current state (`packages/db/src/admin/list-members.ts`):

- `ListMembersOptions = { q?, role?, limit?, offset? }`; `countMembers(db, Pick<Options,"q"|"role">)` queries `users` only (no `subscriptions` join), so it cannot filter by subscription.
- `listMembers` selects `subscriptionStatus` via `LEFT JOIN subscriptions`, `bookingCount` via correlated `count(*)` subquery, `eventOpenCount` from `behavior.event_open_count` (null when absent); fixed `ORDER BY display-name, email, id`.
- Established pattern to copy: `eventListFilterConditions` / `eventListOrderBy` in `packages/db/src/catalog/events.ts` (`ListEventsOptions.published`, shared predicates between `listEvents`/`countEvents`), and `sort`+`dir` handling in `apps/web/app/lib/admin-list.ts` (partners/events).
- Reusable Berlin helpers: `berlinInclusiveDateRange(from,to)` in `packages/db/src/catalog/datetime.ts` (inclusive full-day Europe/Berlin range, exclusive end = next Berlin midnight).
- Enum sets: `UserRole` (USER/ADMIN/PARTNER); `SubscriptionStatus` (ACTIVE/CANCELLED_PENDING/INACTIVE/PAST_DUE/UNPAID); NULL subscription (no row) is meaningfully filterable as `NONE`.

Constraints: Booking stays sole booking writer (untouched here); keep soft-delete exclusion; Europe/Berlin day bounds; admin-only server-side (no client `partnerId` trust issue); preserve name-asc default; invalid input ignored, never 500.

## Goals / Non-Goals

**Goals:**

- Extend `ListMembersOptions` with `subscription`, numeric ranges, created range, `MemberSort`+`dir`, with identical predicates in list and count.
- Deterministic sort for every column in both directions, preserving the existing default.
- Integration tests proving each filter, each sort dir, combined filter+sort+pagination, list/count parity, invalid-input tolerance.

**Non-Goals:**

- Any SSR/UI change (step 02 owns merged member column, headers, filter form, `admin-list.ts` query plumbing, reset).
- New `MemberListItem` columns beyond what exists (`createdAt` is already on `users` and selectable; no new analytics).
- Changing the default sort to created-desc (partners/events convention explicitly not adopted here).

## Decisions

1. **Options shape mirrors the step brief (`sort`+`dir`, not `desc`)**
   - **Choice:** `subscription?: SubscriptionStatus | "NONE"`, `creditsMin/creditsMax?: number`, `bookingsMin/bookingsMax?: number`, `eventOpensMin/eventOpensMax?: number`, `createdFrom/createdTo?: string | Date`, `sort?: MemberSort` (`member|role|subscription|credits|bookings|eventOpens|created`), `dir?: "asc"|"desc"`. `countMembers` widens its `Pick<>` to the full filter subset (not limit/offset/sort).
   - **Rationale:** Step brief and `admin-list.ts` URL convention use `sort`+`dir`; keeps step-02 plumbing trivial. Internal `events.ts` uses `desc: boolean` — mapping `dir === "desc"` at the order-by boundary avoids churning the member API to match events internals.
   - **Alternatives:** `desc: boolean` like `ListEventsOptions` (rejected — diverges from brief and URL params).

2. **Single shared predicate builder (parity by construction)**
   - **Choice:** Extract `memberListFilterConditions(options): SQL[]` (search + role + subscription + ranges + created) called by both `listMembers` and `countMembers`, mirroring `eventListFilterConditions`. `countMembers` gains the same `LEFT JOIN subscriptions` as the list query so subscription predicates apply identically.
   - **Rationale:** Parent-guide risk #1: `countMembers`/`listMembers` drift breaks pagination. Shared builder makes drift a compile-time shape, not review discipline.
   - **Alternatives:** Duplicate predicates in each function (rejected — the exact drift the parent guide warns about).

3. **Subscription filter with explicit `NONE`**
   - **Choice:** Known status → `eq(subscriptions.status, value)`; `"NONE"` → `isNull(subscriptions.userId)` (no subscription row). Unknown enum string → predicate omitted (invalid-input tolerance). NULL statuses sort deterministically (e.g. `NULLS LAST` on asc / `NULLS FIRST` on desc, or `coalesce` to a sentinel — pick one and test both dirs).
   - **Rationale:** NULL is a real admin cohort (never-subscribed / row deleted); `isNull(left-join key)` is the standard pattern.
   - **Alternatives:** `isNull(subscriptions.status)` (equivalent but key-null is clearer for LEFT JOIN); omitting `NONE` (rejected — brief requires it).

4. **Numeric ranges as SQL-level predicates on select expressions**
   - **Choice:** Credits → `gte/lte(users.credits)`. Bookings → reuse the correlated `coalesce((select count(*)::int …),0)` expression in both `WHERE` and `ORDER BY`. Event opens → `coalesce((behavior->>'event_open_count')::int, 0)` for filtering/sorting so members without the key count as 0; non-numeric JSON values fall back to the same coalesce (never throw). Min-only / max-only are open-ended; `min > max` → ignore the pair (or the offending bound) rather than returning empty or throwing.
   - **Rationale:** Ranges must compose with pagination, so post-fetch filtering is not an option; reusing the select expression keeps filter and sort semantics identical.
   - **Alternatives:** Post-fetch filter (rejected — breaks limit/offset/count); strict `min<=max` error (rejected — spec says ignore invalid).

5. **Created range via Berlin calendar-day bounds**
   - **Choice:** Reuse `berlinInclusiveDateRange(createdFrom, createdTo)` → `{ start, end }` → `gte(users.createdAt, start)` + `lt(users.createdAt, end)`. Accept `YYYY-MM-DD` strings (step-02 date inputs) and `Date`s. Unparsable value or `from > to` (string compare on normalized YMD, or start > end) → omit the created predicate. Single-bound ranges allowed.
   - **Rationale:** AGENTS.md mandates Europe/Berlin date logic; the helper already encodes CET/CEST midnight search and is covered by `datetime.test.ts`.
   - **Alternatives:** Raw UTC comparison of input dates (rejected — off-by-one for Berlin evenings); new local helper (rejected — duplication).

6. **Sort mapping with stable tiebreaks, default preserved**
   - **Choice:** `memberListOrderBy(sort, dir)` mirroring `eventListOrderBy`: omitted/unknown sort → `[asc(displayNameExpr), asc(email), asc(id)]`. `created` → `users.createdAt`; `role` → `users.role`; `subscription` → `subscriptions.status`; `credits` → `users.credits`; `bookings`/`eventOpens` → their select expressions; then `asc(displayNameExpr), asc(email), asc(id)` (or `id` at minimum) as tiebreak regardless of direction. `dir` defaults to the column sensible default when `sort` is set without `dir` (`member/role/subscription` → asc; `credits/bookings/eventOpens/created` → desc) — document the chosen rule in code; unknown `dir` → default.
   - **Rationale:** Deterministic order is required for pagination stability; keeping name-asc default avoids churning existing tests (parent-guide open question resolved as "keep").
   - **Alternatives:** Switch default to created-desc like partners/events (rejected — churns existing `listMembers` test expecting `[userB, userA]` name order).

7. **Invalid-input tolerance, validation-light domain**
   - **Choice:** Whitelist enums (`UserRole`, `SubscriptionStatus+N ONE`, `MemberSort`, `dir`); `Number.isFinite` checks on range bounds (non-finite → omit); try/catch around `berlinInclusiveDateRange` (throw → omit predicate). Never throw for filter/sort shape problems; limit/offset clamping stays as-is.
   - **Rationale:** Spec scenario "Invalid filter input is ignored"; admin list URLs are user-editable, so a bad `?creditsMin=abc` must not 500.

## Risks / Trade-offs

- **[Risk] `countMembers` LEFT JOIN changes its query shape** → Mitigation: join is read-only, no new rows (one subscription row per user); parity tests assert list length vs count on every filter.
- **[Risk] Event-open coalesce-to-0 vs null semantics** → Mitigation: document `COALESCE(...,0)` choice; tests cover a member with `{}` behavior inside and outside a `0..N` range so step-02 filter labels match.
- **[Risk] Booking-count subquery in WHERE is slower on large tables** → Mitigation: acceptable for admin HQ page size 25; same pattern already used in select; no new index in this step (note as follow-up if EXPLAIN shows pain).
- **[Risk] `dir`-without-`sort` or `sort`-without-`dir`** → Mitigation: `dir` ignored when `sort` omitted; `sort` without `dir` uses the per-column default above; both covered by tests.
- **[Trade-off] Shared expression strings vs Drizzle composability** → Prefer extracting the booking-count and event-open SQL fragments as `const`s reused in select/where/orderBy rather than rebuilding inline three times.

## Migration Plan

1. Extend types + predicate builder + order-by + wire into list/count; extend `countMembers` join.
2. Add integration tests (per filter, per sort dir, combined + parity, invalid tolerance); run `bun run lint`, `bun run typecheck`, `bun test packages/db/src/admin`.
3. Handoff to `admin-users-filters-02-ui` (SSR plumbing consumes `MemberSort`/`dir` verbatim). Rollback: revert single-file domain change + tests (no migration, no schema change).

## Open Questions

- None blocking. Default-sort confirmation (keep name-asc) is recorded here as the decision; flag in review if product wants created-desc alignment instead.
