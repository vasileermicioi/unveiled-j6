## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-02-accessibility-section-title.md`, parent guide non-goals, and this change’s `design.md` / specs
- [x] 1.2 Confirm step 01 is merged; compare Languages vs Accessibility markup in `TimingStepForm.tsx` against `.dev-plan/manual-test-register-accessibility.png`
- [x] 1.3 Confirm touch points: `onboarding-content.ts`, `TimingStepForm.tsx`, `PreferencesForm.tsx`, `content-i18n-inventory.md`, `e2e/specs/onboarding.spec.ts`, `onboarding-content.test.ts`

## 2. Copy keys

- [x] 2.1 Replace `accessibilityLabel` with `accessibilitySectionLabel` + `accessibilityOptionLabel` on `OnboardingCopy` (DE: `BARRIEREFREIHEIT?` / `Erforderlich`; EN: `ACCESSIBILITY?` / `Required`)
- [x] 2.2 Extend `onboarding-content.test.ts` for the new keys if that file covers copy strings; remove assertions on the old single label

## 3. Form structure

- [x] 3.1 Wrap accessibility in `TimingStepForm` with the Languages pattern: section `Label` + options `Surface` + `NativePreferenceOption` using the new labels; keep `name="accessibility"` / boolean POST
- [x] 3.2 Mirror the same structure and copy keys in `PreferencesForm`

## 4. Docs and e2e

- [x] 4.1 Update `docs/product/extras/content-i18n-inventory.md` rows for the split accessibility keys
- [x] 4.2 Update `e2e/specs/onboarding.spec.ts` accessible-name matcher for the short option label; grep `e2e/` for other old accessibility strings
- [x] 4.3 Grep for leftover `accessibilityLabel` / `ACCESSIBILITY REQUIRED` / `BARRIEREFREIHEIT ERFORDERLICH` and fix only in-scope references

## 5. Validation and handoff

- [x] 5.1 Run `bun test apps/web/app/lib/onboarding-content.test.ts` (exit 0)
- [x] 5.2 Run `bun run lint` (exit 0)
- [x] 5.3 Run `bun run typecheck` (exit 0)
- [x] 5.4 Manual: onboarding step 4 shows accessibility section title above the chip, parallel to Languages — verified via `TimingStepForm` / `PreferencesForm` Languages-parallel markup + split copy keys
- [x] 5.5 Mark `manual-test-ux-02-accessibility-section-title` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
