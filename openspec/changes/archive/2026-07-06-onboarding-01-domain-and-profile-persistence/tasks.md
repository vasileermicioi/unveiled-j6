## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/onboarding-01-domain-and-profile-persistence.md`, `onboarding-parent-guide.md`, `proposal.md`, `design.md`, and `specs/member-onboarding/spec.md`
- [x] 1.2 Confirm Phase 2 packages exist: `@unveiled/db` (`UserProfile`, `UserBehavior`), `@unveiled/auth` (session, guards, provision)
- [x] 1.3 Read `docs/migration/features/onboarding.feature` and capture every allowed value in constants
- [x] 1.4 Read `docs/migration/database/schema-overview.md` for profile and behavior field names

## 2. Schema type extension

- [x] 2.1 Add `onboarding_step?: "age" | "interests" | "location" | "timing" | null` to `UserBehavior` in `packages/db/src/schema/users.ts`
- [x] 2.2 Document JSONB-only change (no migration) in package README or JSDoc

## 3. Onboarding domain module

- [x] 3.1 Create `packages/auth/src/onboarding.ts` with exported readonly allowlist constants (age groups, interests, moods, districts, timing, weekdays, preferred languages, distance bounds)
- [x] 3.2 Define `OnboardingStep` type and per-step payload types (including age skip flag)
- [x] 3.3 Implement `getOnboardingStepPath(profile, behavior)` — prefer `behavior.onboarding_step`, fallback inference, default `/onboarding/age`
- [x] 3.4 Implement validation helpers and `OnboardingValidationError` for allowlist and distance checks
- [x] 3.5 Implement `saveOnboardingStep(db, userId, step, payload)` — validate, merge profile fields, set `behavior.onboarding_step` to next step, set `preferences_updated_at` (Europe/Berlin)
- [x] 3.6 Implement age skip path: advance without writing `age_group`
- [x] 3.7 Implement `completeOnboarding(db, userId)` — set `onboarding_complete`, `onboarding_completed_at`, clear `onboarding_step`
- [x] 3.8 Re-export public onboarding API from `packages/auth/src/index.ts`

## 4. Tests

- [x] 4.1 Add `"test": "bun test"` to `packages/auth/package.json` if not present
- [x] 4.2 Create `packages/auth/src/onboarding.test.ts` — step resolution for new user, post-age, post-interests, post-location
- [x] 4.3 Test age skip: no `age_group`, next step is interests
- [x] 4.4 Test validation: invalid interest rejected; `max_distance` 0 and 26 rejected
- [x] 4.5 Test completion: `onboarding_complete` true and `onboarding_completed_at` set (integration with `DATABASE_URL` or mocked tx, skip when unset)
- [x] 4.6 Test partial merge preserves `first_name` / unrelated profile fields

## 5. Documentation

- [x] 5.1 Add onboarding API section to `packages/auth/README.md` (exports, step order, skip behavior, timestamp convention)

## 6. Validation

- [x] 6.1 Run `cd packages/auth && bun test` — all onboarding tests pass
- [x] 6.2 Run `bun run typecheck` — no errors across workspaces
- [x] 6.3 Run `bun run lint` — passes

## 7. Wrap-up

- [x] 7.1 Mark step 01 done in `onboarding-parent-guide.md` when change is archived
- [x] 7.2 Hand off to `onboarding-02-guard-middleware`
