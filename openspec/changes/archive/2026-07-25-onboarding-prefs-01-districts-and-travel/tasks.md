## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/onboarding-prefs-01-districts-and-travel.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites exist: `packages/auth/src/constants.ts` (`DISTRICTS`, `MAX_DISTANCE_*`), `onboarding.ts`, `profile.ts`, `LocationStepForm.tsx`, `PreferencesForm.tsx`, `onboarding-content.ts`, route parsers
- [x] 1.3 Grep for `DISTRICTS`, `X-Berg`, `max_distance`, `MAX_DISTANCE_`, `radiusLabel` consumers to list every touchpoint

## 2. Auth allowlist and validation

- [x] 2.1 Replace `DISTRICTS` with the 12 official Bezirke (order from step brief); remove `MAX_DISTANCE_MIN` / `MAX_DISTANCE_MAX` and `assertMaxDistance` if unused after this step
- [x] 2.2 Change `LocationStepPayload` to districts-only; validate location with `assertAllowlist` on districts; return `{ districts, max_distance: null }`
- [x] 2.3 Update `isLocationStepDone` to `profile.districts != null` only
- [x] 2.4 Update `validateCulturalPreferencesPayload` / preferences save to stop requiring `max_distance` and clear it to `null` on save
- [x] 2.5 Fix `packages/auth` unit tests and fixtures (`onboarding.test.ts`, `profile.test.ts`) for new districts and no required `max_distance`

## 3. Web labels, forms, and parsers

- [x] 3.1 Update `districtLabels` / `getDistrictLabel` maps so DE and EN use proper Bezirk names; fix `onboarding-content` tests (remove X-Berg / Kreuzberg expectations)
- [x] 3.2 Fix location step meta so description is not `radiusLabel` (districts-focused copy or equivalent)
- [x] 3.3 Remove travel-radius UI from `LocationStepForm` and `PreferencesForm`
- [x] 3.4 Update `onboarding-route.ts` / `profile-route.ts` parsers so missing `max_distance` is OK and saves clear it
- [x] 3.5 Make admin user-detail max-distance display null-friendly (hide or em-dash) if still shown

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` (exit 0)
- [x] 4.2 Run `bun run typecheck` (exit 0)
- [x] 4.3 Run `bun test packages/auth` (or package-local equivalent) — location/profile tests pass
- [x] 4.4 Confirm accessibility/languages, interests Other, and Gherkin/e2e were not changed (deferred to later steps)
- [x] 4.5 Mark step done in `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`; note Gherkin/e2e/product SoT updates for step 04
