## Context

Parent feature: Onboarding Travel Distance (`.dev-plan/current-iteration/onboarding-travel-distance-parent-guide.md`). Child step 03 — final slice; depends on 02 (done/archived).

Runtime behavior already matches parent release criteria for capture:

- Domain validates/persists `max_distance` (1–50 km) with zip-aware preference saves; no blanket clear-to-null.
- Onboarding `LocationStepForm` and profile `PreferencesForm` collect required native `input type="number"` beside zip (labels EN “How far will you travel?” / DE “Wie weit bist du bereit zu fahren?” + `km`).
- Membership HQ shows travel distance when `max_distance` is non-null; omits/unset when null.

What remains is the **verification and documentation layer**:

- `onboarding.feature` step 3 still says “I cannot set a travel distance / radius”.
- `profile.feature` Vibes still says “travel radius is not part of the Vibes form”.
- `schema-overview.md` still marks `max_distance` as **legacy/unused** and claims preference saves clear it.
- `content-i18n-inventory.md` strikes through `radiusLabel` / `km` as unused.
- `gaps-and-decisions.md` preference-options row still says travel radius is not collected.
- Coverage-matrix notes say “no travel radius”.
- Playwright onboarding/profile specs assert travel-distance copy has count 0; `completeLocationStep` fills zip only (will fail against required distance once assertions flip — must fill km).
- OpenSpec “Product docs match …” requirements still forbid travel radius even though runtime requirements already collect it.
- Parent guide still lists step 03 open.

Constraints: `docs/product/` is behavioral SoT (AGENTS.md); OpenSpec under `openspec/specs/` is a planning mirror only; BDD proximity/role selectors only (`docs/product/testing/bdd-and-e2e.md`); no discovery ranking by distance; no zip validation changes; no new UI chrome in this step.

## Goals / Non-Goals

**Goals:**

- Align Gherkin + Playwright (+ coverage-matrix) with shipped zip **and** travel-distance UX on onboarding step 3 and Vibes.
- Sync schema overview, i18n inventory, gaps/decisions (UX bounds decision from 02), and user-journeys wording if still zip-only.
- Grep away stale “max_distance legacy/unused” / “cannot set travel distance” product claims.
- Close parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- Changing domain validation, bounds constants, or form chrome from 01–02.
- Using `max_distance` + zip to filter or sort `/events`.
- Map radius visualization or geolocation APIs.
- Reintroducing Bezirk multi-select or changing Germany/Berlin zip defaults.
- Expanding e2e into invalid-distance browser coverage beyond what unit tests already cover (optional; matrix-document if deferred).

## Decisions

1. **Docs-and-BDD first, then fixtures, then close-out**
   - **Choice:** Update product feature files → schema-overview / i18n / gaps / user-journeys → Playwright + fixtures + coverage-matrix → stale-claim grep → parent close-out.
   - **Rationale:** Step brief; e2e titles must match Gherkin verbatim; fixture must fill distance before flipping “absent” asserts or completion flows break.
   - **Alternatives:** Flip e2e before Gherkin (title/step drift); close parent before matrix (release criteria incomplete).

2. **Amend onboarding Scenario title in place**
   - **Choice:** Keep Gherkin/Playwright title `Scenario: Step 3 — zip under Germany/Berlin`. Replace the “cannot set travel distance” Then with positive steps for required km distance (native number / labeled how-far copy). Optionally add `Scenario: Step 3 — invalid travel distance rejected` only if low fixture cost; otherwise keep invalid-distance covered by unit tests and matrix-document any e2e deferral.
   - **Rationale:** Coverage-matrix and OpenSpec already key the zip title; step Spec Delta cares about forbidding scenarios removed and docs matching zip + distance, not a rename.
   - **Alternatives:** Rename to “zip and travel distance” — clearer but forces matrix/OpenSpec title churn for little gain.

3. **Profile Vibes scenario: amend in place**
   - **Choice:** Keep title `Scenario: Edit cultural preferences ("Vibes")`; change When/Then (and Playwright) to include travel distance with zip; remove “travel radius is not part of the Vibes form”.
   - **Rationale:** Same pattern as berlin-zip-code-04; Vibes remains one form.
   - **Alternatives:** Split a distance-only scenario — unnecessary.

