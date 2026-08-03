## Context

Parent feature: event multi-datetime (`.dev-plan/current-iteration/03-event-multi-datetime-parent-guide.md`), step 01 — schema + catalog/discovery domain.

Current state:

- `events.date_time` is a single `timestamptz NOT NULL` with indexes `(date_time)`, `(date_time, partner_id)`, `(date_time, category)`.
- `CreateEventInput` / `UpdateEventInput` / `CloneEventInput` take one `dateTime: Date`.
- `deriveDateTimeFields(dateTime, timingMode)` writes `start_time_minutes` + `weekday` in Europe/Berlin.
- Discovery (`listDiscoverableEvents`, saved upcoming), `listUpcomingEvents`, bookable sitemap helpers, and partner “active event” counts filter/sort on `events.date_time`.

Product lock for this feature: **explicit datetime list** (no RRULE); **booking remains event-level** (not per slot). UI/e2e are later steps.

Constraints: business logic in `@unveiled/db`; no admin form UI in this step; Europe/Berlin for derived fields; prefer small blast radius on existing SQL/indexes.

## Goals / Non-Goals

**Goals:**

- Persist non-empty `date_times timestamptz[]`; backfill from `date_time`.
- Keep denormalized `date_time` as primary/next instant, synced on every write.
- Domain APIs accept `dateTimes: Date[]` (normalize: reject empty, sort ascending, unique by epoch ms).
- Upcoming membership = any list element `>= now` (equivalent to `date_time >= now` when sync is correct); sort by next (`date_time`).
- Date-range feed filters consider **any** element intersecting the Berlin window (not only the next instant).
- Tests cover migration backfill semantics, multi-datetime create/update, and all-past exclusion.

**Non-Goals:**

- Admin create/edit/clone form islands or multi-row datetime UI (step 02).
- Public/member detail chrome, ICS/email copy, e2e (step 03).
- Per-occurrence capacity, inventory, or bookings.
- Dropping `date_time` or replacing btree indexes with GIN-only array plans.
- Partner portal authoring.

## Decisions

1. **Keep `date_time` as denormalized next/primary (prefer plan option b)**
   - **Choice:** Add `date_times`; retain `date_time` + existing indexes. On every create/update/clone write: normalize list → set `date_times` → set `date_time = nextUpcoming(list, now)` where `nextUpcoming` = min of elements `>= now`, else min of all (earliest past). Derive `start_time_minutes` / `weekday` from that primary via existing `deriveDateTimeFields`.
   - **Rationale:** Smallest blast radius for indexes, partner active counts, featured upcoming-only, sitemap bookable checks, and most `gte(events.dateTime, now)` call sites.
   - **Alternatives:** Drop `date_time` and query via `unnest` / expression index / new `next_date_time` column (larger migration and caller churn).

2. **Normalize lists in the catalog domain, not the DB alone**
   - **Choice:** Application write path sorts ascending and dedupes; DB enforces `cardinality(date_times) >= 1` (check). Reject empty arrays with existing catalog validation error types.
   - **Rationale:** Check constraint catches empty; sorted unique is a domain invariant callers can rely on.
   - **Alternatives:** Postgres trigger to sort (harder to test in domain unit tests; overkill).

3. **Upcoming vs range filters**
   - **Choice:** Simple upcoming / saved / `listUpcomingEvents` / featured upcoming-only may keep filtering on denormalized `date_time >= now` **after** sync rules are enforced. Member feed **`from`/`to` range** SHALL match events where **any** `date_times` element falls in the inclusive Berlin window (and still require an upcoming occurrence / exclude fully past via the upcoming gate). Sort remains `date_time ASC, id ASC`.
   - **Rationale:** Next-column equivalence holds for “any upcoming”; range filters would miss later occurrences if they only compared `date_time`.
   - **Alternatives:** Always `unnest` for upcoming too (correct but slower and noisier); defer range-array logic to browse-filters step (rejected — this step owns discovery helpers).

4. **API shape: `dateTimes` replaces `dateTime`**
   - **Choice:** `CreateEventInput.dateTimes: Date[]`; update optional `dateTimes?: Date[]`; clone `dateTimes: Date[]`. Temporary admin route adapters (until step 02) wrap the single posted datetime as a one-element array so the app still typechecks and creates work.
   - **Rationale:** Honest multi-value API; one-element wrap keeps step 01 mergeable without UI.
   - **Alternatives:** Keep `dateTime` plus optional `additionalDateTimes` (awkward; rejected).

5. **Reference `now` for primary recomputation**
   - **Choice:** Use injectable `now?: Date` on write helpers where tests need it; default `new Date()` in production writes. Primary sync uses that same `now`.
   - **Rationale:** Deterministic tests for “all past → earliest” vs “next upcoming”.
   - **Alternatives:** Always wall clock (flaky tests).

6. **Drizzle column typing**
   - **Choice:** `dateTimes: timestamp(..., { withTimezone: true, mode: "date" }).array().notNull()` (or equivalent supported Drizzle array-of-timestamptz); check via `sql\`cardinality(${table.dateTimes}) >= 1\``.
   - **Rationale:** Matches existing `tags` / `languages` array patterns and timestamp mode used by `dateTime`.

## Risks / Trade-offs

- **[Risk] Stale `date_time` if a code path writes `date_times` without sync** → Mitigation: single write helper (`normalizeEventDateTimes` + apply to insert/update) used by create/update/clone only; no raw partial updates of the array outside that path.
- **[Risk] Range filter SQL complexity / planner cost on arrays** → Mitigation: use `EXISTS (SELECT 1 FROM unnest(date_times) d WHERE d >= :start AND d < :end)` (or equivalent); keep btree on `date_time` for sort + upcoming gate; revisit GIN only if profiling demands it.
- **[Risk] Admin UI still posts one datetime until step 02** → Mitigation: route layer wraps `[dateTime]`; document in PR for step 02.
- **[Trade-off] “Bookable” / waitlist windows still key off primary `date_time`** → Accepted per parent guide until product asks for slot-level windows (step 03 may document ticket/ICS using next upcoming).
- **[Trade-off] Partner active count stays on `date_time`** → Correct under sync rules; no partner-catalog change required in this step.

## Migration Plan

1. Generate Drizzle migration: add `date_times timestamptz[]`; backfill `date_times = ARRAY[date_time]`; set NOT NULL + check `cardinality >= 1`.
2. Update schema types + `normalize` / primary helpers; switch create/update/clone + discovery range logic; wrap admin callers.
3. Fix seeds and package tests; add multi-datetime cases.
4. Run `bun run lint`, `bun run typecheck`, catalog/discovery tests with `DATABASE_URL`.
5. Rollback: reverse migration only before dependents rely on multi-value writes; after deploy, restore from backup / forward-fix if needed (array column is additive).

## Open Questions

- None blocking. Optional draft edits to `docs/product/database/schema-overview.md` may wait for step 03 if preferred; denormalization choice MUST be called out in the PR for step 02.
