## 1. Schema and migration

- [x] 1.1 Add `packages/db/src/schema/saved-events.ts` with composite PK `(user_id, event_id)`, FKs to `users`/`events` (CASCADE), `created_at`, and `user_id` index
- [x] 1.2 Export `savedEvents` from `packages/db/src/schema/index.ts`
- [x] 1.3 Run `bun run db:generate`, review SQL for `saved_events`, then `bun run db:migrate`

## 2. Berlin day helpers

- [x] 2.1 Add `berlinTodayRange` and `berlinInclusiveDateRange` (exclusive end-of-day UTC) in `packages/db/src/catalog/datetime.ts`
- [x] 2.2 Add unit tests in `datetime.test.ts` for today default and inclusive `from`/`to` bounds

## 3. Discovery query module

- [x] 3.1 Create `packages/db/src/catalog/discovery.ts` with `MEMBER_FEED_PAGE_SIZE = 24` and `listMemberFeedEvents` (today default, filters, past exclusion, `{ items, total }`)
- [x] 3.2 Implement `saveEvent`, `unsaveEvent`, `isEventSaved`, `listSavedEventIds`, and `listSavedUpcomingEvents`
- [x] 3.3 Re-export discovery APIs from `packages/db/src/catalog/index.ts`

## 4. Tests and verification

- [x] 4.1 Add `discovery.integration.test.ts` covering today default, date-range override, category/partner filters, empty result, past exclusion, save/unsave idempotency
- [x] 4.2 Run `bun run typecheck`, `bun run lint`, and `bun test packages/db/src/catalog`
- [x] 4.3 Spot-check default feed against seeded demo data (Berlin-today future events only)
- [x] 4.4 Mark step 01 done in `discovery-parent-guide.md` and note exported API names for step 02
