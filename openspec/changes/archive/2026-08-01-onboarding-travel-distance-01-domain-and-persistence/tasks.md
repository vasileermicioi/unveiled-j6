## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/onboarding-travel-distance-01-domain-and-persistence.md` and parent guide risks (bounds 1–50; required on location saves)
- [x] 1.2 Confirm berlin-zip-code location path is live (`country` / `city` / `zip_code` + `validatePostalCode`)
- [x] 1.3 Inventory writers that set `max_distance: null` (`packages/auth` onboarding/profile, tests, any web parsers)

## 2. Validation helper

- [x] 2.1 Add `MAX_DISTANCE_MIN` / `MAX_DISTANCE_MAX` (1 / 50) and `validateMaxDistance` in `@unveiled/auth`; reject missing, non-finite, non-integer, and out-of-range with typed `OnboardingValidationError` / shared code
- [x] 2.2 Export constants/helper from package entry as needed
- [x] 2.3 Unit tests: accept 1, 10, 50; reject 0, 51, 10.5, NaN, missing

## 3. Onboarding + preference persistence

- [x] 3.1 Extend `LocationStepPayload` with required `maxDistance: number`
- [x] 3.2 Update `validateOnboardingStepPayload("location")` to validate postal + `maxDistance`, persist `max_distance`, clear `districts`, **stop** forcing `max_distance: null`
- [x] 3.3 Wire `validateCulturalPreferencesPayload` / location slice to pass `maxDistance` through (inherits via shared location validator)
- [x] 3.4 Update `packages/auth` onboarding + profile unit tests: zip + distance round-trip; out-of-range rejected; remove expectations that clears `max_distance`
- [x] 3.5 Confirm GDPR anonymize still wipes preference fields including `max_distance` (`profile: {}` — checklist / assert if cheap)

## 4. Web compile shims and verification

- [x] 4.1 Update `apps/web` location/preference parsers (`parseLocationPayload`, profile preferences payload) to read `max_distance` / `maxDistance` and pass into domain (fail closed when missing; do not reintroduce null policy). Full UI chrome deferred to step 02
- [x] 4.2 Fix fixtures/tests that construct location payloads without `maxDistance`
- [x] 4.3 Run `bun run lint` — exit 0
- [x] 4.4 Run `bun run typecheck` — exit 0
- [x] 4.5 Run targeted `@unveiled/auth` unit tests for max_distance validation/persistence — exit 0
- [x] 4.6 Mark step done in parent guide; leave schema-overview / docs wording for step 03; note field is active again in code comments if helpful
