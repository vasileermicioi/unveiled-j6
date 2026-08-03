## Why

Admins need to attach **multiple datetime values** to one catalog event (explicit list, not RRULE), while booking stays event-level. Today `events.date_time` is a single instant, so create/update/clone and discovery “upcoming” logic cannot represent multi-occurrence events. This step is the schema + domain foundation for parent feature `event-multi-datetime` (step 01 of 03).

## What Changes

- **BREAKING (domain API):** `CreateEventInput` / update / clone accept `dateTimes: Date[]` (non-empty; sorted unique on write) instead of a single `dateTime`.
- Add `events.date_times timestamptz[] NOT NULL` with check `cardinality >= 1`; migrate existing rows to `ARRAY[date_time]`.
- **Keep** `events.date_time` as a denormalized **primary/next** instant (next upcoming in the list, or earliest if all past), recomputed on every write — preserves existing indexes and most SQL filters.
- Recompute `start_time_minutes` / `weekday` from that primary instant (Europe/Berlin).
- Discovery / upcoming / saved / featured-upcoming predicates: an event is “upcoming” if **any** `date_times` element is `>= now`; sort/order by the denormalized **next** (`date_time`).
- Unit/integration tests for backfill semantics, multi-datetime create/update, and upcoming exclusion when all past.
- Out of scope: admin form islands, public detail chrome, e2e, ICS/email polish (steps 02–03).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Schema adds non-empty `date_times`; retain denormalized `date_time` synced on write; create/update/clone accept a datetime list; derived timing fields from primary/next.
- `event-discovery`: Upcoming membership uses any future datetime; default sort uses next upcoming (`date_time`).
- `admin-events`: Create-a-single-event requirement uses one or more `dateTimes`; derived fields from primary/next.

## Impact

- **DB:** `packages/db/src/schema/events.ts`, new Drizzle migration, `docs/product/database/schema-overview.md` (optional draft here; finalize in step 03).
- **Domain:** `packages/db/src/catalog/events.ts`, `datetime` / `deriveDateTimeFields` call sites, `discovery.ts`, featured upcoming filters, seed helpers, package tests.
- **Dependents:** Any callers of `CreateEventInput.dateTime` / clone `dateTime` (admin routes may temporarily adapt to wrap a single value until step 02 UI).
- **Source brief:** `.dev-plan/current-iteration/03-event-multi-datetime-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/03-event-multi-datetime-parent-guide.md`
- **Verification:** `bun run lint`; `bun run typecheck`; catalog/discovery tests when `DATABASE_URL` present
