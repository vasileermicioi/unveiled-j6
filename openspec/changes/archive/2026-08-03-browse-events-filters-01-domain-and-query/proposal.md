## Why

Member feed date ranges currently allow past calendar days (and past showtimes within a ranged day), and there is no event-name filter in the discovery query. Before shipping filter UI, the catalog query and URL helpers must match product rules: future-only feed, Berlin today as the date-floor, and optional title search.

## What Changes

- Add optional `title` filter to `MemberFeedFilters` / `memberFeedConditions` (trim; case-insensitive `ilike` on `events.title`).
- **BREAKING** (query behavior): when `from`/`to` are set, still exclude `date_time < now`; clamp effective range start to Berlin today (requested `from` earlier than today → today). Past-only ranges yield empty results.
- Keep default (no `from`/`to`): `date_time >= now`, order by `date_time` asc, `id` asc.
- Keep existing `category` / `partnerId` filters unchanged.
- Extend `EventFeedQuery`, `parseEventFeedQuery`, `buildEventFeedQueryString`, and `eventFeedPageRedirectPath` with `title`.
- Update discovery integration tests and event-feed unit tests for title match, past-`from` clamp, and future-only with range.
- Out of scope: filter UI, copy/i18n, e2e, map page wiring beyond shared helpers (step 02), sort controls, multi-datetime.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Member feed query SHALL support optional title (event-name) filtering; default scope remains all upcoming (`date_time >= now`); custom date ranges SHALL intersect with upcoming and SHALL NOT use a lower bound before Berlin today.

## Impact

- **Domain (`@unveiled/db`):** `packages/db/src/catalog/discovery.ts` (`MemberFeedFilters`, `resolveFeedWindow` / `memberFeedConditions`, shared by `listMemberFeedEvents` + `listMemberFeedMapEvents`); `packages/db/src/catalog/discovery.integration.test.ts`; Berlin helpers in `datetime.ts` as needed.
- **Web helpers (`apps/web`):** `apps/web/app/lib/event-feed.ts` + `event-feed.test.ts` — query param `title` (align with admin). Routes already pass parsed query into list helpers; no UI chrome in this step.
- **Docs:** Product Gherkin narrative updates deferred to step 02; optional note in gaps if domain behavior ships ahead of UI. OpenSpec delta archives with this change.
- **Source brief:** `.dev-plan/current-iteration/02-browse-events-filters-01-domain-and-query.md`
- **Parent:** `.dev-plan/current-iteration/02-browse-events-filters-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `02-browse-events-filters-02-ui-and-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; discovery package tests (skip cleanly if `DATABASE_URL` missing)
