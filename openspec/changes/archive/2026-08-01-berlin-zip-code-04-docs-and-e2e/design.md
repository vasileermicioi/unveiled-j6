## Context

Parent feature: Berlin Zip Code (`.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`). Child step 04 — final slice; depends on 02–03 (done/archived).

Runtime behavior already matches parent release criteria:

- Events persist `country` / `city` / `zip_code` (defaults `DE` / `berlin`); no `neighborhood`.
- Shared `validatePostalCode({ country, city, zipCode })` with registry entry `(DE, berlin)` (5-digit + inclusive PLZ ranges **10115–14199**).
- Admin create/edit and public cards/detail show zip under fixed Germany/Berlin.
- Onboarding step 3 and profile Vibes collect zip (not Bezirk multi-select); Membership HQ intel shows zip/location.

What remains is the **verification and documentation layer**:

- Product Gherkin still describes hangout districts / Bezirke / (in admin-users) districts + radius.
- `schema-overview.md` still lists `profile.districts` and `events.neighborhood`.
- `ui-component-map.md` EventCard still says neighborhood + MapPin.
- `content-i18n-inventory.md`, `gaps-and-decisions.md`, and `user-journeys.md` still describe Bezirk location UX.
- Playwright titles/assertions and `e2e/fixtures/onboarding.ts` still drive Bezirk checkboxes (`Mitte`, etc.); coverage-matrix rows still say “hangout districts”.
- OpenSpec mirrors still carry stale “Product docs match … Bezirke” / hangout-label requirements even where runtime requirements were updated in 01–03.
- Parent guide still lists step 04 open.

Constraints: `docs/product/` is behavioral SoT (AGENTS.md); OpenSpec under `openspec/specs/` is a planning mirror only; BDD proximity/role selectors only (`docs/product/testing/bdd-and-e2e.md`); no travel-distance UI; no additional cities; no feed geo-filtering.

## Goals / Non-Goals

**Goals:**

- Align Gherkin + Playwright (+ coverage-matrix) with shipped zip location UX across onboarding, profile, admin-users, admin-events, and event-discovery.
- Sync schema overview, UI component map, i18n inventory, user journeys, and gaps/decisions (including Location Model / migration / PLZ range decisions from step 01).
- Remove obsolete `DISTRICTS` / hangout product claims; delete unused district constants/helpers when safe.
- Close parent feature: mark step 04 done and walk Release Criteria; hand off to `onboarding-travel-distance`.

**Non-Goals:**

- New location UX or validation rules beyond 01–03.
- Restoring `max_distance` / travel-distance (owned by `onboarding-travel-distance`).
- Shipping city/country pickers or additional postal registry entries.
- Feed ranking / distance filtering by zip.
- Geocoding zip → lat/lng.
- Expanding e2e into live geocode/Nominatim network asserts.

## Decisions

1. **Docs-and-BDD first, then cleanup**
   - **Choice:** Update product feature files → schema-overview / ui-component-map / i18n / gaps / user-journeys → Playwright + fixtures + coverage-matrix → dead `DISTRICTS` cleanup → parent close-out.
   - **Rationale:** Step brief; e2e titles must match Gherkin verbatim; cleanup after confirming no remaining call sites.
   - **Alternatives:** Cleanup first (risk of leaving SoT stale); e2e before Gherkin (title drift).

2. **Rename onboarding Scenario title to match shipped zip UX**
   - **Choice:** Replace Gherkin/Playwright title `Scenario: Step 3 — hangout districts` with `Scenario: Step 3 — zip under Germany/Berlin` (aligned with OpenSpec runtime scenarios from step 03). Optionally add `Scenario: Step 3 — invalid zip rejected` if fixture cost is low; otherwise keep invalid-zip covered by unit tests and matrix-document e2e deferral.
   - **Rationale:** Verbatim title contract; parent/step Spec Delta; current title is actively wrong.
   - **Alternatives:** Keep old title and only change steps — agents searching “hangout districts” stay confused.

3. **Profile Vibes scenario: amend in place**
   - **Choice:** Keep title `Scenario: Edit cultural preferences ("Vibes")`; change When/Then (and Playwright assertions) from districts/Bezirke to zip under Germany/Berlin; keep “no travel radius” asserts.
   - **Rationale:** Existing title is still accurate; only location clause is stale; coverage-matrix already keys this title.
   - **Alternatives:** Split a new zip-only scenario — unnecessary when Vibes is one form.

4. **Admin-users Gherkin: zip intel, radius optional/null**
   - **Choice:** Update expand-detail / intel Then steps to preferences including zip (and country/city when shown), not districts; state that null `max_distance` means no active radius row (still OK). Align Playwright assertions on the detail page if they still look for districts labels.
   - **Rationale:** Step brief admin-users intel wording; runtime already matches step 03.
   - **Alternatives:** Leave feature file and only update OpenSpec — product SoT stays wrong.

5. **Admin-events / event-discovery: add focused zip scenarios**
   - **Choice:** Add (or extend) Gherkin scenarios for: admin create with Berlin PLZ under fixed Germany/Berlin; admin invalid zip rejected (optional e2e); guest/member sees zip on card and/or detail (not neighborhood). Prefer new scenario titles that match OpenSpec runtime scenarios from step 02. Do not rename unrelated existing scenarios.
   - **Rationale:** Product feature files barely mention postal location today; OpenSpec already has runtime requirements — this step makes product SoT + matrix catch up.
   - **Alternatives:** Only update ui-component-map — weaker BDD SoT.

