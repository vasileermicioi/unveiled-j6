## Why

Admins on Membership HQ (`/:locale/admin/users`) can only filter by `q` and `role` with a fixed name-asc order, so working a large member base (find high-credit / lapsed / recent signups, sort by bookings or registration) requires manual scanning. Step 01 of `admin-users-filters` unblocks per-column filters and sortable headers by giving `listMembers`/`countMembers` full domain backing first.

## What Changes

- Extend `ListMembersOptions` with `subscription` (`SubscriptionStatus | "NONE"`), `creditsMin/creditsMax`, `bookingsMin/bookingsMax`, `eventOpensMin/eventOpensMax`, `createdFrom/createdTo`, `sort` (`MemberSort`: `member | role | subscription | credits | bookings | eventOpens | created`), `dir` (`asc | desc`); thread identical predicates through `countMembers`.
- Sorting: `member` = display-name/email/id tiebreak kept as default when `sort` omitted; `created` = `users.createdAt`; aggregate sorts reuse their select expressions; NULL subscription sorts deterministically.
- Invalid filter/sort input is ignored (no throw); soft-delete exclusion preserved; created range uses Europe/Berlin day bounds.
- Package integration tests: each new filter, each sort key in both dirs, combined filter+sort+pagination, list/count parity.
- Out of scope: any SSR/UI changes (step 02); query-string parsing additions (step 02 extends `admin-list.ts` against this domain); new `MemberListItem` columns beyond what exists.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-users`: `listMembers`/`countMembers` SHALL filter by subscription status (including no-subscription), credit range, booking-count range, event-open-count range, and registration date range, and SHALL sort by member, role, subscription, credits, bookings, event opens, or registration date in either direction with stable default; list and count SHALL apply identical predicates.

## Impact

- **DB domain (`packages/db`):** `packages/db/src/admin/list-members.ts` (`ListMembersOptions`, `MemberSort`, `listMembers`, `countMembers`); `packages/db/src/admin/admin-members.integration.test.ts` + new filter/sort/parity cases.
- **Pattern reused:** `AdminPartnersListQuery`/`AdminEventsListQuery` sort+dir handling in `apps/web/app/lib/admin-list.ts`; `ListEventsOptions.published` / `eventListFilterConditions` predicate threading.
- **Not touched:** SSR routes/pages, `admin-list.ts` query parsing (step 02 consumer `admin-users-filters-02-ui`), booking writes (Booking stays sole writer), schema/migrations (uses existing `users.createdAt`, `subscriptions.status`, `behavior.event_open_count`).
- **Source brief:** `.dev-plan/current-iteration/06-admin-users-filters-01-domain.md`
- **Parent:** `.dev-plan/current-iteration/05-admin-users-filters-parent-guide.md` (step 01 of 3; 01 → 02 → 03)
- **Depends on:** none (first step; keeps existing name-asc default)
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/db/src/admin`
