## Why

Phase 5 member discovery needs a normalized `saved_events` join table (replacing the old Firestore `saved_event_ids` array) and a reusable query layer for the member feed before any UI routes land. Shipping schema + domain queries first gives steps 02–04 (`/events`, `/saved`, map) a stable `@unveiled/db` API for today-default filtering, pagination, and bookmarks.

## What Changes

- Add Drizzle schema `packages/db/src/schema/saved-events.ts` for `public.saved_events`: `user_id` → `users.id`, `event_id` → `events.id`, `created_at`; composite PK `(user_id, event_id)`; index on `user_id`.
- Export the table from `packages/db/src/schema/index.ts` and generate/apply a Drizzle migration.
- Add a discovery query module in `@unveiled/db` (e.g. `packages/db/src/catalog/discovery.ts`) with:
  - Europe/Berlin day-boundary helpers for inclusive full-day `from`/`to` (and today default)
  - `listMemberFeedEvents` — filters `category`, `partnerId`, date range, page size 24 + offset; default today when `from`/`to` omitted; exclude past/invalid; stable `ORDER BY date_time ASC, id ASC`; return `{ items, total }`
  - `listSavedUpcomingEvents` — saved events that are still upcoming (not today-restricted)
  - `isEventSaved` / `listSavedEventIds` / `saveEvent` / `unsaveEvent` (idempotent upsert/delete)
- Extend or reuse `packages/db/src/catalog/datetime.ts` for Berlin day ranges as needed.
- Integration/unit tests for feed filters, empty results, past exclusion, and save/unsave idempotency (follow `catalog.integration.test.ts`).
- **Out of scope:** `/events`, `/saved`, `/events/map` routes and UI; bookmark form POST handlers; MapLibre island; Ladle/Playwright; booking/waitlist/Stripe.

## Capabilities

### New Capabilities

- `event-discovery`: Saved-events persistence and member discovery query contracts (today-default feed, filters, pagination, saved upcoming list, save/unsave) in `@unveiled/db` for Phase 5.

### Modified Capabilities

- _(none)_ — `event-catalog` public/admin list APIs (`listUpcomingEvents`, admin CRUD) stay unchanged; discovery is a separate member-feed surface.

## Impact

- **Packages:** `@unveiled/db` only — new schema file, migration SQL, discovery query module + exports, tests.
- **Database:** New `saved_events` table with FKs to `users` and `events`; requires `DATABASE_URL` for `db:generate` / `db:migrate`.
- **Downstream:** Consumed by `discovery-02-member-feed`, `discovery-03-saved-events`, `discovery-04-event-map`; no `apps/web` route changes in this step.
- **Verification:** `bun run db:generate`, `bun run db:migrate`, `bun run typecheck`, `bun run lint`, discovery/catalog tests (e.g. `bun test packages/db/src/catalog`).
- **Source:** `.dev-plan/current-iteration/discovery-01-schema-and-queries.md`; behavior from `docs/migration/features/event-discovery.feature` and `docs/migration/extras/pagination-and-search.md`.
