## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/onboarding-travel-distance-03-docs-and-e2e.md`, parent guide Release Criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 02 is merged/archived and runtime UI has required native distance beside zip (onboarding + Vibes) with bounds 1–50 and shipped EN/DE labels
- [x] 1.3 Skim current stale surfaces: Gherkin “cannot set travel distance”, profile “travel radius is not part of Vibes”, schema-overview legacy/unused `max_distance`, i18n struck `radiusLabel`/`km`, coverage-matrix “no travel radius”, Playwright absence asserts + zip-only `completeLocationStep`

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/onboarding.feature` step 3: remove “I cannot set a travel distance / radius”; document required travel distance (km) beside zip under Germany/Berlin (keep Scenario title)
- [x] 2.2 Update `docs/product/features/profile.feature` Vibes scenario: include travel distance with zip; remove “travel radius is not part of the Vibes form”
- [x] 2.3 Confirm/adjust `docs/product/features/admin-users.feature` intel: zip location + null `max_distance` omits radius row; no “never collected” framing; optional positive non-null clause if cheap
- [x] 2.4 Update `docs/product/database/schema-overview.md`: `max_distance` active integer km (onboarding + Vibes; bounds 1–50); preference saves do not clear by policy
- [x] 2.5 Restore `radiusLabel` / `km` in `docs/product/extras/content-i18n-inventory.md` (EN “How far will you travel?” / DE “Wie weit bist du bereit zu fahren?” + `km`); update preference-option prose
- [x] 2.6 Record step-02 UX decision in `docs/product/extras/gaps-and-decisions.md` (native number input; required on step 3 + Vibes location save; 1–50 km; capture-for-later / no feed ranking)
- [x] 2.7 Update `docs/product/product/user-journeys.md` onboarding step wording to zip **and** travel distance under Germany/Berlin if still zip-only

## 3. Playwright and coverage matrix

- [x] 3.1 Extend `e2e/fixtures/onboarding.ts` `completeLocationStep` to fill a valid travel distance (e.g. `10`) with the Berlin PLZ (proximity/label selectors)
- [x] 3.2 Align `e2e/specs/onboarding.spec.ts` step 3 assertions: distance control/label present; remove “travel distance absent” asserts
- [x] 3.3 Align `e2e/specs/profile.spec.ts` Vibes assertions: distance control/label present; remove “travel radius absent” asserts; save still succeeds with zip + distance
- [x] 3.4 Confirm `e2e/specs/admin-users.spec.ts` still matches zip intel + null-omit (adjust only if notes/asserts imply radius never collected)
- [x] 3.5 Update `docs/product/testing/coverage-matrix.md` onboarding/profile (and admin-users if needed) rows: notes say travel distance (km), not “no travel radius”; pass or named skip

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale “max_distance legacy/unused”, “cannot set a travel distance”, “travel radius is not”, “no travel radius”, “preference saves clear it” product claims; clear docs (and DEPLOYMENT demo notes if they still say `max_distance` null by policy for new onboarding)
- [x] 4.2 Mark step 03 done in `.dev-plan/current-iteration/onboarding-travel-distance-parent-guide.md` and walk parent **Release Criteria**
- [x] 4.3 Ensure canonical product specs reflect active `max_distance` collection (no remaining “not collected” SoT)

## 5. Verification

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run onboarding/profile e2e covering the location step — pass, or document environment blockers / named skips with assertions committed
- [x] 5.3 Prepare PR/handoff linking this change ID and the parent guide
