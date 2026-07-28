## Context

Parent feature: Event form polish (`.dev-plan/current-iteration/event-form-polish-parent-guide.md`). Child step 01 — first slice; no upstream dependency.

Today `events.languages` is an optional text array. Admins collect it via searchable `CheckboxMultiSelect` in `EventAdminBaseFields` (also series create). There is no column or UI for “this event has no spoken-language requirement.” Public detail (`EventDetailPage`) only renders a Languages row when `event.languages?.length > 0`. Member feed filters are category/partner/date only (`listMemberFeedEvents`) — no language filter UI yet, but the parent guide requires forward-compatible matching semantics.

Constraints: SSR form POST; AGENTS.md §14 native checkbox (not HeroUI `Checkbox`); business logic in `@unveiled/db` / shared helpers; yellow theme / Work Sans only; do not build a new language filter dropdown; series create must share the same base-field behavior.

## Goals / Non-Goals

**Goals:**

- First-class `language_independent` boolean on `events` (default false).
- Admin checkbox that hides languages multi-select and forces `languages = null` on save when checked.
- Public detail shows language-independent clearly (label or omit) — never a fake or empty language list as “none.”
- Shared predicate/helper so any language filter treats language-independent events as matching every language; unit/integration coverage even without UI.
- Product docs/Gherkin/i18n/schema overview updated for the flag.

**Non-Goals:**

- Address/map changes (step 02).
- Image retention on validation error (step 03).
- New member-facing language filter UI.
- Onboarding/profile preferred-languages redesign.
- Sentinel values inside `languages[]` instead of a boolean column.
- Partner portal event CRUD.

## Decisions

1. **Boolean column `events.language_independent NOT NULL DEFAULT false`**  
   - **Why:** Keeps null/empty `languages` meaning “unset / none selected” for language-specific events; filter “match all languages” is a clear flag, not a magic array. Parent guide already decided this over a sentinel in `languages[]`.  
   - **Alternatives:** Sentinel code in `languages` (overloads array semantics); nullable tri-state (harder filters).

2. **When `language_independent = true`, persist `languages = null` (domain-enforced)**  
   - **Why:** Single source of truth in `createEvent` / `updateEvent` (and series path) so stale POST checkbox values cannot leave orphan language codes. Form parser may also clear, but DB layer MUST coerce.  
   - **Alternatives:** UI-only clear (racey / bypassable).

3. **Native checkbox + client show/hide of languages multi-select**  
   - **Why:** AGENTS.md §14; progressive enhancement with SSR defaults (`defaultChecked` from `eventToFormDefaults`). Prefer a tiny island or existing client pattern on `EventAdminBaseFields` so checking the box hides the multi-select without a full page round-trip; submit still works if JS fails if server ignores languages when the flag is on.  
   - **Alternatives:** Full SSR round-trip toggle page (heavy); HeroUI Checkbox (forbidden for this field).

4. **Form field name `language_independent` (checkbox value `"on"` / presence)**  
   - **Why:** Matches existing admin boolean patterns (`barrier_free` select today, but checkbox presence is fine for a true boolean flag). Parse to boolean in route helpers → `EventFormValues.languageIndependent`.  
   - **Alternatives:** Hidden input + JS only (weaker without JS).

5. **Discovery: export a pure match helper + optional SQL/predicate hook**  
   - **Why:** No language filter UI yet — implement `eventMatchesLanguageFilter(event, selectedLanguages)` (or equivalent) where language-independent ⇒ true for any non-empty filter; otherwise intersect `languages`. Wire into `listMemberFeedEvents` only if a `language`/`languages` filter param is added; otherwise document + unit-test the helper so step consumers and future UI reuse it. Prefer not to add unused query params to the feed API in this step.  
   - **Alternatives:** Add dead `language` query param now (scope creep); wait until UI exists (loses the matching contract).

6. **Detail metadata: dedicated copy key for language-independent**  
   - **Why:** When flag is true, show label under DETAILS (same slot as languages) using **Language-independent** / **Sprachunabhängig**; when false, keep join of `languages` when non-empty; never show an empty Languages row.  
   - **Alternatives:** Omit languages entirely with no label (less clear for exhibitions).

7. **Series create shares `EventAdminBaseFields`**  
   - **Why:** Same checkbox/hide behavior and parser path as single-event create/edit; series persistence goes through the same create helpers.  
   - **Alternatives:** Series-only field (drift).

8. **Copy keys: `languageIndependentLabel` + short hint**  
   - **Why:** Parent naming decision; hint mentions art exhibitions / no spoken-language requirement. Inventory in `content-i18n-inventory.md` + `admin-content.ts` (and public detail strings if separate from admin).  
   - **Alternatives:** “No spoken language” (rejected in parent guide).

## Risks / Trade-offs

- **[Risk] Stale POST still sends `languages[]` while checkbox checked** → Domain coerce to null; UI hide is UX only.  
- **[Risk] Existing events with empty/null languages stay language-specific (`false`)** → Correct; admins must opt in. No backfill.  
- **[Risk] Client hide without island leaves languages visible if JS fails** → Acceptable if server ignores languages when flag on; document in verification.  
- **[Trade-off] Helper without feed wiring** → Semantics exist before UI; slight “dead code” until a filter ships — preferred over inventing filter UI here.  
- **[Trade-off] Boolean + null languages vs packing “ALL” into array** → Extra column; clearer filters and admin UX.

## Migration Plan

1. Add Drizzle column + generate/apply migration (`language_independent boolean not null default false`).  
2. Extend create/update/types/seed; add match helper + tests.  
3. Wire admin parse/defaults/UI + public detail + copy.  
4. Update product docs (Gherkin, schema overview, i18n, gaps).  
5. `bun run lint` / `typecheck` / focused tests; manual admin smoke.  
6. Rollback: revert code + down-migration (or leave column unused); no destructive data rewrite.

## Open Questions

- None blocking. If a language filter param already exists somewhere outside the member feed, wire the helper there in the same PR; otherwise ship helper-only.
