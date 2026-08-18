## Context

Parent feature: Featured events manager (`.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md`), step 03 of 03 — docs and e2e. See `proposal.md` for motivation. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria for the manager (steps 01–02 done):

- List POST persists `reorderFeaturedEvents` from repeated `eventIds`.
- Bulk confirm: `/:locale/admin/featured/remove?eventIds=`; legacy `/:locale/admin/featured/:eventId/remove` still 302s to the bulk URL.
- Island `AdminFeaturedEventsManager`: Surface rows (`.admin-featured-events__row`), native checkbox, Save order / Remove selected, no gallery or per-row delete.
- Copy keys already exist: `featuredReorderHint`, `featuredSaveOrderAction`, `featuredRemoveBulkAction`, `featuredSelectLabel`.

What remains is the **verification and documentation layer**. Product Gherkin still uses `/admin/featured/:eventId/remove`, “gallery or remove actions,” and `Featured list MAY also offer a convenience gallery shortcut`. Sitemap still lists the single-id remove route. Playwright remove still clicks a per-row `role=link` named Remove and uses `getByRole("row")` on a list that is no longer a table.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim; proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); no `data-testid`; no client mutation tests; do not implement UI if step 02 left gaps; HeroUI/theme rules unchanged.

## Goals / Non-Goals

**Goals:**

- Bind Gherkin, sitemap, UI map, i18n inventory, gaps, image-uploads §8a, DEPLOYMENT demo script, coverage matrix, and Playwright to the shipped manager.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- New catalog helpers, routes, or island behavior.
- Featured partners e2e or Discover copy.
- Empty-list Playwright (shared-DB empty state is brittle; partners already defer this).
- Documenting the single-id 302 as the primary remove path (keep the redirect in code).
- Adding `data-testid` or HeroUI `Select`/`Checkbox` for these scenarios.

## Decisions

1. **Docs-and-Gherkin first, then Playwright, then matrix, then close-out**
   - **Choice:** Update `admin-events.feature` + sitemap / UI map / i18n / gaps / image-uploads §8a / DEPLOYMENT → rewrite featured Playwright → coverage-matrix rows → stale-wording grep → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; avoid matrix title drift.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **Locked Gherkin / Playwright titles**
   - **Choice:** Keep existing titles where they already match; add one **product** reorder title copied from partners (OpenSpec keeps the existing scenario name `Reorder featured events`; Gherkin/Playwright use the longer title):
     - `List featured events`
     - `Add by searching existing events` (unchanged; still covered inline in the remove flow)
     - `Admin remove from featured keeps catalog event`
     - `Admin reorders featured events by drag and drop` (**new** Gherkin/Playwright title)
     - `Empty featured list` (Gherkin only; no new e2e)
     - `Gallery manage is available from the Events catalog` (body only)
   - **Rationale:** Step brief names the reorder title verbatim; partners already use the same pattern. OpenSpec archive forbids dropping `Reorder featured events` from the MODIFIED block.
   - **Alternatives:** Rename the OpenSpec scenario (archive rejects the omit). Use the short OpenSpec name in Playwright (would diverge from partners and the step-plan task).

3. **List Gherkin mentions Save order / Remove selected when non-empty; list Playwright stays chrome-only**
   - **Choice:** Gherkin list: thumb, title, partner, date; Save order and Remove selected **when the list is non-empty**; missing/broken thumbs do not block select or remove (drop “gallery or remove actions”). Playwright `List featured events` keeps tab-label + heading assertions (empty seed: heading + add path is enough). Save order / Remove selected visibility is asserted in reorder and remove when those tests have created rows.
   - **Rationale:** Step brief; seed may have zero featured rows; list test must not start requiring R2/create.
   - **Alternatives:** Create-and-add inside list (needs R2, duplicates remove). Fail list when chrome is missing on empty seed (false negative).

4. **Gallery scenario MUST NOT claim a Featured shortcut; assert absence without featuring**
   - **Choice:** Replace `And the Featured list MAY also offer a convenience gallery shortcut` with `And the Featured events list does not offer a gallery-manage shortcut`. Playwright gallery test: keep Events list → gallery manage (non-featured OK); also `goto` `/admin/featured` and expect `toHaveCount(0)` for links named `Galerie-Fotos verwalten` / `Manage gallery photos`. After adding an event in the remove test, repeat that zero-count on the non-empty list (covers “with at least one featured event”).
   - **Rationale:** Step Spec Delta; cheap negative assert; empty featured still proves no shortcut control in chrome.
   - **Alternatives:** New Gherkin scenario `Featured list has no gallery shortcut` (extra Playwright title). Leave MAY (rejected — SoT would still document a removed control).

5. **Featured list locators are Surface rows, not `role=row`**
   - **Choice:** On `/admin/featured`, target `.admin-featured-events__row` filtered by event title (same layout-class pattern as `.admin-featured-partners__tile`). Add-results (`/admin/featured/add`) still uses table `role=row`. Checkbox: native input inside the row (`.admin-featured-events__checkbox`), `check({ force: true })` like partners. Remove selected: `getByRole("link", { name: /auswahl entfernen|remove selected/i })` when ≥1 selected (disabled control is a Button — do not click that). Confirm: `toHaveURL(/\/admin\/featured\/remove/)` then confirm POST; do not click a per-row Remove link.
   - **Rationale:** Step 02 dropped `AdminFeaturedTable`. Using `getByRole("row")` on the list will fail. Layout classes are allowed proximity/layout selectors; partners already do this. No `data-testid`.
   - **Alternatives:** Restore HeroUI `Table` solely for `role=row` (out of scope / UI gap belongs in 02). `data-testid` (forbidden).

