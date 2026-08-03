## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/02-browse-events-filters-02-ui-and-hardening.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm step 01 is done: `title` on `EventFeedQuery` / routes / `listMemberFeedEvents`; Berlin today-floor clamp in discovery

## 2. Filter UI and routes

- [x] 2.1 Add DE/EN `titleLabel` (and placeholder if used) to `event-feed-content.ts`
- [x] 2.2 Update `EventFeedFilters`: event-name `TextField`/`Input` `name="title"`; accept `minDate` prop; set `min` on `from`/`to` date inputs; adjust grid layout for five fields
- [x] 2.3 Pass `minDate={getBerlinCalendarDate(new Date())}` from `events/index.tsx` and `events/map.tsx` into filters (via shell if that is the wiring path); confirm `title` already flows through query
- [x] 2.4 Add/update Ladle story with title applied (`EventFeedFilters.stories.tsx`)

## 3. Product docs and BDD

- [x] 3.1 Update `docs/product/features/event-discovery.feature`: event name filter control/scenario; Reset clears title; Map mirrors title; date range notes future-only / today floor
- [x] 3.2 Update `docs/product/testing/coverage-matrix.md` for new/changed scenarios
- [x] 3.3 Optionally note today-floor + title filter in `docs/product/extras/gaps-and-decisions.md` if product wants the log

## 4. Playwright

- [x] 4.1 Add e2e for event name filter control and/or Filter by event name (label fill or URL; proximity selectors; seed titles)
- [x] 4.2 Extend Reset (and map preserve if cheap) to assert `title` clears / is preserved; optionally assert date `min` = Berlin today

## 5. Cleanup and verification

- [x] 5.1 Mark step 02 done in `.dev-plan/current-iteration/02-browse-events-filters-parent-guide.md`
- [x] 5.2 Run `bun run lint` — exits 0
- [x] 5.3 Run `bun run typecheck` — exits 0
- [x] 5.4 Run relevant Playwright discovery specs when e2e env available (or document skip) — **skipped:** Playwright Chromium not installed in this environment (`npx playwright install` required); specs updated for CI when browsers + `DATABASE_URL` are available
