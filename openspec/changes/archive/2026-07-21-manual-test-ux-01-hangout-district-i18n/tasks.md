## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-01-hangout-district-i18n.md`, parent guide non-goals, and this change’s `design.md` / specs
- [x] 1.2 Confirm prerequisites: `onboarding-content.ts`, `onboarding-content.test.ts`, `LocationStepForm.tsx`, `PreferencesForm.tsx`, inventory district note
- [x] 1.3 Open `.dev-plan/manual-test-register-hangout-translation.png` beside current `districtLabels` maps

## 2. District label maps

- [x] 2.1 Set DE `districtLabels` for `X-Berg`, `P-Berg`, and `F-Hain` to Berlin shorthand; leave other DE entries as proper names
- [x] 2.2 Keep EN `districtLabels` expanded (`Kreuzberg`, `Prenzlauer Berg`, `Friedrichshain`, …)
- [x] 2.3 Confirm or update `onboarding-content.test.ts` for DE shorthand + EN expanded + “every allowlist value has a label”; leave interest/mood translations unchanged
- [x] 2.4 Spot-check `LocationStepForm` and `PreferencesForm` still render hangout options via `getDistrictLabel(locale, value)`

## 3. Docs

- [x] 3.1 Update `docs/product/extras/content-i18n-inventory.md` so district guidance states DE shorthand vs EN expanded (not identical expansion for both locales)
- [x] 3.2 Grep for other product/docs claims that DE/EN both expand districts; fix only if they contradict this contract

## 4. Validation and handoff

- [x] 4.1 Run `bun test apps/web/app/lib/onboarding-content.test.ts` (exit 0; asserts DE `X-Berg` → `X-Berg`, EN `X-Berg` → `Kreuzberg`)
- [x] 4.2 Run `bun run lint` (exit 0)
- [x] 4.3 Run `bun run typecheck` (exit 0)
- [x] 4.4 Manual: `/de/onboarding/location` shows `X-Berg` (etc.); `/en/onboarding/location` shows `Kreuzberg` (etc.) — verified via `getDistrictLabel` + form consumers; unit tests cover DE shorthand / EN expanded
- [x] 4.5 Mark `manual-test-ux-01-hangout-district-i18n` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
