## Context

Parent feature: Onboarding preference options (`.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`). Steps 01–03 are merged and archived:

- 01: 12 Berlin Bezirke; travel radius removed from capture (`max_distance` cleared on save)
- 02: Accessibility needed? + Yes/Ja; searchable preferred languages (DE/EN first; no Non-Verbal)
- 03: Interests `Other` + `interests_other` free text on onboarding + profile; admin detail row

Shipped UI/domain is ahead of releasable SoT:

- `onboarding.feature` / `profile.feature` still describe informal districts, travel radius, Non-Verbal languages, old accessibility wording, and no Other
- `content-i18n-inventory.md` still lists `radiusLabel`; schema overview lacks `interests_other` and still presents `max_distance` as an active field
- Coverage matrix / Playwright titles still say “districts and travel radius”; step 3 e2e asserts “how far”; step 4 asserts Required/Erforderlich
- `AdminUserDetailPage` still has a Radius preference row; `interests_other` already wired
- `DEPLOYMENT.md` onboarding demo still mentions travel radius
- `MAX_DISTANCE_*` / `radiusLabel` already removed from app code — dead-code cleanup is mostly docs/copy leftovers

Constraints: product SoT is `docs/product/` (not `openspec/specs/`); BDD proximity selectors only; no new product behavior; Europe/Berlin unchanged; parent non-goals (feed ranking, batch district migration, partner portal) stay out.

## Goals / Non-Goals

**Goals:**

- Align listed `docs/product/` surfaces with shipped preference UX from steps 01–03.
- Green onboarding + profile Playwright for the new controls (Scenario titles synced with Gherkin).
- Admin intel: omit travel distance as an active preference when null; keep `interests_other` when set; districts/languages reflect new allowlists.
- Remove remaining travel-radius inventory/demo copy; mark step 04 + parent feature complete.

**Non-Goals:**

- Feed ranking or preference-driven discovery.
- Batch migration of legacy district keys / dropping `max_distance` from JSONB via SQL.
- New onboarding steps or option-set changes beyond docs/tests alignment.
- Partner portal / check-in.
- Treating `openspec/specs/` as product SoT (deltas are planning contracts only).

## Decisions

1. **Gherkin ownership**
   - **Choice:** Edit existing scenarios in `onboarding.feature` (steps 2–4) and `profile.feature` Vibes in place. Rename Step 3 title away from “travel radius” (e.g. “districts” / “hangout districts”) so Playwright `test()` titles match. Expand step 2 to mention Other + free text; step 4 for searchable languages + Accessibility needed? wording.
   - **Rationale:** Step brief; Scenario titles are the e2e contract.
   - **Alternatives:** Add parallel scenarios and leave old ones (creates dead coverage noise).

2. **Docs sync surface**
   - **Choice:**
     - `content-i18n-inventory.md`: remove or mark unused `radiusLabel`; add/update accessibility section/option labels, language search chrome, interests Other + free-text label keys as shipped in `onboarding-content.ts`.
     - `schema-overview.md`: add `interests_other` (text, nullable); note `max_distance` as legacy/unused (not collected; cleared on preference saves).
     - `coverage-matrix.md`: rename Step 3 row + any stale preference rows to match new Scenario titles.
     - `gaps-and-decisions.md`: brief decision line for Bezirk list + travel removal + language picker (optional but preferred).
     - `DEPLOYMENT.md`: fix demo script step 3 (districts only; no travel radius).
   - **Rationale:** Parent release criteria; agents must not regenerate old travel/district copy.
   - **Alternatives:** Docs-only without e2e (fails parent release criteria).

