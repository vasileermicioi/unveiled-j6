## Context

After steps `01`–`02`, member account chrome uses `PageSectionHeader` with tabs above the title. Admin already places `AdminTabNav` above shell children (`AdminLayout`), but `AdminPageShell` still renders a bare `Heading` + optional muted subtitle in `admin-shell__intro` — visually a second header system on the same yellow backdrop (`.dev-plan/current-iteration/manual-test-admin-tabs.png`). Source brief: `.dev-plan/current-iteration/manual-test-account-ui-03-admin-page-headers.md`.

## Goals / Non-Goals

**Goals:**

- Admin page intros use shared `PageSectionHeader` (eyebrow + headline + rule).
- Stable shared Admin eyebrow from `admin-content` (DE/EN).
- Optional subtitle + actions remain usable below the header rule.
- Breadcrumbs remain available on nested pages; tabs stay above the title.
- Clean obsolete intro CSS only where the bare heading stack is gone.

**Non-Goals:**

- Profile layout / column width (step `02`).
- Admin table, search, or KPI redesign.
- Full product-doc / e2e / component-map sweep (step `04`).
- Moving or restyling admin tabs.
- Changing `wrapInCard` / overview unwrapped behavior beyond header chrome.

## Decisions

1. **Eyebrow = shared Admin label from `admin-content`**
   - **Choice:** Add a single localized string (EN: `Admin`, DE: `Verwaltung`) used as `PageSectionHeader` `eyebrow` for every `AdminPageShell` page. Do not derive the eyebrow from the current breadcrumb parent or per-route title.
   - **Rationale:** Parent guide asks for a stable eyebrow so admin titles do not invent per-page one-offs; breadcrumbs already communicate hierarchy. Matches member “Your account” style of a shell-level eyebrow.
   - **Alternatives:** Breadcrumb parent as eyebrow (rejected — nested pages would flicker eyebrow text and diverge from list pages without crumbs); per-page eyebrow keys (rejected — scope creep / copy sprawl).

2. **Compose subtitle under the rule in `AdminPageShell` (do not extend `PageSectionHeader` yet)**
   - **Choice:** Keep `PageSectionHeader` API as `eyebrow` + `headline` (+ optional `id`/`level`/`className`). Render optional `subtitle` as muted `Paragraph` **below** the header component (after the rule). Toolbar `actions` stay after the intro block as today.
   - **Rationale:** Profile and marketing deliberately omit page-level muted subtitles under the header; only admin needs them. Extending the shared component for a single caller adds API surface without a second consumer. If a future caller needs description-in-header, add an optional `description` prop then.
   - **Alternatives:** Optional `description` on `PageSectionHeader` now (acceptable later; deferred to keep this step minimal).

3. **Chrome order inside the shell**
   - **Choice:** `breadcrumbs` (if any) → `PageSectionHeader` (eyebrow = shared Admin label, headline = `title`) → optional subtitle → optional `actions` → card/overview children. Tabs remain in `AdminLayout` above all of this.
   - **Rationale:** Brief requires tabs above title and breadcrumbs preserved without breaking the header pattern. Putting crumbs above the ruled header keeps hierarchy readable and avoids overlaying chips on the rule.
   - **Alternatives:** Integrate breadcrumbs into the eyebrow (rejected — loses multi-crumb trails); put subtitle above the rule (rejected — breaks the shared eyebrow/headline/rule stack).

4. **CSS cleanup**
   - **Choice:** Remove or shrink `.admin-shell__intro` rules that only existed to tighten bare `Heading` spacing once the intro uses `.page-section-header`. Keep `.admin-shell__subtitle` (or equivalent) if max-width on muted subtitle is still useful. Do not touch table/card/KPI theme rules.
   - **Rationale:** Theme tokens already own the header look via `.page-section-header*`; duplicate intro typography would fight the shared pattern.
   - **Alternatives:** Leave dead intro CSS (rejected — drift risk).

5. **Stories**
   - **Choice:** Update `AdminPageShell.stories.tsx` so wrapped-card and overview stories show the new header chrome (eyebrow visible). Add a breadcrumb story only if cheap; not required for merge if list + overview cover the shell.
   - **Rationale:** Stories currently pass `title`/`subtitle` only; visual review should show PageSectionHeader, not bare H1.
   - **Alternatives:** Full visual regression suite (deferred to step `04` if needed).

## Risks / Trade-offs

- **[Risk] Large admin headlines feel loud on dense list pages** → Mitigation: accept shared `PageSectionHeader` scale (product intent); do not invent a smaller admin-only header token in this step.
- **[Risk] DE “Verwaltung” vs “Admin” nav label inconsistency** → Mitigation: eyebrow is page chrome; keep existing `navDashboard` / tab copy unchanged; document eyebrow keys for step `04` i18n inventory if needed.
- **[Risk] Nested pages with long titles + breadcrumbs feel tall** → Mitigation: keep existing gap scale; do not add extra promo chrome.
- **[Trade-off] openspec/specs are not product SoT** → Product `ui-component-map` / design-system bullets land in step `04`; this delta archives with the change.

## Migration Plan

1. Add Admin eyebrow strings to `admin-content` (DE/EN).
2. Replace bare title block in `AdminPageShell` with `PageSectionHeader` + subtitle below rule; keep breadcrumbs/actions/`wrapInCard`.
3. Trim superseded `.admin-shell__intro` CSS if safe.
4. Update AdminPageShell Ladle stories.
5. `bun run lint` + `bun run typecheck`; manual Partners + one breadcrumb page; spot-check Events/Users.
6. Mark step `03` done in parent guide; note doc bullets for step `04`.

No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Eyebrow locked to shared Admin / Verwaltung; subtitle stays shell-composed below the rule.
