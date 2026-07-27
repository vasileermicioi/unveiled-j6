## Context

Parent feature: Event form & detail UX (`.dev-plan/current-iteration/event-form-and-detail-parent-guide.md`). Child step 03 — final slice; depends on 01–02 (archived/done).

Runtime behavior already matches parent release criteria:

- Shared checkbox multi-select for admin languages (search on), age groups (search off), series weekdays; single-value fields stay on native `AdminFormSelect`.
- Add/series partner change prefills address + soft-fail Nominatim → map; edit does not overwrite.
- Public `/events/:id` lg+ two-row layout + partner logo/name attribution strip (not a hero badge).

What remains is the **verification and documentation layer**:

- `admin-events.feature` / `event-discovery.feature` do not yet describe the new multi-select, prefill, two-row, or attribution scenarios.
- Playwright + coverage-matrix lack rows for those behaviors.
- `ui-component-map.md` Event detail entry still describes the pre-02 identity+hero stacking (category // partner eyebrow, description under title, hero filling identity column).
- `design-system.md` Form controls still prefer `select` “single or multi” and do not name checkbox multi-select as the multi-value pattern.
- `AdminFormSelect` still ships `selectionMode="multiple"` + a deferral story note from step 01; no production call sites use multiple.
- Nominatim outcome (unit-tested soft-fail; live browser Nominatim not in CI) is only in the parent Risks note — not operator-facing in `DEPLOYMENT.md`.
- Parent guide still lists step 03 open.

Constraints: `docs/product/` is behavioral SoT (AGENTS.md); OpenSpec under `openspec/specs/` is a planning mirror only; BDD proximity/role selectors only (`docs/product/testing/bdd-and-e2e.md`); no partner lat/lng schema; no Phase 6+ booking changes; no new feature work beyond polish/fixes found while hardening.

## Goals / Non-Goals

**Goals:**

- Align Gherkin + Playwright (+ coverage-matrix) with shipped admin form and public detail UX.
- Sync UI component map, design-system form-control rules, gaps decision row, and i18n inventory if needed.
- Remove dead `AdminFormSelect` multiple API/stories.
- Record geocode/Nominatim operator note (address still prefills on soft-fail; no new secrets).
- Close parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- New admin or detail UX beyond 01–02.
- Partner `lat`/`lng` columns or server-side geocode.
- Partner portal / check-in.
- Replacing single-value native `<select>` with HeroUI `Select`.
- Changing booking/checkout POST semantics, waitlist, or gallery behavior.
- Expanding e2e into live Nominatim network asserts (soft-fail + address prefill is enough).

## Decisions

1. **Docs-and-BDD first, then cleanup**
   - **Choice:** Update product feature files → ui-component-map / design-system / gaps (+ i18n if needed) → Playwright + coverage-matrix → `AdminFormSelect` multiple removal → DEPLOYMENT/parent geocode note → parent close-out.
   - **Rationale:** Step brief; e2e titles must match Gherkin; dead-code cleanup after call-site confirmation.
   - **Alternatives:** Cleanup first (risk of leaving SoT stale); e2e before Gherkin (title drift).

2. **Gherkin: add focused scenarios; keep existing titles stable**
   - **Choice:** Add (or extend) scenarios for: languages searchable checkbox multi-select; age groups checkbox multi-select without search; series weekdays checkbox multi-select; add/series partner address+map prefill; edit partner change does not overwrite location; guest/member sees two-row lg+ detail; guest sees partner name+logo in identity area (not on hero). Prefer new scenario titles that match step Spec Deltas / parent release criteria; do not rename unrelated existing scenarios.
   - **Rationale:** Coverage-matrix couples `Scenario: …` titles to Playwright; step Spec Deltas require BDD coverage rows.
   - **Alternatives:** Only amend comments in existing create/edit scenarios — weaker agent SoT; merge everything into one mega-scenario — harder matrix mapping.

3. **Playwright: address prefill required; live Nominatim optional/deferred**
   - **Choice:** Assert address field updates on add/series partner change and that edit partner change leaves address (and visible lat/lng fields if exposed) unchanged. Assert languages/age groups present as checkbox groups (labels + checked state / POST-relevant names) with proximity selectors — not CSS-module hashes. For public detail: assert partner name near title and logo `img` (or equivalent) when seed partner has logo; assert logo is not inside the hero media region. Do **not** require Nominatim network success in CI; if map-pin update is flaky, record named deferral in coverage-matrix for geocode-map scenario only, with owner = this feature / step 03 and reason = live Nominatim CORS/rate-limits not exercised in CI (parent Risks already note this).
   - **Rationale:** Step verification + parent risk; address prefill must still be covered.
   - **Alternatives:** Mock Nominatim in Playwright (heavier harness); skip all prefill tests (violates step brief).

4. **Design-system narrative: checkbox multi-select preferred for multi-value**
   - **Choice:** Rewrite the Form controls paragraph in `design-system.md` so: single-value choice → native `<select>`; multi-value allowlists (onboarding preferences, admin event languages/age groups, series weekdays) → native checkbox multi-select (optional client-side search); native `<select multiple>` is **not** the preferred pattern for new multi-value admin fields. Keep existing exceptions (Pica, geo picker, MDXEditor, better-auth-ui). OpenSpec `design-system` gets an **ADDED** requirement (main spec has no Form controls requirement yet) mirroring that rule.
   - **Rationale:** Step Spec Delta; AGENTS.md §14 native-first; OpenSpec guidance — new concerns → ADDED.
   - **Alternatives:** MODIFY a non-existent requirement (archive merge fails); ban `<select multiple>` entirely in code (gallery bulk-select history may still mention multi-select elsewhere — scope this guidance to preference/admin multi-value allowlists).

5. **`AdminFormSelect` multiple: delete if unused**
   - **Choice:** Confirm no production `selectionMode="multiple"` call sites; remove multiple props/branch from `AdminFormSelect.tsx`; replace or delete the Multiple story (point readers at `CheckboxMultiSelect` / language stories). Keep single-value `AdminFormSelect` unchanged.
   - **Rationale:** Step 01 deferred cleanup; stories already note step-03 cleanup.
   - **Alternatives:** Keep multiple for “just in case” — dead API contradicts design-system guidance.

6. **Gaps + DEPLOYMENT geocode note**
   - **Choice:** Append one short `gaps-and-decisions.md` row covering: checkbox multi-select for multi-value admin/onboarding lists; add-only partner address/map prefill via client Nominatim soft-fail; public detail two-row + partner attribution. In `DEPLOYMENT.md`, add a brief admin-events note: partner prefill uses browser Nominatim (`geocodeBerlinAddress`) with Berlin viewbox; soft-fail leaves address filled and map unchanged; no API key / env var; CI does not require live Nominatim. Mirror the same outcome in parent Risks if still open.
   - **Rationale:** Step deliverables; operators need no-secret clarity.
   - **Alternatives:** Parent Risks only — operators miss it; add Nominatim key env — unnecessary and out of scope.

7. **i18n inventory: touch only if new user-visible strings**
   - **Choice:** Skim partner attribution labels / multi-select filter placeholders introduced in 01–02; index in `content-i18n-inventory.md` only if missing. Do not dump full copy.
   - **Rationale:** Step brief “only if”.
   - **Alternatives:** Always rewrite inventory sections — noise.

8. **UI component map Event detail rewrite**
   - **Choice:** Update the Event detail row to describe: lg+ row 1 = identity (category-only eyebrow → title → partner logo+name strip → location) | checkout; row 2 = hero | Markdown description; DETAILS / LOCATION / gallery below; partner attribution not overlaid on hero. Keep existing booking-eligibility / qty / gating notes.
   - **Rationale:** Step 02 MODIFIED “Checkout-focused detail documented” already requires this; product map is still stale.
   - **Alternatives:** Leave map and only fix Gherkin — agents reading the map still build the old layout.

9. **Parent close-out in the same change**
   - **Choice:** After verification, mark step 03 done in the parent guide; confirm 01–02 remain done; walk Release Criteria (true or explicit named deferral for live Nominatim map pin only).
   - **Rationale:** Step closes the feature.
   - **Alternatives:** Leave parent open until live Nominatim is CI-stable — blocks release under Non-Goals.

## Risks / Trade-offs

- **[Risk] Live Nominatim flaky in e2e** → Mitigation: Decision 3 — require address prefill; defer map-pin network assert with named matrix row.
- **[Risk] Shared staging DB / missing logo fixtures for attribution** → Mitigation: use seeded partner with logo when available; skip or defer logo assertion with owner if fixture cannot guarantee logo URL; name-only strip still assertable.
- **[Risk] Coverage-matrix title drift** → Mitigation: Decision 2 — stable new titles; update matrix in the same PR.
- **[Risk] Gallery/admin docs still mention native multi-select for photo selection** → Mitigation: Decision 4 scopes the new preference to multi-value allowlists; do not rewrite gallery selection rules in this step.
- **[Trade-off] No runtime feature work** → If hardening finds a clear 01–02 bug (e.g. edit overwrite regression), fix narrowly; do not expand into new UX.

## Migration Plan

1. Land Gherkin + product docs + e2e/coverage-matrix + AdminFormSelect cleanup + DEPLOYMENT/parent notes.
2. Run lint/typecheck; targeted Playwright when env allows (else document skip with assertions committed).
3. Mark parent guide step 03 + Release Criteria; sync OpenSpec main specs on archive.
4. No DB, env, or deploy migration; no new secrets.
5. Rollback: revert docs/e2e/cleanup commits; runtime UX from 01–02 unchanged by this step’s happy path.

## Open Questions

- None blocking for planning. If targeted e2e cannot run at apply time, record skip reason in the PR/handoff and keep assertions + matrix rows committed (pass or explicit deferral).
