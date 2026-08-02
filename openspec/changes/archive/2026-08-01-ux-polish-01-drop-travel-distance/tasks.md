## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/ux-polish-01-drop-travel-distance.md`, parent guide release criteria/non-goals, and this change’s proposal/design/specs
- [x] 1.2 Confirm prerequisites: `@unveiled/auth` location/preference validators require `maxDistance`; onboarding + Vibes show travel-distance UI; Gherkin/coverage/DEPLOYMENT document active collection
- [x] 1.3 Skim archive `openspec/changes/archive/2026-08-01-onboarding-travel-distance-*` for reversal touchpoints

## 2. Domain — stop requiring/writing max_distance

- [x] 2.1 Remove `maxDistance` from `LocationStepPayload` and stop calling `validateMaxDistance` in `validateOnboardingStepPayload("location")` / cultural preference validation
- [x] 2.2 Ensure location/preference merges write `country` / `city` / `zip_code` + clear `districts` and **omit** `max_distance` (do not clear and do not set)
- [x] 2.3 Remove or stop exporting dead helpers (`validateMaxDistance`, `parseMaxDistanceField` usage, unused `MAX_DISTANCE_*` if unreferenced); keep GDPR wipe of preference fields including `max_distance`
- [x] 2.4 Update `packages/auth` onboarding/profile unit tests: zip-only success; no required distance; pre-existing `max_distance` survives a zip-only save; remove out-of-range/missing-distance rejection cases for location/Vibes

## 3. UI — remove travel-distance chrome

- [x] 3.1 Remove travel-distance control from `LocationStepForm` and `PreferencesForm`
- [x] 3.2 Remove `radiusLabel` / `km` / `invalidMaxDistance` copy and route parsers/error mapping from onboarding + profile routes/content
- [x] 3.3 Update stories/fixtures/content unit tests; confirm `AdminUserDetailPage` still shows km only when non-null (comment may say legacy remnant)

## 4. Docs, e2e, and coverage

- [x] 4.1 Update `docs/product/features/onboarding.feature` step 3: zip under Germany/Berlin only; no travel-distance control/requirement
- [x] 4.2 Update `docs/product/features/profile.feature` Vibes: zip without travel distance
- [x] 4.3 Update `docs/product/features/admin-users.feature`: non-null `max_distance` = legacy intel; null omits row; not actively collected
- [x] 4.4 Update `docs/product/database/schema-overview.md`: `max_distance` optional legacy JSONB; saves leave untouched
- [x] 4.5 Update `docs/product/extras/gaps-and-decisions.md` and `content-i18n-inventory.md`: drop active travel-distance collection/copy
- [x] 4.6 Update `docs/product/testing/coverage-matrix.md` onboarding/profile/admin-users notes; update `apps/web/DEPLOYMENT.md` demo script / client demo line
- [x] 4.7 Update Playwright: `completeLocationStep` zip-only; onboarding/profile assert no travel-distance control; admin-users adjust notes only if needed (proximity selectors)

## 5. Verification and close-out

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run auth unit tests + touched onboarding/profile e2e — pass (or document blockers / named skips with assertions committed)
- [x] 5.3 Grep for stale “required travel distance”, “How far will you travel?”, active `max_distance` collection claims in docs/demo; clear leftovers
- [x] 5.4 Mark step 01 done in `.dev-plan/current-iteration/ux-polish-parent-guide.md`; confirm `docs/product/` matches shipped behavior
- [x] 5.5 Prepare PR/handoff linking this change ID and the parent guide
