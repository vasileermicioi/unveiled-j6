## Context

Parent feature: partner list sorting, active events, and sales export (`.dev-plan/current-iteration/partner-list-and-sales-export-parent-guide.md`), step 01 — domain only.

Current state:

- `listPartners` in `packages/db/src/catalog/partners.ts` selects flat `Partner` rows, optional name `ilike` via `partnerSearchCondition`, ordered only by `created_at desc, id desc`, default `limit` 25 / `offset` 0.
- `countPartners` counts the same name filter only — no sort, no event aggregates.
- `events.partner_id` FK exists; events have `date_time` and `remaining_capacity`. Bookable/sitemap helpers already treat “bookable” as future + capacity > 0 (`listBookableEventsForSitemap` uses `date_time > now`), but there is no shared **active event** predicate for the partner list.
- Admin UI at `/:locale/admin/partners` will consume sort + counts in step 02; this step must not change routes.

Constraints: business logic in `@unveiled/db` only; no schema migrations; name-only search unchanged; default sort must stay stable for existing callers/URLs; Europe/Berlin for calendar semantics where relevant; independently mergeable before UI.

## Goals / Non-Goals

**Goals:**

- Expose `PartnerSort = "name" | "created" | "events"` plus optional `desc` on `ListPartnersOptions`.
- Return list rows that include `eventCount` and `activeEventCount` (aggregates over `events`).
- Shared active-event SQL/predicate helper used by `listPartners` and reusable by later steps.
- Keep default order `created_at desc, id desc` when `sort` is omitted; keep `countPartners` aligned with the name filter for pagination totals.
- Unit/integration tests for each sort × direction, active counting, and filter/count agreement.

**Non-Goals:**

- Admin UI sort controls, Active events column, Name filter label (step 02).
- Sales-export ticket counts / CSV (step 03).
- Events admin list, featured-partners list, partner portal.
- Denormalized counter columns or migrations.
- Widening search beyond partner name.

## Decisions

1. **Active event = upcoming with remaining capacity**
   - **Choice:** An event is **active** when `date_time >= now` **and** `remaining_capacity > 0`. Default `now` is `options.now ?? new Date()` (injectable for tests). Document that callers SHOULD pass a Berlin-aware instant when they care about calendar boundaries; the predicate itself is timestamptz comparison (same pattern as discovery/sitemap).
   - **Rationale:** Matches the parent guide’s proposed product definition; aligns with “bookable” intent (`remaining_capacity > 0` + future). Prefer `>=` over sitemap’s strict `>` so an event starting “now” still counts as active for the admin column.
   - **Alternatives:** Upcoming-only (`date_time >= now`, ignore capacity) — rejected (parent proposal includes capacity); published/status flag — none exists; denormalized column — out of scope.

2. **Shared predicate helper, not inline SQL copies**
   - **Choice:** Export a small helper (e.g. `activeEventCondition(now: Date)` returning a Drizzle `SQL` fragment on `events`) from catalog (partners module or a tiny shared events helper colocated for reuse by steps 03+). `listPartners` uses it inside a conditional `count` / `filter` aggregate.
   - **Rationale:** Step plan requires one definition so sales-export / dashboard-adjacent logic agree.
   - **Alternatives:** Duplicate `and(gte(...), gt(...))` in each query — rejected (drift risk).

3. **Sort key `events` orders by total `eventCount`, not active count**
   - **Choice:** `sort=events` orders by total events per partner; `activeEventCount` is a returned column only. Tiebreak with `partners.id` (desc when `desc` is true / overall direction, or always `id desc` for stability — prefer **same direction as primary sort** for name/created, and **`id desc`** as fixed tiebreak for `events` and default created, matching today’s default).
   - **Rationale:** Step-plan Spec Delta and `PartnerSort` name say event count; parent user-visible copy says “number of active events” — lock total count for the sort key in step 01; step 02 can label the column “Active events” separately and may later request active-based sort if product insists.
   - **Alternatives:** Sort by `activeEventCount` — deferred unless product reopens; two sort keys — out of scope for this step.

4. **Aggregate via left join / grouped subquery, not N+1**
   - **Choice:** One query: partners filtered by name, left-joined to a per-`partner_id` subquery (or `leftJoin(events)` + `groupBy(partners.id, …)`) selecting `count(events.id)` and `count(*) filter (where active)` (or equivalent `sum(case when …)`). Coalesce nulls to `0`. Apply `orderBy` / `limit` / `offset` on the outer result.
   - **Rationale:** Keeps page-size 25 and offset pagination correct; one round-trip.
   - **Alternatives:** Two queries (list ids then counts) — more complexity; window functions — unnecessary for page size 25.

5. **Widen return type; keep default behavior for omit-sort callers**
   - **Choice:** Introduce e.g. `PartnerListItem = Partner & { eventCount: number; activeEventCount: number }` as `listPartners` return type. Existing callers (seed, tests, admin route) either tolerate the extra fields or map. Omit `sort` → current `created_at desc, id desc`. Omit `desc` → treat as ascending for explicit sorts **except** when `sort` is omitted (default remains desc-on-created). When `sort` is set and `desc` is omitted, default **`desc: false` (asc)** unless product prefers desc for `events`/`created` — **lock:** `desc` defaults to `false` when `sort` is provided; UI step will pass `dir` explicitly.
   - **Rationale:** Stable URLs for today’s list; explicit sort params from step 02.
   - **Alternatives:** Separate `listPartnersWithCounts` — rejected (step plan extends `listPartners`).

6. **`countPartners` unchanged in filter semantics**
   - **Choice:** Still counts partner rows matching `partnerSearchCondition` only (no join required). Sort does not affect totals.
   - **Rationale:** Pagination total = filtered partner cardinality; step plan verification scenario.
   - **Alternatives:** Count only partners with events — rejected (would break empty-partner pagination).

7. **No migrations / `db:generate` expected no-op**
   - **Choice:** Query-time aggregates only. Do not touch Drizzle schema files unless a type-only export needs re-export from package index.
   - **Rationale:** Parent non-goal; deliverables say no migrations.

## Risks / Trade-offs

- **[Risk] Parent copy says sort by active events; step sorts by total events** → Mitigation: document Decision 3; confirm in step 02 UI copy; reopen only if product requires active-based sort.
- **[Risk] `>=` vs sitemap `>` for “now” edge** → Mitigation: tests with `now` pinned; accept intentional slight difference from sitemap bookable set.
- **[Risk] Return-type widening breaks strict `Partner[]` consumers** → Mitigation: typecheck + update seed/tests/admin mapper in this step if compile fails; no UI behavior change.
- **[Risk] Aggregate + order by count is slower than single-table scan** → Mitigation: partner catalog is small admin list (page 25); indexes already on `events(date_time, partner_id)`; revisit only if profiling shows pain.
- **[Trade-off] `desc` default when `sort` set** → UI must pass direction; safer than guessing desc for name.

## Migration Plan

1. Implement types + active helper + extended `listPartners` / tests in `@unveiled/db`.
2. Fix any TypeScript call sites that require the new row shape.
3. Run typecheck, lint, package tests; confirm no migration generated.
4. Mark step done in parent guide after merge (or at end of implementation session).
5. Rollback: revert the catalog change; no DB rollback needed.

## Open Questions

- None blocking implementation: active definition and `events` sort key are locked above. If product later wants sort-by-active, add a fourth `PartnerSort` value or redefine `events` in a follow-up — do not silently change semantics after UI ships.