3. **E2E fixtures and specs**
   - **Choice:**
     - Rename onboarding Scenario title for step 3; drop “how far” assertion; assert at least one official Bezirk beyond Mitte (e.g. `Neukölln` or `Friedrichshain-Kreuzberg`) and assert travel-radius copy is absent.
     - Step 2: assert Other / Sonstiges checkbox visible (happy-path helper may still skip Other to keep isolation simple; optional path covering Other + text is nice-to-have if cheap).
     - Step 4: assert Accessibility needed? / Barrierefreiheit benötigt? and Yes/Ja (not Required/Erforderlich); assert Non-Verbal absent; assert language search filter present or DE/EN options first via proximity.
     - Profile Vibes: assert no travel-radius control; touch a Bezirk / language / accessibility control as needed so the scenario reflects new fields; keep proximity selectors.
     - Update helpers in `e2e/fixtures/onboarding.ts` only if selectors break (location already selects Mitte only — keep; timing accessibility label may need Yes/Ja if helpers check it).
   - **Rationale:** Existing fixture structure; BDD proximity contract (`docs/product/testing/bdd-and-e2e.md`).
   - **Alternatives:** Full rewrite of helpers into page objects (out of scope).

4. **Admin preference display**
   - **Choice:** When `max_distance` is null, omit the Radius row entirely (do not show an empty “active” travel preference). When a legacy non-null value exists, may still show `N km` for intel. Keep `interests_other` row with null → empty-state omit pattern already used. District/language lists render raw stored keys (Bezirk names / language codes) — sufficient if `formatList` already joins them; no new mapping required unless labels are already localized elsewhere.
   - **Rationale:** Step brief “stop presenting travel distance as an active preference when null.”
   - **Alternatives:** Always hide Radius forever (also OK; slightly less intel for rare legacy values). Always show “—” for null (weaker — still presents travel as a current preference field).

5. **Dead code cleanup**
   - **Choice:** Grep for `radiusLabel`, `MAX_DISTANCE_*`, informal district shorthand in product docs/demo; delete unused exports if any remain. Do not invent new migrations.
   - **Rationale:** Step 01 already removed most runtime constants; this step finishes docs/demo leftovers.
   - **Alternatives:** Leave inventory rows marked unused only (acceptable if removal would break an external inventory process — prefer remove/mark unused per brief).

6. **openspec vs product SoT**
   - **Choice:** Update `docs/product/` as canonical merge target. Openspec deltas under this change reinforce e2e/doc alignment requirements; do not treat `openspec/specs/` as product SoT (AGENTS.md).
   - **Rationale:** Repo convention.

## Risks / Trade-offs

- **[Risk] Renaming Gherkin Scenario titles breaks coverage-matrix / Playwright title matching** → Mitigation: update feature file, `onboarding.spec.ts` `test()` titles, and coverage-matrix rows in the same PR.
- **[Risk] Step 4 accessibility regex still looks for Required/Erforderlich** → Mitigation: switch assertions to Yes/Ja + section title copy from `onboarding-content.ts`.
- **[Risk] Shared e2e env flaky on signup** → Mitigation: keep fresh-USER isolation; skip only with named env reasons if auth unavailable.
- **[Risk] Docs drift vs openspec/specs** → Mitigation: `docs/product/` wins; openspec delta is planning only.
- **[Trade-off] Optional Other+text e2e path** → Prefer at least visibility assertion for Other; full submit path can stay unit-tested in auth package if e2e time-budget is tight (document in matrix if deferred).

## Migration Plan

1. Update product Gherkin + i18n/schema/coverage (+ gaps/DEPLOYMENT).
2. Update e2e fixtures/specs for onboarding + profile; align Scenario titles.
3. Tighten admin detail Radius row + verify districts/languages/`interests_other`.
4. Grep/remove leftover travel-radius copy/constants.
5. `bun run lint`, `bun run typecheck`; targeted Playwright onboarding + profile.
6. Mark step 04 done and parent feature releasable in parent guide.
7. Rollback = revert docs/e2e/admin-display commits; no schema migration.

## Open Questions

- None blocking. If a full Other + free-text Playwright path is brittle, matrix-defer that path with owner while keeping Other visibility + auth unit tests as the validation bar.
