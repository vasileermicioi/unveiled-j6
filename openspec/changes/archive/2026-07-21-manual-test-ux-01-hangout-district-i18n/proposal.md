## Why

Manual QA on `/en/onboarding/location` shows hangout chips with the same expanded German district names as DE (e.g. Kreuzberg for both locales). Root cause: `districtLabels.de` and `districtLabels.en` in `onboarding-content.ts` are identical, so locale switch never changes the chips. Unit tests already expect DE Berlin shorthand vs EN expanded names — the maps need to match that contract.

## What Changes

- Differentiate `districtLabels` so DE uses Berlin shorthand for `X-Berg` / `P-Berg` / `F-Hain` (other DE names stay as today) and EN keeps expanded labels (`Kreuzberg`, `Prenzlauer Berg`, `Friedrichshain`, …).
- Align `onboarding-content.test.ts` with those maps; keep “every allowlist value has a label” coverage.
- Confirm `LocationStepForm` and `PreferencesForm` keep rendering via `getDistrictLabel(locale, value)` (no raw allowlist keys as display text).
- Update `docs/product/extras/content-i18n-inventory.md` district note so it no longer implies both locales expand identically.
- Stored allowlist keys in `@unveiled/auth/constants` stay unchanged.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-onboarding`: Hangout/district option labels SHALL differ by URL locale — DE Berlin shorthand for `X-Berg` / `P-Berg` / `F-Hain`; EN expanded district names; stored values remain allowlist keys.
- `member-profile`: Profile preferences hangout chips SHALL use the same `getDistrictLabel` DE/EN contract as onboarding (no separate label map).

## Impact

- **Content maps:** `apps/web/app/lib/onboarding-content.ts` (`districtLabels` / `getDistrictLabel`).
- **Tests:** `apps/web/app/lib/onboarding-content.test.ts` (DE shorthand + EN expanded assertions).
- **Consumers (spot-check only):** `LocationStepForm.tsx`, `PreferencesForm.tsx` — already call `getDistrictLabel`.
- **Product docs:** `docs/product/extras/content-i18n-inventory.md` district guidance.
- **Unchanged:** allowlist keys, onboarding step order, accessibility section (step 02), membership/profile chrome (steps 03–05), inventing non-Berlin English names for Mitte/Wedding/etc.
- **Source brief:** `.dev-plan/current-iteration/manual-test-ux-01-hangout-district-i18n.md`
- **Parent:** `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- **Consumed by:** `manual-test-ux-02-accessibility-section-title` (same onboarding/preferences forms)
- **Verification:** `bun run lint`, `bun run typecheck`, `bun test apps/web/app/lib/onboarding-content.test.ts`; manual DE/EN chip labels on `/onboarding/location`
