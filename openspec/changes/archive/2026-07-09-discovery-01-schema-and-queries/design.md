## Context

Phase 4 catalog is in place: `events`, `partners`, and `images` tables; `listUpcomingEvents` / `getPublicEventById` in `packages/db/src/catalog/events.ts`; Europe/Berlin helpers in `datetime.ts` (weekday/time derivation only — no day-range helpers yet). Phase 5 member discovery needs bookmarks and a filterable feed before any SSR routes.

This is discovery step 01 of 4: **schema + domain queries only**. Steps 02–04 render `/events`, `/saved`, and the map against this API.

Source of truth: `docs/migration/features/event-discovery.feature`, `docs/migration/extras/pagination-and-search.md` (page size 24; `page`, `category`, `partnerId`, `from`, `to`), `docs/migration/database/schema-overview.md` (`saved_events` join table recommendation; existing `(date_time, category)` / `(date_time, partner_id)` indexes).

Existing patterns: modular schema files; `listEvents` / `countEvents` with `LIMIT`/`OFFSET` + `COUNT(*)`; admin list page clamp in `apps/web/app/lib/admin-list.ts` (URL parsing stays in web — this step only exposes `limit`/`offset` or `page` at the DB layer); integration tests gated on `DATABASE_URL` in `catalog.integration.test.ts`.

## Goals / Non-Goals

**Goals:**

- Persist member bookmarks in `public.saved_events` with composite PK and FKs.
- Expose a discovery query module from `@unveiled/db` for member feed filters, pagination, and saved CRUD.
- Berlin day-boundary helpers so "today" and inclusive `from`/`to` are DST-safe.
- Tests covering today default, date-range override, category/partner filters, empty result, past exclusion, save/unsave idempotency.

**Non-Goals:**

- Any `apps/web` routes, form POSTs, MapLibre island, Ladle, or Playwright.
- Auth/role checks inside discovery queries (callers pass `userId`; route guards land in later steps).
- Changing `listUpcomingEvents` marketing preview behavior or admin list APIs.
- Soft-delete / cascade policy beyond FK `ON DELETE` choices documented below.
- Seeding saved events in `seed:demo` (optional later; not required for this step).

## Decisions

### 1. New schema file: `saved-events.ts`

| Column | Drizzle type | Notes |
|---|---|---|
| `user_id` | `text`, FK → `users.id`, not null | Matches `users.id` (Better Auth text id) |
| `event_id` | `uuid`, FK → `events.id`, not null | |
| `created_at` | `timestamptz`, not null, default now | Bookmark time |

- Composite primary key `(user_id, event_id)`.
- Index `saved_events_user_id_idx` on `(user_id)` for "my saved" lookups.
- **FK delete:** `user_id` → `users.id` `ON DELETE CASCADE`; `event_id` → `events.id` `ON DELETE CASCADE` — bookmarks disappear with the user or event (no orphan rows; admin event delete already removes catalog rows).

**Rationale:** Matches schema-overview recommendation; composite PK makes save idempotent at the DB layer; cascade keeps cleanup simple without app-level orphan sweeps.

**Alternative considered:** Array column on `users` — rejected (no referential integrity, hard to index). Soft FK / restrict on event delete — rejected (would block event deletion or require explicit unsave in admin delete path).

### 2. Discovery module location

Add `packages/db/src/catalog/discovery.ts` and re-export from `packages/db/src/catalog/index.ts`. Keep `events.ts` focused on public/admin catalog CRUD; discovery is a separate member-feed surface.

**Alternative considered:** Extending `events.ts` — workable but mixes admin list semantics with member feed defaults (today scope, page size 24).

### 3. Berlin day-boundary helpers

Extend `packages/db/src/catalog/datetime.ts` (or a small helper colocated and re-exported) with:

- `berlinTodayRange(now: Date): { start: Date; end: Date }` — start inclusive / end exclusive UTC instants for the Europe/Berlin calendar day containing `now`.
- `berlinInclusiveDateRange(from: string | Date, to: string | Date): { start: Date; end: Date }` — parse calendar dates (YYYY-MM-DD or Date) as full Berlin days; `end` is exclusive start-of-next-day so SQL can use `gte(dateTime, start)` + `lt(dateTime, end)`.