6. **Schema overview: replace neighborhood/districts with location trio**
   - **Choice:** Document `events.country`, `events.city`, `events.zip_code` (required; supported `DE` / `berlin` + Berlin PLZ). Document matching `users.profile` keys `country`, `city`, `zip_code`; remove active `districts` array as a current preference field (MAY note legacy key cleared on write). Keep `max_distance` as legacy/unused.
   - **Rationale:** Step Spec Delta database-schema; agents generate from schema-overview.
   - **Alternatives:** Leave overview historical and rely on gaps-and-decisions only — too easy to miss.

7. **Gaps-and-decisions: record locked Location Model decisions**
   - **Choice:** Append one (or a tight cluster of) decision rows covering: city key `berlin`; country `DE`; Berlin PLZ membership = documented inclusive ranges **10115–14199** under registry `(DE, berlin)`; events migration Bezirk→representative-PLZ map (unknown → `10115`); extensibility contract (add registry entries later without rewriting the field trio); UI prefilled non-editable country/city for this release.
   - **Rationale:** Parent Risks + step 01 decisions explicitly deferred documentation to step 04.
   - **Alternatives:** Scatter notes across feature files only — no single decision log entry.

8. **i18n inventory: replace districtSubtitle / DISTRICTS narrative**
   - **Choice:** Replace hangout-district copy rows with Country/Land, City/Stadt, PLZ/Zip code (+ Berlin-serves hint if shipped). Update the onboarding/profile preference-option prose so it no longer claims 12 Bezirke / `getDistrictLabel` / `DISTRICTS` as active location UX. Index only strings that exist in the shipped UI.
   - **Rationale:** Step deliverables; inventory is agent copy SoT.
   - **Alternatives:** Leave inventory and only fix Gherkin — EN/DE label drift for agents.

9. **Playwright fixtures: zip-first helpers**
   - **Choice:** Change `completeLocationStep` to fill the native zip textbox with a valid Berlin PLZ (e.g. `10115`) instead of selecting Bezirk checkboxes. Update onboarding/profile assertions to expect country/city display + zip field and absence of Bezirk checkboxes / travel radius. Keep proximity/role selectors only.
   - **Rationale:** Fixture still selects `Mitte` today — all onboarding e2e that complete location will fail against shipped UI until fixed.
   - **Alternatives:** Dual-path fixture (districts OR zip) — unnecessary once UI is zip-only.

10. **`DISTRICTS` cleanup: delete when unused**
    - **Choice:** Grep for `DISTRICTS` / `getDistrictLabel` / neighborhood product claims. If only tests/docs reference them, delete constants/helpers and update tests. If something still needs a Bezirk map for historical migration comments only, keep the map next to migration notes or gaps — do not keep active preference allowlist exports.
    - **Rationale:** Step brief “prefer delete when safe”; parent Non-Goals allow dropping active districts collection.
    - **Alternatives:** Leave unused exports forever — confuses future agents into reintroducing Bezirke.

11. **Parent close-out + travel-distance handoff**
    - **Choice:** After verification, mark step 04 done in the parent guide; walk Release Criteria; add a one-line pointer in the travel-distance parent/step plans that location is zip under Germany/Berlin (not districts).
    - **Rationale:** Step closes the feature and unblocks the next parent.
    - **Alternatives:** Leave parent open until every optional invalid-zip e2e passes — overblocks if unit coverage is solid and matrix names the deferral.

## Risks / Trade-offs

- **[Risk] E2E still on district fixtures while UI is zip** → Mitigation: Decision 9 first among code edits after Gherkin titles land.
- **[Risk] Coverage-matrix title drift** → Mitigation: Decisions 2–3 — rename/amend titles and matrix in the same PR.
- **[Risk] Stale `DISTRICTS` reintroduced by copy-paste from old docs** → Mitigation: Decision 7–8 + repo-wide grep in validation.
- **[Risk] Shared staging / demo data still has odd zips** → Mitigation: seed already uses Berlin PLZ from 02; e2e create uses `10115`.
- **[Trade-off] Invalid-zip e2e optional** → Prefer unit tests + one happy-path e2e per surface; matrix-document any skipped invalid-zip browser scenario.

## Migration Plan

1. Land Gherkin + product docs + e2e/fixtures/coverage-matrix + safe constant cleanup + parent/travel-distance handoff notes.
2. Run lint/typecheck; targeted Playwright (onboarding location, profile Vibes, admin event create smoke) when env allows — else document skip with assertions committed.
3. Mark parent guide step 04 + Release Criteria; sync OpenSpec main specs on archive.
4. No DB, env, or deploy migration; no new secrets.
5. Rollback: revert docs/e2e/cleanup commits; runtime UX from 01–03 unchanged by this step’s happy path.

## Open Questions

- None blocking for planning. If invalid-zip browser coverage is flaky or expensive, defer with a named coverage-matrix row (owner = this feature / step 04; unit tests remain required).
