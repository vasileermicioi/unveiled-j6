## Context

Parent feature: browse events filters (`.dev-plan/current-iteration/02-browse-events-filters-parent-guide.md`), step 01 — domain and query parsing only.

Current state:

- **`MemberFeedFilters`** (`packages/db/src/catalog/discovery.ts`): `category`, `partnerId`, `from`, `to`, `page`, `now`. No `title`.
- **`memberFeedConditions`**: default = `date_time >= now`. When `from`/`to` present, uses `berlinInclusiveDateRange` alone — **past days and past showtimes inside the range are included** (integration test asserts this).
- **Map**: `listMemberFeedMapEvents` reuses the same conditions (good — one fix covers both).
- **URL helpers** (`apps/web/app/lib/event-feed.ts`): parse/build/redirect for `category`, `partnerId`, `from`, `to`, `page` only.
- **Routes** (`events/index.tsx`, `events/map.tsx`): pass parsed filters into list helpers but do not yet pass `title`.
- **Product SoT** (`docs/product/features/event-discovery.feature`): default = all upcoming; date range = inclusive Berlin days. Parent guide adds: never start before Berlin today; always exclude already-started; optional event-name filter. Canonical Gherkin narrative polish deferred to step 02.

Constraints: domain logic in `@unveiled/db`; Europe/Berlin calendar; packages must not import `apps/web`; no filter UI / copy / e2e in this step; single `events.date_time` until multi-datetime ships.

## Goals / Non-Goals

**Goals:**

- Optional title filter: trim, empty → ignore; case-insensitive substring `ilike` on `events.title`.
- Always intersect feed window with upcoming: effective lower bound ≥ `now`.
- Clamp calendar `from` so it is never before Berlin today (`getBerlinCalendarDate(now)`); past-only ranges → empty.
- Shared conditions so list + map stay aligned.
- Query param `title` on parse/build/redirect; routes pass `title` through to domain.
- Tests covering title match, past-`from` clamp, ranged query excluding `date_time < now`; flip the obsolete “past day included” assertion.

**Non-Goals:**

- Filter form UI, `min=today` on date inputs, i18n copy, Playwright/e2e (step 02).
- Removing category filter; free-text partner search; sort controls.
- Multi-datetime schema; guest Discover featured behavior; admin `/admin/events` list filters.

## Decisions

1. **Clamp calendar `from` to Berlin today, then intersect with `now`**
   - **Choice:** When resolving a ranged window: if requested `from` (or the sole bound when only one of `from`/`to` is set) is before Berlin today, replace it with Berlin today YMD before `berlinInclusiveDateRange`. Always add `gte(events.dateTime, now)` in addition to the inclusive range bounds (or take `max(window.start, now)` as the effective start). Same-day past showtimes stay hidden.
   - **Rationale:** Parent guide: Berlin calendar today 00:00 for range floor **and** `date_time >= now`.
   - **Alternatives:** Only clamp to today midnight without `>= now` (rejected — morning past events would show); only `>= now` without calendar clamp (weaker UX contract for `min` on date inputs in step 02).

2. **Title via Postgres `ilike` with escaped `%` / `_`**
   - **Choice:** After trim, if non-empty, add `ilike(events.title, '%' + escape(title) + '%')` (or equivalent Drizzle helper). Escape wildcards in user input so literal `%`/`_` do not broaden matches.
   - **Rationale:** Case-insensitive substring; matches admin title filter intent; param name `title` per parent guide.
   - **Alternatives:** `q` query param (rejected — ambiguous); trigram/FTS (rejected — overkill for MVP).

3. **Shared `memberFeedConditions` only — no duplicate map logic**
   - **Choice:** Implement title + window clamp once in `memberFeedConditions` / `resolveFeedWindow`; both list and map call it.
   - **Rationale:** Step plan; map parity without UI work.
   - **Alternatives:** Separate map window (rejected — drift risk).

4. **Wire `title` through routes without UI**
   - **Choice:** Extend `EventFeedQuery` + helpers; pass `title: feedQuery.title` from feed and map routes into list helpers. No form field yet — `?title=` works for tests and step 02.
   - **Rationale:** Independently mergeable; step 02 only adds chrome.
   - **Alternatives:** Helpers only, routes later (rejected — half-wired, easy to forget).

5. **Update integration tests that assert past ranged inclusion**
   - **Choice:** Change the test that expects a past event inside `from=to=past day` to expect exclusion / empty; add cases for title substring and `from` before today.
   - **Rationale:** Behavior is intentionally **BREAKING** vs current tests.
   - **Alternatives:** Keep old test under a “legacy” flag (rejected — wrong contract).

6. **Docs / Gherkin**
   - **Choice:** OpenSpec delta only in this change; product feature-file narrative + e2e in step 02. Optionally one line in parent guide checkbox when done.
   - **Rationale:** Step plan cleanup section.

## Risks / Trade-offs

- **[Risk] Existing integration test fails until rewritten** → Mitigation: update in same PR; document skip if `DATABASE_URL` missing.
- **[Risk] Unescaped `ilike` wildcards** → Mitigation: escape `%` and `_` (and `\` if needed) in title input.
- **[Risk] Only-`to` in the past with clamped `from=today` yields empty or inverted range** → Mitigation: after clamp, if effective start YMD > end YMD, return unsatisfiable condition (empty result) rather than swapping days across the today floor incorrectly.
- **[Trade-off] Domain ships before UI** → Acceptable; URL `?title=` / clamped dates work headlessly; UI in 02.
- **[Trade-off] OpenSpec main `event-discovery` still said “today-only” in places** → This delta aligns query contract with product “all upcoming”; page-copy Gherkin catch-up in 02.

## Migration Plan

1. No schema migration.
2. Deploy domain + helper + route wiring; behavior change for any client already sending past `from`/`to`.
3. Rollback: revert commit; no data migration.

## Open Questions

- None blocking. Sort controls remain deferred per parent guide.