Use `Intl` / existing Berlin formatting patterns already in `datetime.ts` (no new timezone library required for v1). Unit-test around a known DST transition if practical.

**Rationale:** Schema-overview requires Europe/Berlin for "today"; exclusive end avoids `lte` edge bugs at 23:59:59.999.

### 4. `listMemberFeedEvents` contract

```ts
type MemberFeedFilters = {
  category?: string;
  partnerId?: string;
  from?: string; // YYYY-MM-DD, Berlin calendar day
  to?: string;
  page?: number; // 1-based; default 1
  now?: Date;    // inject for tests
};

type MemberFeedResult = { items: Event[]; total: number };
```

Behavior:

1. Resolve date window: if both `from` and `to` omitted → `berlinTodayRange(now)`; if either provided → inclusive range (missing bound defaults to the other / today as needed — prefer: if only `from`, range is that day through `to` or open-ended future within reason; **decision:** require treating provided bounds as inclusive full days; if only one of `from`/`to` is set, use that single day for the missing bound equal to the provided one, matching "custom date range" as a closed interval).
2. Always `events.date_time >= now` (exclude already-started) **and** within the resolved window.
3. Optional `eq(category)`, `eq(partnerId)`.
4. `ORDER BY date_time ASC, id ASC`; `LIMIT 24`; `OFFSET (page - 1) * 24`.
5. Parallel or sequential `COUNT(*)` with the same `WHERE` for `total`.

Page size is a module constant `MEMBER_FEED_PAGE_SIZE = 24` (not a caller-tunable param), matching pagination-and-search.md.

**Invalid dates:** `date_time` is `NOT NULL` at schema level — "missing/invalid" from the feature file is satisfied by excluding past starts; no extra null check needed.

### 5. Saved-events helpers

| Function | Behavior |
|---|---|
| `saveEvent(db, userId, eventId)` | Insert; on unique conflict do nothing (idempotent) |
| `unsaveEvent(db, userId, eventId)` | Delete matching row; no error if absent |
| `isEventSaved(db, userId, eventId)` | Boolean |
| `listSavedEventIds(db, userId)` | `string[]` of event ids (for feed bookmark state in later steps) |
| `listSavedUpcomingEvents(db, userId, now?)` | Join `saved_events` → `events` where `date_time >= now`; order `date_time ASC, id ASC`; **no** today default; no pagination in this step (saved lists are small; add later if needed) |

### 6. Tests

- Unit: Berlin range helpers (fixed `now` fixtures).
- Integration (skip without `DATABASE_URL`): seed partner/event fixtures via existing `createPartner`/`createEvent`; assert feed filters and save/unsave; clean up in `finally`.

Prefer a dedicated `discovery.integration.test.ts` beside `catalog.integration.test.ts` to keep catalog CRUD tests focused.

## Risks / Trade-offs

- **[Risk] DST / day-boundary bugs in "today" filter** → Mitigation: exclusive end-of-day UTC bounds; unit tests with fixed Berlin midnights; inject `now` in queries.
- **[Risk] `ON DELETE CASCADE` from events removes bookmarks silently** → Mitigation: acceptable for v1; admin delete already removes the event from discovery.
- **[Risk] Unbounded saved list** → Mitigation: curated catalog + upcoming filter; paginate in a later step only if measured need.
- **[Trade-off] OFFSET pagination** → Matches project convention at current scale; keyset later if needed.
- **[Trade-off] No auth inside DB layer** → Callers must pass session `userId`; prevents trusting client `userId` at the route layer in steps 02–03.

## Migration Plan

1. Add schema file + export.
2. `bun run db:generate` — review SQL for `saved_events` PK, FKs, index.
3. `bun run db:migrate` against local/staging `DATABASE_URL`.
4. Implement helpers + tests; `bun run typecheck` / `bun run lint`.
5. Rollback: reverse migration dropping `saved_events` (no data dependency from other tables).

## Open Questions

- None blocking — single-bound `from`/`to` treated as a one-day closed interval is decided above for implementers.
- Whether demo seed should insert sample saves: defer to step 03 or parent guide; not required for step 01 verification.
