## Context

Catalog steps 03–04 shipped ADMIN list routes at `/:locale/admin/partners` and `/:locale/admin/events` with shared `AdminSearchForm`, `AdminPagination`, and `parseAdminListQuery` (page size 25). Routes call `listPartners` / `listEvents` plus filtered `countPartners` / `countEvents` in parallel.

**Current gaps (verified in code):**

| Area | Partners | Events |
|---|---|---|
| `ORDER BY` | **Missing** — unstable insertion order | `date_time DESC` only — not "latest added" |
| Search filter | `name` OR `contact_email` ILIKE | `title` OR `partner_name` ILIKE |
| Count filter | Matches list | Matches list |
| Page clamp | None — `?page=99` yields empty table | Same |

Partner create/edit recently exposed a HeroUI form pitfall: controls outside `TextField` do not participate in native form submission. `AdminSearchForm` uses bare `Input name="q"` inside `Form method="get"` — same risk for search appearing broken.

Source of truth: `docs/migration/extras/pagination-and-search.md`, sibling step `.dev-plan/current-iteration/catalog-04-admin-events-crud.md`.

## Goals / Non-Goals

**Goals:**

- Newest-first admin lists (`created_at DESC`, `id DESC`).
- Partner `?q=` searches name only; event `?q=` searches title + partner name.
- Reliable GET search submission via HeroUI-correct markup.
- Pagination totals, offsets, and prev/next links stay consistent; no empty pages when `page` is out of range.
- Automated domain tests for list/count/search/order.

**Non-Goals:**

- Changing page size, adding `sort` query param UI, or relevance ranking.
- Member-facing `/events` feed ordering/search.
- Updating denormalized `partner_name` on partner rename (separate concern).
- Client-side search/filter islands.

## Decisions

### 1. Sort column: `created_at`, not `date_time` (events)

Admin lists answer "what did we add recently?" — not "what happens soonest?".

```typescript
.orderBy(desc(partners.createdAt), desc(partners.id))
.orderBy(desc(events.createdAt), desc(events.id))
```

**Alternative:** Keep `date_time DESC` for events. Rejected for this change — admins reported wrong order after creating rows; `created_at` matches "latest to oldest" for catalog management. Event date remains visible in the date column.

**Index note:** Add `partners_created_at_idx` if missing; events already have `created_at` column — add index `(created_at DESC, id DESC)` only if EXPLAIN shows need (likely fine at catalog scale).

### 2. Partner search: name only

```typescript
// partnerSearchCondition
ilike(partners.name, pattern)
```

Drop `contactEmail` from ILIKE. Update main spec and `pagination-and-search.md` table row for `/admin/partners`.

### 3. Event search: unchanged scope, verified parity

Keep `eventSearchCondition` on `title` + `partnerName`. Ensure `countEvents({ q })` uses identical predicate (already does). No JOIN required — denormalized `partner_name` is the search target.

### 4. AdminSearchForm markup

```tsx
<TextField defaultValue={defaultQuery} fullWidth name="q">
  <Label htmlFor="admin-search">{copy.searchPlaceholder}</Label>
  <Input id="admin-search" placeholder={copy.searchPlaceholder} type="search" />
</TextField>
```

Remove duplicate `name` on `Input`; root `TextField` owns form field registration.

Optional: hidden `<input type="hidden" name="page" value="1" />` is **not** needed — omitting `page` already means page 1 per `parseAdminListQuery`.

### 5. Page clamping

Add helper in `admin-list.ts`:

```typescript
export function clampAdminListPage(page: number, total: number, pageSize: number): number
```

- Compute `totalPages = max(1, ceil(total / pageSize))`.
- `effectivePage = min(page, totalPages)`.
- If `effectivePage !== page`, list routes **302 redirect** to same path with corrected query string (preserves `q`). Avoids silent empty tables and keeps URL honest.

Apply in both `partners/index.tsx` and `events/index.tsx` before querying.

### 6. Domain integration tests

Extend `packages/db/src/catalog/catalog.integration.test.ts` (or add `list-queries.integration.test.ts`):

- Seed ≥2 partners/events with distinct names and staggered `created_at` (or rely on insert order + explicit updates).
- Assert `listPartners` / `listEvents` return descending `created_at`.
- Assert `q` filters correctly (partner name hit/miss; event title and partner name hit).
- Assert `offset`/`limit` paging and `count*` totals align.

Use test DB / transaction pattern already in package if present; otherwise document manual verification in tasks.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| `created_at` order differs from event schedule order | Date column still shows `date_time`; document in admin copy if needed later |
| Redirect on clamp adds extra navigation | Only when URL is invalid; acceptable for admin |
| Stale `partner_name` on events hurts search after rename | Out of scope; note in Open Questions |
| Index missing on `partners.created_at` | Add migration if query plan warrants |

## Migration Plan

1. Ship `@unveiled/db` query changes + tests.
2. Ship app search form + page clamp redirect.
3. Manual verify: create partner → appears top of list; search by name; paginate with seed data >25 rows.

No data migration. Rollback = revert query order and search condition.

## Open Questions

- Should partner rename sync `events.partner_name` for search accuracy? Defer unless product asks.
- Add `partners.created_at` index in this change or wait for perf signal? Prefer adding in migration if trivial.
