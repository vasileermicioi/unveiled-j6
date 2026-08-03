## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/04-onboarding-optional-01-make-fields-optional.md` and parent guide release criteria / routing risk
- [x] 1.2 Confirm prerequisites: `LocationStepForm` / `InterestsStepForm` `required` attrs, `packages/auth/src/onboarding.ts` (`validateOnboardingStepPayload`, `isLocationStepDone`, `saveOnboardingStep`), `onboarding.feature` + e2e

## 2. Domain validation and step progression

- [x] 2.1 In `validateOnboardingStepPayload` location: skip `validatePostalCode` when zip is empty/whitespace; store `zip_code: null` with `country`/`city` from payload defaults; keep validation for non-empty zip
- [x] 2.2 Interests: allow empty arrays; when Other selected with empty text, drop Other and set `interests_other: null`; keep max-length / allowlist checks for non-empty other text
- [x] 2.3 Fix `isLocationStepDone` (and any inference) so empty-zip location saves are “done” (e.g. country+city present) and Next advances to timing via `behavior.onboarding_step`
- [x] 2.4 Add/update `@unveiled/auth` onboarding unit tests: empty location, Other without text, blank interests/moods, invalid non-empty zip still rejected, full blank wizard completion path

## 3. UI and copy

- [x] 3.1 Remove `required` from onboarding zip input and Other free-text input (and any other onboarding preference controls that block native submit)
- [x] 3.2 Update DE/EN `zipCodeHint` (and content tests) so zip is clearly optional while noting Berlin service area
- [x] 3.3 Confirm route body parsing for interests/moods defaults missing checkbox groups to `[]` so empty POSTs hit the updated validators

## 4. Product specs, e2e, and docs

- [x] 4.1 Update `docs/product/features/onboarding.feature` with optional zip / empty interests / empty timing / all-blank completion scenarios per delta
- [x] 4.2 Update `e2e/specs/onboarding.spec.ts` (+ fixtures) for blank-zip Next and blank-wizard completion; keep invalid zip rejection
- [x] 4.3 Update `docs/product/testing/coverage-matrix.md` onboarding rows; optionally log decision in `gaps-and-decisions.md` / i18n inventory if hint strings change

## 5. Cleanup and verification

- [x] 5.1 Mark step done in `.dev-plan/current-iteration/04-onboarding-optional-parent-guide.md`
- [x] 5.2 Note (no code unless needed): profile edit path must not reintroduce a hard zip requirement for first-time empty profiles
- [x] 5.3 Run `bun run lint` — exits 0
- [x] 5.4 Run `bun run typecheck` — exits 0
- [x] 5.5 Run `@unveiled/auth` onboarding unit tests — exit 0 (incl. blank four-step integration against Neon)
- [x] 5.6 Onboarding e2e specs/fixtures updated for blank zip / optional paths; Playwright Chromium not installed in this environment (`playwright install` needed) — deferred browser run
