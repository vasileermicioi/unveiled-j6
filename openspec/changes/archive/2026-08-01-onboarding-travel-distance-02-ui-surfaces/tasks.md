## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/onboarding-travel-distance-02-ui-surfaces.md` and parent guide UX defaults (number input; required; 1–50)
- [x] 1.2 Confirm step 01 bounds/error codes (`MAX_DISTANCE_MIN`/`MAX_DISTANCE_MAX`, `invalid_max_distance`) and that parsers already pass `maxDistance` from `max_distance` form fields

## 2. Copy

- [x] 2.1 Add/restore DE/EN travel-distance keys in `onboarding-content.ts` (`radiusLabel` / km unit — EN “How far will you travel?”, DE “Wie weit bist du bereit zu fahren?”)
- [x] 2.2 Update `onboarding-content` tests for the new keys; add locale error string for `invalid_max_distance` if missing on onboarding/profile routes

## 3. Onboarding location UI

- [x] 3.1 Add required native `input type="number" name="max_distance"` to `LocationStepForm` beside/below zip (`min`/`max`/`step={1}` from auth constants; `defaultValue` from `profile.max_distance` or empty)
- [x] 3.2 Confirm location POST / `parseLocationPayload` posts through; map `invalid_max_distance` to a user-visible form/field error
- [x] 3.3 Update `LocationStepForm` stories for the distance control

## 4. Profile Vibes UI

- [x] 4.1 Add the same required distance control to `PreferencesForm` location section using shared onboarding copy
- [x] 4.2 Confirm preferences POST surfaces invalid/missing distance errors without mutating prefs
- [x] 4.3 Update PreferencesForm stories/fixtures if they assert absence of travel radius

## 5. Admin member intel

- [x] 5.1 Verify `AdminUserDetailPage` shows radius row when `max_distance` is set; omit/unset when null — remove stale “not collected” comment
- [x] 5.2 Optionally tighten `usersPrefRadius` DE/EN labels if “Radius” is unclear; update fixtures so a non-null `max_distance` story exists for smoke

## 6. Verification and handoff

- [x] 6.1 Confirm districts / Bezirk multi-select UI remains absent on onboarding + Vibes
- [x] 6.2 Run `bun run lint` — exit 0
- [x] 6.3 Run `bun run typecheck` — exit 0
- [x] 6.4 Manual smoke: set zip + distance on onboarding; edit both in Vibes; see km on admin member detail
- [x] 6.5 Mark step done in parent guide; record UX decision (native number input; required; 1–50) for step 03 gaps log; leave Gherkin/i18n inventory/e2e for step 03; note change ID for PR/handoff
