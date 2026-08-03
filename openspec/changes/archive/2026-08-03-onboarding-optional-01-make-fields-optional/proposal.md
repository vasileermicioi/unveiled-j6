## Why

After signup, the location step blocks **Next** when zip is empty (`required` on the input + `validatePostalCode` rejecting blank PLZ), and interests can block on Other without free text. Preferences are meant to be skippable so members reach membership checkout without filling anything.

## What Changes

- Remove HTML `required` from onboarding zip and interests Other free-text (and any other onboarding controls that block native submit).
- Domain: empty/whitespace zip skips postal validation and stores unset/`null` zip while still persisting Germany/Berlin defaults from the step payload; non-empty invalid zip still rejected.
- Interests: empty interests/moods allowed; Other with empty text does not block — drop Other and save `interests_other: null` unless non-empty text is present.
- Timing: empty timing/days/languages remain OK; accessibility default false OK (already).
- Fix step progression so empty location POST advances to timing (`behavior.onboarding_step` / `isLocationStepDone`) and finish still works with all blanks.
- Optional zip copy hints (DE/EN) if current hint implies a hard requirement.
- Update `docs/product/features/onboarding.feature`, e2e, auth unit tests, coverage matrix; log decision in gaps if needed.
- Out of scope: deleting steps, feed personalization, admin intel, event age groups, profile-edit zip hard-require unless shared onboarding HTML.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `member-onboarding`: All onboarding preference fields are optional; Next/Finish MUST NOT block on empty zip or empty Other text; empty location/interests/timing submissions advance or complete; invalid non-empty zip and allowlist violations still rejected; BDD/e2e cover blank-zip Next and full blank completion.

## Impact

- **Auth domain (`@unveiled/auth`):** `packages/auth/src/onboarding.ts` — `validateOnboardingStepPayload`, `isLocationStepDone` / inference, interests Other empty handling; unit tests.
- **Web onboarding UI (`apps/web`):** `LocationStepForm.tsx`, `InterestsStepForm.tsx`; onboarding locale copy (`onboarding-content` / i18n) for optional zip hint.
- **Product / e2e:** `docs/product/features/onboarding.feature`, `e2e/specs/onboarding.spec.ts` (+ fixtures), `docs/product/testing/coverage-matrix.md`; optionally `gaps-and-decisions.md` and parent guide checkbox.
- **Source brief:** `.dev-plan/current-iteration/04-onboarding-optional-01-make-fields-optional.md`
- **Parent:** `.dev-plan/current-iteration/04-onboarding-optional-parent-guide.md`
- **Depends on:** none (single child step; closes the feature)
- **Verification:** `bun run lint`; `bun run typecheck`; auth onboarding unit tests (empty location, blank wizard); onboarding e2e when env available