6. **Reorder e2e mirrors partners mouse-drag; assert relative order after reload**
   - **Choice:** Create two catalog events (R2 skip), add both to Featured. Drag row A onto row B with `page.mouse` (center of `.admin-featured-events__row`, `steps: 12`, PointerSensor distance 8). Save order enabled → click **Save order** / **Reihenfolge speichern**. Reload `/admin/featured`. Assert the **relative** order of the two created titles in `.admin-featured-events__row` matches the post-drag order (ignore other seeded featured rows). `test.setTimeout(120_000)` like partners. Skip when `E2E_ADMIN_*` / R2 missing (`r2Configured()`), never “UI not built.”
   - **Rationale:** Step brief: “mirror partners mouse-drag + Save order; assert order after reload.” Relative order survives a shared DB that already has featured rows.
   - **Alternatives:** Assert absolute first-row identity (flaky with seed). Keyboard sortable only (weaker match to the partners test we are copying).

7. **Coverage matrix: four featured rows + gallery stays pass**
   - **Choice:**
     - `List featured events` → same spec, notes: tab labels; Save order / Remove selected covered in reorder/remove when non-empty.
     - `Add by searching existing events` → still inline in the remove flow (`pass`, R2 env-skip).
     - `Admin remove from featured keeps catalog event` → notes: checkbox + bulk confirm; list-row thumb proximity; not `role=row`.
     - `Admin reorders featured events by drag and drop` → **new** `pass` row, `E2E_ADMIN_*` + R2, HTML5 DnD via Playwright.
     - Gallery-from-Events row stays `pass`; notes: Featured is not an entry point.
   - **Rationale:** Step deliverables. Empty featured list stays Gherkin-only (no new skip row required).
   - **Alternatives:** Dedicated add-by-search spec (redundant). Empty-list e2e (shared-DB brittle).

8. **Sitemap: bulk URL is the documented remove; list notes drag + Save order**
   - **Choice:** `/admin/featured` notes: drag reorder + Save order POST; checkbox bulk remove; tab label unchanged. Replace `/admin/featured/:eventId/remove` with `/admin/featured/remove?eventIds=` (catalog event kept). Do not add a sitemap row for the legacy 302. List + add query params stay.
   - **Rationale:** Step scope; 302 is a compatibility shim, not the primary path.
   - **Alternatives:** Document both URLs (agents keep linking per-row remove).

9. **Stale convenience-shortcut wording is in scope even outside the task bullet**
   - **Choice:** Update `gaps-and-decisions.md` (gallery entry row still says Featured MAY keep a shortcut), `image-uploads.md` §8a, and DEPLOYMENT Event Gallery demo step 3, in the same change as Gherkin. UI map: drop `AdminFeaturedTable`; describe table-equivalent rows + drag + Save order + checkbox bulk remove; no gallery shortcut. I18n inventory: list the four `featured*` reorder/select/bulk keys next to the existing `featuredPartners*` grid keys.
   - **Rationale:** Spec Delta names those files; leaving MAY in gaps/DEPLOYMENT/image-uploads would keep a greppable lie.
   - **Alternatives:** Only files listed in the Implementation task bullets — still leaves SoT drift the Spec Delta forbids.

10. **OpenSpec mirror vs product SoT**
    - **Choice:** This change’s `admin-events` delta is the planning contract. Apply updates `docs/product/` as SoT. Do not treat archived OpenSpec specs as behavioral SoT. After apply, mark the parent step done.
    - **Rationale:** AGENTS.md / step Cleanup.
    - **Alternatives:** Sync `openspec/specs/` only — agents would still follow stale Gherkin.

## Risks / Trade-offs

- **[Risk] `getByRole("row")` leftovers on the featured list** → Mitigation: rewrite only featured-list interactions to `.admin-featured-events__row`; keep `role=row` on add-results and Events catalog.
- **[Risk] Drag does not enable Save order (PointerSensor distance 8 / checkbox capture)** → Mitigation: drag from row center (title cell), not the checkbox; copy partners `mouse.move` steps; fail the test rather than add `data-testid`.
- **[Risk] Shared DB already has many featured rows, so “first row” assertions flake** → Mitigation: assert relative order of the two events this test created; remove test filters by unique created title.
- **[Risk] R2 / `E2E_ADMIN_*` env-skip masks a docs/e2e title mismatch** → Mitigation: titles and matrix are committed regardless of skip; skip reason stays env-only, never “UI not built”; DEPLOYMENT demo remains the manual smoke.
- **[Risk] Stale `:eventId/remove` / `AdminFeaturedTable` / “MAY also offer a convenience gallery” survives in an unlisted file** → Mitigation: repo grep after edits (see tasks).
- **[Trade-off] List Playwright does not assert Save order on empty seed** → Acceptable; reorder/remove cover chrome when rows exist; Gherkin qualifies “when non-empty.”
- **[Trade-off] Legacy 302 stays unpublished in the sitemap** → Bookmarks still work; SoT points agents at the bulk URL.

## Migration Plan

1. Land docs + e2e together (no schema/API migration).
2. No rollback beyond reverting the docs/e2e commit; steps 01–02 UI/routes remain correct.
3. After merge: mark step 03 + parent guide done; archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — step 02 UI is the source of locators and copy; empty-list e2e stays deferred like Featured partners.)_
