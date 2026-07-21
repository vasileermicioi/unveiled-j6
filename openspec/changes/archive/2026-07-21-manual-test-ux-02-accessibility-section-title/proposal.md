## Why

On onboarding step 4 and profile preferences, Languages has a bold section title with option chips underneath, but accessibility is only a lone full-width chip labeled `ACCESSIBILITY REQUIRED?` / `BARRIEREFREIHEIT ERFORDERLICH?` with no section chrome (see `.dev-plan/manual-test-register-accessibility.png`). Members should see accessibility structured like languages: a locale-specific section title plus short option control(s) below.

## What Changes

- Split accessibility copy in `onboarding-content.ts` into a section title (e.g. EN `ACCESSIBILITY?`, DE `BARRIEREFREIHEIT?`) and a short option label (e.g. EN `Required`, DE `Erforderlich`); stop using the full question as the only chip label.
- Restructure `TimingStepForm` so accessibility matches the Languages block: `Label.onboarding-form__section-label` + options `Surface`, then `NativePreferenceOption` inside.
- Mirror the same structure in `PreferencesForm`.
- Update `docs/product/extras/content-i18n-inventory.md` keys/rows for the split copy.
- Update e2e accessible-name matchers in `e2e/specs/onboarding.spec.ts` and extend `onboarding-content.test.ts` if it covers these keys.
- Keep the boolean field name `accessibility` and POST shape unchanged.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-onboarding`: Accessibility preference SHALL be a titled section on step 4 (section label + options layout), matching Languages; interactive option label SHALL be a short chip string; persisted value remains boolean `accessibility`.
- `member-profile`: Profile preferences accessibility control SHALL use the same section-title + option layout and shared copy keys as onboarding.

## Impact

- **Content:** `apps/web/app/lib/onboarding-content.ts` (split `accessibilityLabel` into section title + option label keys).
- **UI:** `TimingStepForm.tsx`, `PreferencesForm.tsx` — Languages-parallel markup for accessibility.
- **Tests:** `e2e/specs/onboarding.spec.ts` name regex; `onboarding-content.test.ts` if covered.
- **Product docs:** `docs/product/extras/content-i18n-inventory.md`.
- **Unchanged:** POST field `accessibility` (boolean), hangout label maps (step 01), membership/profile shell (steps 03–05), multi-select accessibility.
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-02-accessibility-section-title.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Depends on:** `manual-test-ux-01-hangout-district-i18n` (done)
- **Verification:** `bun run lint`, `bun run typecheck`, `bun test apps/web/app/lib/onboarding-content.test.ts`; manual: step 4 shows section title above accessibility chip, parallel to Languages