4. **Admin-users: keep null-omit clause; drop “never collected” framing**
   - **Choice:** Keep “when max_distance is null I do not see travel distance / radius as an active preference row”. Ensure wording does not imply radius is never collected. Optional positive Then for non-null can stay OpenSpec-only if product Gherkin already implies it via Membership HQ runtime; prefer adding a short And when a fixture makes it cheap.
   - **Rationale:** Runtime + OpenSpec already cover non-null display; product file’s null clause remains correct.
   - **Alternatives:** Require a new admin e2e that sets distance first — higher cost; defer with named matrix row if not done.

5. **Schema overview: flip max_distance to active**
   - **Choice:** Replace the legacy/unused / clear-to-null sentence with: integer km collected in onboarding and Vibes; inclusive bounds 1–50 via `MAX_DISTANCE_MIN` / `MAX_DISTANCE_MAX`; preference saves do not clear by policy. Keep zip location trio wording from berlin-zip-code.
   - **Rationale:** Step Spec Delta database-schema; agents generate from schema-overview.
   - **Alternatives:** Only update gaps-and-decisions — schema overview would stay wrong.

6. **Gaps-and-decisions: record step-02 UX decision**
   - **Choice:** Update the preference-options row (and/or append a tight decision row) covering: native `input type="number"`; required on onboarding step 3 and Vibes location save; inclusive bounds 1–50 km; labels EN/DE + `km`; capture-for-later (no feed ranking in this feature).
   - **Rationale:** Parent Risks + step 02 explicitly deferred documentation to step 03.
   - **Alternatives:** Leave gaps row stale — agents re-clear max_distance.

7. **i18n inventory: restore radiusLabel / km**
   - **Choice:** Un-strike `radiusLabel` / `km` with the shipped EN/DE strings; update the preference-option prose so travel radius is collected beside zip (not “returns in onboarding-travel-distance”).
   - **Rationale:** Step deliverables; inventory is agent copy SoT.
   - **Alternatives:** Leave inventory struck — contradicts shipped UI.

8. **Playwright fixtures: fill distance with zip**
   - **Choice:** Extend `completeLocationStep` to fill the travel-distance number input (e.g. `10`) via label (`How far` / `Wie weit`) or `getByLabel` / `#max_distance` proximity pattern consistent with existing zip fill. Flip onboarding/profile asserts from “distance copy count 0” to “distance control/label visible”. Keep proximity/role selectors only.
   - **Rationale:** Required field — zip-only fixture cannot complete location against shipped UI; current specs actively assert absence.
   - **Alternatives:** Dual-path optional distance — contradicts domain required.

9. **Coverage-matrix notes**
   - **Choice:** Update onboarding step 3 and profile Vibes rows from “no travel radius” to “Germany/Berlin + travel distance (km)” (pass or named skip). Touch admin-users notes only if they still imply radius never collected.
   - **Rationale:** Matrix is CI/agent index for scenario status.
   - **Alternatives:** Leave notes — greppable lie.

10. **Parent close-out**
    - **Choice:** After verification, mark step 03 done in the parent guide; walk Release Criteria checklist; confirm canonical docs no longer say travel radius is not collected.
    - **Rationale:** Step closes the feature.
    - **Alternatives:** Leave parent open until optional invalid-distance e2e lands — overblocks if unit coverage is solid and matrix names the deferral.

## Risks / Trade-offs

- **[Risk] E2E fixture still zip-only while UI requires distance** → Mitigation: Decision 8 before flipping “absent” asserts; do fixture + assert updates in the same PR.
- **[Risk] Coverage-matrix / Gherkin title drift** → Mitigation: Decision 2 — keep titles; only change steps/notes.
- **[Risk] Stale “legacy/unused” reintroduced by copy-paste** → Mitigation: Decisions 5–7 + repo-wide grep in validation.
- **[Risk] Admin intel e2e never sees non-null distance** → Mitigation: Decision 4 — null-omit remains specified; optional positive path or matrix deferral.
- **[Trade-off] Invalid-distance browser e2e optional** → Prefer unit tests + happy-path e2e; matrix-document any skipped invalid-distance scenario.

## Migration Plan

1. Land Gherkin + product docs + e2e/fixtures/coverage-matrix + gaps UX decision + parent close-out notes.
2. Run lint/typecheck; targeted Playwright (onboarding location, profile Vibes) when env allows — else document skip with assertions committed.
3. Mark parent guide step 03 + Release Criteria; sync OpenSpec main specs on archive.
4. No DB, env, or deploy migration; no new secrets.
5. Rollback: revert docs/e2e commits; runtime UX from 01–02 unchanged by this step’s happy path.

## Open Questions

- None blocking for planning. If invalid-distance browser coverage is flaky or expensive, defer with a named coverage-matrix row (owner = this feature / step 03; unit tests remain required).
