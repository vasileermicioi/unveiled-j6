## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`packages/db/src/schema/events.ts`, catalog `events.ts` / `discovery.ts` / `datetime.ts`, schema overview, admin create callers)
- [x] 1.2 Lock approach in PR notes: keep denormalized `date_time` as next/primary synced on write (do not drop column)

## 2. Schema & migration

- [x] 2.1 Add `dateTimes` array column to Drizzle `events` schema + check `cardinality(date_times) >= 1`
- [x] 2.2 Generate migration: backfill `date_times = ARRAY[date_time]`, set NOT NULL + check; retain `date_time` and existing indexes
- [x] 2.3 Add `normalizeEventDateTimes` / `primaryDateTimeFromList(list, now)` helpers (sort, unique, reject empty; next upcoming or earliest past)

## 3. Catalog domain writes

- [x] 3.1 Change `CreateEventInput` / `UpdateEventInput` / `CloneEventInput` to `dateTimes: Date[]` (update optional); reject empty via existing catalog errors
- [x] 3.2 On create/update/clone: persist `date_times`, sync `date_time`, call `deriveDateTimeFields` from primary
- [x] 3.3 Wrap admin create/edit/clone route parsers to pass one-element `[dateTime]` until step 02 UI
- [x] 3.4 Update seed helpers and any other `CreateEventInput` construction sites

## 4. Discovery & upcoming queries

- [x] 4.1 Confirm upcoming / saved / `listUpcomingEvents` / featured upcoming-only can keep `date_time >= now` under sync rules; add multi-datetime coverage
- [x] 4.2 Update member feed `from`/`to` range to match **any** `date_times` element in the Berlin window while still excluding fully past events; keep sort by `date_time`, `id`
- [x] 4.3 Fix package tests: migration/backfill semantics, create with 2+ datetimes, update add/remove, upcoming exclusion when all past, range intersection with later slot

## 5. Verification & handoff

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run catalog/discovery tests when `DATABASE_URL` present — exit 0
- [x] 5.4 Optionally draft `schema-overview.md` edits; mark step 01 done in parent guide; document denormalization choice for step 02
