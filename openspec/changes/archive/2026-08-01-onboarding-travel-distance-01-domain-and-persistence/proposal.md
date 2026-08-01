## Why

`users.profile.max_distance` exists in JSON but preference and onboarding location saves always null it out as legacy. With Germany/Berlin zip location already live (`berlin-zip-code`), domain persistence must restore bounded integer km so step 02 can collect travel distance beside zip without inventing validation.

## What Changes

- Add/restore validation for `max_distance` as a positive integer kilometers within configured bounds (default **1–50** unless product later picks presets-only in step 02).
- Extend onboarding location + cultural preference payloads to accept `max_distance` and persist it with `country` / `city` / `zip_code`.
- Remove the blanket “always set `max_distance` to null” policy on preference/location writes.
- Keep clearing legacy `districts` on location writes; GDPR anonymization continues to clear preference fields including `max_distance`.
- Unit tests for accept/reject bounds and successful merge with `zip_code`.
- Out of scope: UI controls (step 02); feed filtering by distance; docs/Gherkin/e2e (step 03); SQL migration (JSONB key already exists).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `member-profile`: Preference saves SHALL persist validated `max_distance` with location fields and SHALL NOT clear it to null as a blanket policy; out-of-range values rejected.
- `member-onboarding`: Location step persistence SHALL store `max_distance` together with `country`, `city`, and `zip_code` when submitted with valid values.

## Impact

- **Domain:** `@unveiled/auth` — `LocationStepPayload`, `validateOnboardingStepPayload("location")`, `validateCulturalPreferencesPayload` / `updateCulturalPreferences`; shared max-distance helper + constants.
- **Types:** `UserProfile.max_distance` already on `@unveiled/db` schema typing — no SQL migration.
- **Tests:** `packages/auth/src/onboarding.test.ts`, `packages/auth/src/profile.test.ts` (and any helper unit tests).
- **GDPR:** Confirm anonymize paths still clear `max_distance` with other preference fields (no regression).
- **App compile:** Minimal type-safe updates if web form parsers omit `max_distance` until step 02 (lint/typecheck green).
- **Source brief:** `.dev-plan/current-iteration/onboarding-travel-distance-01-domain-and-persistence.md`
- **Parent:** `.dev-plan/current-iteration/onboarding-travel-distance-parent-guide.md`
- **Depends on:** external `berlin-zip-code` (released); none within this parent
- **Consumed by:** `onboarding-travel-distance-02-ui-surfaces`
- **Verification:** `bun run lint`; `bun run typecheck`; unit tests for max_distance validation/persistence
