## Context

Parent feature step 02: wire step 01’s `listPartners` sort + `activeEventCount` into the admin partners UI at `/:locale/admin/partners`.

Current state:

- Route `apps/web/app/routes/[locale]/admin/partners/index.tsx` calls `parseAdminListQuery` (`q`/`page` only) and `listPartners` without `sort`/`desc`, then maps logos and renders `AdminPartnersListPage`.
- `AdminSearchForm` always uses shared `copy.searchPlaceholder` (“Search title or partner” / “Titel oder Partner suchen”) — wrong for name-only partner search.
- `AdminPartnersTable` types rows as bare `Partner[]` (no count columns) with logo / name / email / address / actions.
- `buildAdminListQueryString` / `AdminPagination` only preserve `q`/`page` (and optional `role` for users).
- Domain already exports `PartnerSort`, `PartnerListItem` (`eventCount`, `activeEventCount`), and honors `sort`/`desc`.

Constraints: SSR-only mutations/navigation (AGENTS §1); HeroUI markup + theme-only visuals (§8–9); native-first choice controls (§14); page size 25 unchanged; default last-created-desc when sort omitted; no sales-export route yet (step 03); events list untouched.

## Goals / Non-Goals

**Goals:**

- Partner search labeled **Name** (DE/EN) via `AdminSearchForm` override prop.
- SSR sort + direction controls (`sort`/`dir` query params) mapped to domain `PartnerSort` + `desc`.
- Preserve `q`/`page`/`sort`/`dir` across search submit and pagination.
- **Active events** column from `activeEventCount`.
- Localized copy for Name filter, sort/direction, active column, and Export label (copy only for step 03).
- Ladle stories updated; typecheck/lint clean.

**Non-Goals:**

- Sales-export page, CSV, or wiring the Export `Link` href (step 03 owns the action + route).
- Changing events / featured-partner search placeholders or list sort.
- Client-side table sorting or HeroUI `Select` for sort/dir.
- Domain/SQL changes (unless a tiny type import fix).
- BDD/e2e (step 04).

## Decisions

1. **Partner-specific list query parse, shared builder extended**
   - **Choice:** Add `parseAdminPartnersListQuery` (or equivalent) that spreads `parseAdminListQuery` and reads `sort` ∈ `{name,created,events}` and `dir` ∈ `{asc,desc}`. Invalid/missing values → treat as “no explicit sort” (domain default). Extend `buildAdminListQueryString` (and `adminListPageRedirectPath` call sites for partners) to optionally emit `sort`/`dir`. Do **not** put sort on the events list path.
   - **Rationale:** Mirrors `parseAdminUsersListQuery`; keeps events callers unchanged. Builder extension is shared so pagination/search can pass the same shape.
   - **Alternatives:** Always parse sort in base `parseAdminListQuery` — rejected (events would carry unused params); duplicate builders — rejected.

2. **URL `dir` vs domain `desc`**
   - **Choice:** Query param is `dir=asc|desc`. Route maps `dir === "desc"` → `desc: true` when calling `listPartners`. Omit both `sort` and `dir` from the URL when showing the default last-created-desc view (bookmarks stay clean). When the admin picks an explicit sort, always include both `sort` and `dir` in the URL.
   - **Rationale:** Matches step-plan Spec Delta and step 01’s `desc` boolean; avoids ambiguous bare `sort=created` without direction.
   - **Alternatives:** Pass `desc=1` — less readable; always emit default params — noisier URLs.

3. **UI control for sort/direction: native GET form**
   - **Choice:** On `AdminPartnersListPage`, a compact GET form (or extension of the search form) with native `<select className="admin-native-select">` for sort and direction, HeroUI `Label`/`Button`, hidden fields for params that must survive submit (`q` when sort form is separate, or `sort`/`dir` when search submits). Prefer one combined filter bar: search `q` + sort + dir + submit, so one submit preserves everything.
   - **Rationale:** Native-first (§14); SSR navigation; no client sort state. Links-only toggles also work but selects match “choice field” guidance and existing `.admin-native-select` theme.
   - **Alternatives:** Pure `Link` chips — acceptable fallback if form chrome is awkward; HeroUI `Select` — rejected (§14).

4. **`AdminSearchForm` placeholder/label override**
   - **Choice:** Optional `placeholder?: string` (and use it for both `Label` and `Input` placeholder). Partner page passes `copy.partnersSearchPlaceholder` (or reuse `tableName` / new key **Name**). Events/featured keep default `searchPlaceholder`.
   - **Rationale:** Minimal shared-component change; step plan requires override prop.
   - **Alternatives:** Fork a `AdminPartnersSearchForm` — unnecessary duplication.

5. **Table row type + Active events column**
   - **Choice:** Type `AdminPartnersTable` / list page props as `PartnerListItem[]` (or `{ …Partner; activeEventCount: number; eventCount?: number }`). Add column header from copy (`tableActiveEvents`); cell shows `activeEventCount` as plain text. Do not show total `eventCount` in the column unless copy later asks — step plan says active column; optional total is not required.
   - **Rationale:** Domain already returns both; UI Spec Delta only requires active count.
   - **Alternatives:** Show `active / total` — deferred unless product wants it in hardening.

6. **Export copy without dead link**
   - **Choice:** Add `exportAction` (DE/EN) to `AdminCopy` now. Do **not** render the Export toolbar/row `Link` until step 03 (route would 404). Stories may mention the string if needed; list UI ships filter/sort/column only.
   - **Rationale:** Step 02 deliverable includes the label string; step 03 explicitly adds the action + route.
   - **Alternatives:** Link to `/admin/partners/export` early — rejected (broken until 03).

7. **Default control display when URL has no sort**
   - **Choice:** Controls visually select “Last created” + “Descending” when params absent; submitting without changing them MAY either omit params (preferred) or emit `sort=created&dir=desc` — prefer **omit** on first paint / when matching default so domain omit-sort path stays used.
   - **Rationale:** Step 01: omit `sort` → `created_at desc, id desc`. Emitting explicit created+desc is behaviorally equivalent but changes bookmark shape; omit keeps parity with step 01 default scenario.

## Risks / Trade-offs

- **[Risk] Search GET drops sort/dir** → Mitigation: combined form or hidden inputs; verify pagination + search manually.
- **[Risk] `AdminPartnersTable` still typed as `Partner[]` breaks on extra fields** → Mitigation: switch to `PartnerListItem`; typecheck.
- **[Risk] Parent guide says sort by “number of active events”; domain sorts by total `eventCount`** → Mitigation: UI label for sort option is **Most events** (total), column is **Active events**; document; do not silently remap `sort=events` to active.
- **[Risk] Extending shared `buildAdminListQueryString` affects users redirect** → Mitigation: optional fields only; existing callers omit them.
- **[Trade-off] Export string without visible control** → Slightly odd until step 03; avoids 404.

## Migration Plan

1. Add copy keys + query parse/build + route wiring to `listPartners({ sort, desc })`.
2. Update search form prop, list page sort UI, table column, stories.
3. Run typecheck, lint, stories; manual admin partners check.
4. Mark step done in parent guide after merge.
5. Rollback: revert `apps/web` UI/query changes; domain untouched.

## Open Questions

- None blocking. Sort-by-active remains deferred (step 01 Decision 3). Export `Link` placement (toolbar vs row) locked in step 03 as list-level toolbar (all-events report).
