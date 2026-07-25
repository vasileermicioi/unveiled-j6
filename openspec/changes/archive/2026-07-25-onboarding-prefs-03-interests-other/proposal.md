## Why

Onboarding step 2 (“WHAT INTERESTS YOU?”) and profile Vibes only offer a fixed allowlist of eight interests with no escape hatch. Members need an **Other** checkbox plus free text so they can record an interest that is not listed, stored as `profile.interests_other`.

## What Changes

- Append allowlist key `"Other"` to `INTERESTS` (existing eight keys unchanged and first).
- Add locale labels: EN `Other`, DE `Sonstiges`.
- Extend `UserProfile` with optional `interests_other?: string | null` (JSONB — no SQL migration).
- Validation: when `Other` is in `interests`, require trimmed non-empty `interests_other` (max length ~100); when `Other` is absent, persist `interests_other: null` (ignore stray text).
- UI on interests step + profile Vibes: native checkbox for Other; when checked, show native free-text control (client show/hide OK).
- Wire interests payload types, onboarding/profile route parsers, unit tests, stories/fixtures.
- Admin member detail: show `interests_other` when present (one field — include here).
- Defer Gherkin/e2e/product-SoT rewrites to step 04 (except this change’s OpenSpec deltas).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-onboarding`: Interests step offers `Other` plus free-text when selected; validation and persistence of `interests_other`.
- `member-profile`: Vibes/preferences editor mirrors Other + free-text and the same validation rules.
- `admin-users`: Member detail shows `interests_other` when present.

## Impact

- **Constants / types:** `packages/auth/src/constants.ts` (`INTERESTS`), `packages/db/src/schema/users.ts` (`UserProfile.interests_other`), `InterestsStepPayload` in `onboarding.ts`.
- **Validation:** `validateOnboardingStepPayload("interests", …)` and cultural-preferences path in `profile.ts`; auth unit tests.
- **Parsers:** onboarding interests route + profile preferences route form parsers for `interests_other`.
- **UI:** `InterestsStepForm.tsx`, `PreferencesForm.tsx` (+ islands); optional small island or progressive disclosure for free-text visibility.
- **Copy:** `apps/web/app/lib/onboarding-content.ts` — `Other` / `Sonstiges` (+ free-text label/placeholder if needed).
- **Admin:** `AdminUserDetailPage.tsx` (+ admin copy key) for `interests_other`.
- **Unchanged this step:** the other eight interests and moods; feed ranking; full Gherkin/Playwright/i18n inventory / schema-overview polish (step 04).
- **Source brief:** `.dev-plan/current-iteration/onboarding-prefs-03-interests-other.md`
- **Parent:** `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`
- **Depends on:** `onboarding-prefs-02-accessibility-and-languages` (merged)
- **Consumed by:** `onboarding-prefs-04-hardening`
- **Verification:** `bun run lint`, `bun run typecheck`, auth unit tests for Other + text / Other without text / clear when absent
