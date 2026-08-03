## Context

Parent feature: browse events filters (`.dev-plan/current-iteration/02-browse-events-filters-parent-guide.md`), step 02 — UI, copy, BDD/e2e, hardening. Step 01 is done/archived: domain `title` + today-floor / future-only window; URL helpers and feed/map routes already pass `title` into list helpers.

Current UI state:

- **`EventFeedFilters`**: category + partner selects, `from`/`to` date TextFields — **no title field**; date inputs have **no `min`**.
- **Reset**: secondary `Link` to bare `action` path (list or map) — clears all query params once form fields are the only filter source.
- **Copy** (`event-feed-content.ts`): no event-name label/placeholder keys.
- **Stories**: default + filters-applied (category/partner/dates) — no title story.
- **OpenSpec / Gherkin**: query contract already has title + today floor; page-level OpenSpec still says “today only” in places; product `event-discovery.feature` lacks event-name scenario and today-floor date narrative.
- **E2E**: category/partner via URL; date range via form fill; reset/map scenarios do not cover `title`.

Constraints: HeroUI chrome + native controls for filters; Tailwind layout-only; yellow backdrop unchanged; SSR GET forms; proximity/layout selectors in Playwright; keep category filter.

## Goals / Non-Goals

**Goals:**

- Event-name text control submitted as `title` via GET on list and map filter forms.
- Date inputs advertise `min` = Berlin today YMD (client hint); server clamp remains SoT.
- Reset clears title + category + partner + dates; map mirrors the same filters including title.
- DE/EN copy, Gherkin, coverage matrix, Playwright aligned; optional Ladle story with title applied.
- Align stale “today-only” feed-page OpenSpec / Gherkin language with all-upcoming default from step 01.

**Non-Goals:**

- Domain query changes (already shipped).
- Removing category; free-text partner search; sort UI; multi-datetime; admin list filters; Discover past featured behavior.

## Decisions

1. **Title field mirrors admin list search chrome**
   - **Choice:** HeroUI `TextField` + `Input type="search"` with `name="title"`, `defaultValue={query.title ?? ""}`, labeled via new copy key (`titleLabel` / placeholder). Place it as the **first** filter field.
   - **Rationale:** Matches `AdminEventsListFilters` pattern; native-first; param name already `title`.
   - **Alternatives:** Raw `<input>` only (rejected — inconsistent with existing TextField dates); HeroUI-only without native search type (rejected — type=search is fine).

2. **Berlin today `min` computed on SSR and passed as prop**
   - **Choice:** Add optional/required `minDate: string` (YYYY-MM-DD) prop to `EventFeedFilters`; routes set `minDate={getBerlinCalendarDate(new Date())}` from `@unveiled/db`. Apply `min={minDate}` on both date `Input`s. Do **not** invent a client-only clock island.
   - **Rationale:** Same Berlin helper as domain clamp; SSR-only; no hydration clock skew beyond request time (acceptable for a hint).
   - **Alternatives:** Hardcode in component via `Intl` in render (works but duplicates Berlin helper); client island for live midnight rollover (rejected — overkill).

3. **Filter grid layout stays Tailwind-only**
   - **Choice:** Extend the filter grid to accommodate five controls (e.g. `sm:grid-cols-2 lg:grid-cols-3` or `lg:grid-cols-5` / wrap) without theme color classes — layout utilities only.
   - **Rationale:** Hard rule §9; five fields need room on wide screens without crowding Apply/Reset.
   - **Alternatives:** Separate row for title only (also fine if grid feels cramped — prefer one grid first).

4. **Reset remains bare-path Link — no hidden fields needed**
   - **Choice:** Keep `href={action}` reset; document that Apply submits current fields including title. E2E: apply title (+ optional dates), click Reset, assert URL has no `title`/`category`/`partnerId`/`from`/`to` and upcoming scope label returns.
   - **Rationale:** Already correct; title field just participates.
   - **Alternatives:** Explicit clear POST (rejected — GET-only filters).

5. **Product + OpenSpec narrative catch-up in this change**
   - **Choice:** Update `event-discovery.feature` (add Filter by event name; tighten Reset / Map / date range with future-only + today floor); update OpenSpec delta for authenticated feed page (all upcoming, include `title` in query params + pagination), filtered map, list↔map preserve filters; mark step 02 done in parent guide.
   - **Rationale:** Step plan Spec Delta + cleanup; closes the feature.
   - **Alternatives:** Leave stale “today only” in OpenSpec page requirement (rejected — contradicts shipped query + product parent guide).

6. **E2E strategy**
   - **Choice:** Add “Filter by event name” (and optionally “Event name filter control”) using label fill + Apply **or** URL `?title=` consistent with category/partner patterns; assert matching seed title visible and a non-matching seed absent. Assert date `min` equals Berlin today when practical via `input[type=date]` attribute. Extend reset to clear a `title` param. Map scenario: include `title` in preserved query when cheap.
   - **Rationale:** BDD contract; proximity selectors; seed titles already stable.
   - **Alternatives:** Only URL-based title tests without form control assertion (weaker for ADDED UI requirement).

## Risks / Trade-offs

- **[Risk] Stale OpenSpec “today only” scenarios conflict with product all-upcoming** → Mitigation: MODIFIED requirement text + scenarios in this delta; Gherkin already mostly all-upcoming — keep them aligned.
- **[Risk] Date `min` vs browser locale / timezone if server Worker TZ ≠ Berlin** → Mitigation: always compute via `getBerlinCalendarDate`, never `toISOString().slice(0,10)`.
- **[Risk] Grid overcrowding on tablet** → Mitigation: responsive columns; visual check in Ladle.
- **[Trade-off] `min` is a hint only** → Users can still craft past `?from=` URLs; server clamp handles it (already tested in step 01).
- **[Trade-off] E2E env may be unavailable locally** → Document subset; still update specs so CI can run when env present.

## Migration Plan

1. No schema or domain migration.
2. Deploy UI + docs/e2e together; filter form gains a field (backward compatible GET params).
3. Rollback: revert commit; URL `?title=` still works headlessly from step 01.

## Open Questions

- None blocking. Sort controls remain deferred per parent guide.
