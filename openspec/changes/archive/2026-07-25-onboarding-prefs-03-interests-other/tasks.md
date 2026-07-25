## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/onboarding-prefs-03-interests-other.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites exist: `INTERESTS` in `@unveiled/auth/constants`, `InterestsStepForm.tsx`, `PreferencesForm.tsx`, `validateOnboardingStepPayload("interests", …)`, `parseInterestsPayload`, `UserProfile` in `packages/db/src/schema/users.ts`
- [x] 1.3 Grep for `INTERESTS`, `InterestsStepPayload`, `parseInterestsPayload`, `interestLabels`, and admin preference rows to list every touchpoint

## 2. Types, allowlist, and validation

- [x] 2.1 Append `"Other"` to `INTERESTS`; add `INTERESTS_OTHER_MAX_LENGTH = 100`; export from `@unveiled/auth` as needed
- [x] 2.2 Add `interests_other?: string | null` to `UserProfile`
- [x] 2.3 Extend `InterestsStepPayload` with `interests_other` and update interests validation: require trimmed non-empty text when Other selected; reject over-length; set `interests_other: null` when Other absent
- [x] 2.4 Update `parseInterestsPayload` and profile preferences parser to read `interests_other` from form body
- [x] 2.5 Update `packages/auth` unit tests: reject Other without text; accept Other + text; clear text when Other absent; reject over-length

## 3. Copy and UI

- [x] 3.1 Add interest labels EN `Other` / DE `Sonstiges` in `onboarding-content.ts`; add free-text field label/placeholder copy if needed for a11y
- [x] 3.2 Update `InterestsStepForm`: show native free-text when Other checked; post `name="interests_other"`; seed from `profile.interests_other`
- [x] 3.3 Mirror the same Other + free-text UX in `PreferencesForm`
- [x] 3.4 Theme free-text via existing onboarding / admin-native input classes (layout Tailwind only)
- [x] 3.5 Fix `onboarding-content` tests and any stories/fixtures that enumerate all `INTERESTS`

## 4. Admin member detail

- [x] 4.1 Add admin copy key for Other interest (EN/DE)
- [x] 4.2 Show `interests_other` on `AdminUserDetailPage` preferences when present (empty/null follows existing sparse-field pattern)

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` (exit 0)
- [x] 5.2 Run `bun run typecheck` (exit 0)
- [x] 5.3 Run auth (+ onboarding-content) unit tests covering Other + `interests_other` rules
- [x] 5.4 Confirm moods and the original eight interests were not renamed; Gherkin/e2e/product SoT not rewritten (deferred to step 04)
- [x] 5.5 Mark step done in `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`; note remaining doc/e2e work for step 04
