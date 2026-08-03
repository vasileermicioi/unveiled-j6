## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/02-browse-events-filters-01-domain-and-query.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites: `packages/db/src/catalog/discovery.ts`, `datetime.ts` Berlin helpers, `apps/web/app/lib/event-feed.ts`, discovery integration + event-feed unit tests

## 2. Domain query

- [x] 2.1 Add optional `title?: string` to `MemberFeedFilters`; in `memberFeedConditions`, apply trimmed case-insensitive `ilike` on `events.title` with `%`/`_` escaped
- [x] 2.2 Update `resolveFeedWindow` / conditions: clamp calendar `from` to Berlin today; always intersect ranged window with `date_time >= now`; past-only / inverted-after-clamp ranges yield empty
- [x] 2.3 Confirm `listMemberFeedMapEvents` stays on shared `memberFeedConditions` (no duplicate window logic)

## 3. URL helpers and routes

- [x] 3.1 Extend `EventFeedQuery`, `parseEventFeedQuery`, `buildEventFeedQueryString`, and `eventFeedPageRedirectPath` with optional `title`
- [x] 3.2 Pass `title: feedQuery.title` from `events/index.tsx` and `events/map.tsx` into list helpers; preserve `title` in any build/redirect call sites on those routes

## 4. Tests

- [x] 4.1 Update discovery integration tests: past ranged day no longer includes past events; add title substring; add `from` before Berlin today clamped; ranged query still excludes `date_time < now`; default upcoming order unchanged (skip cleanly if `DATABASE_URL` missing)
- [x] 4.2 Extend `event-feed.test.ts` for parse/build/redirect of `title` (present, trimmed, empty omitted)

## 5. Cleanup and verification

- [x] 5.1 Mark step 01 done in `.dev-plan/current-iteration/02-browse-events-filters-parent-guide.md` (leave Gherkin/e2e narrative for step 02)
- [x] 5.2 Run `bun run lint` — exits 0
- [x] 5.3 Run `bun run typecheck` — exits 0
- [x] 5.4 Run discovery package tests (and event-feed unit tests) — exit 0; document skip if `DATABASE_URL` missing
