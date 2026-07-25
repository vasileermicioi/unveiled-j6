## Why

Onboarding step 3 and profile Vibes still offer a short informal district list (`X-Berg`, `P-Berg`, …) and collect travel radius (`max_distance`). Members need the **12 official Berlin Bezirke** as the only location preference, with travel distance removed from capture and completion rules.

## What Changes

- Replace `DISTRICTS` in `@unveiled/auth/constants` with the 12 official Berlin Bezirke (stored keys = proper Bezirk names).
- Update `getDistrictLabel` so DE and EN both show those proper names (no X-Berg / Kreuzberg split).
- **BREAKING** (preference allowlist): informal district keys (`X-Berg`, `P-Berg`, `F-Hain`, etc.) are no longer valid; legacy values are rejected or stripped on next save (no batch migration).
- Remove travel-radius UI from onboarding `LocationStepForm` and profile `PreferencesForm`.
- Stop requiring/writing `max_distance` in location + cultural-preferences validation; `isLocationStepDone` becomes districts-only.
- Clear `max_distance` to `null` on location/preferences save so stale values do not linger.
- Update parsers, unit tests, and fixtures; make admin max-distance display null-friendly (or hide) if trivial.
- Defer Gherkin/e2e/product-SoT rewrites to step 04 (except this change’s OpenSpec deltas).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `member-onboarding`: Location step uses the 12 Bezirke allowlist; travel radius is not collected; district labels are proper Bezirk names in DE/EN; step completion is districts-only.
- `member-profile`: Vibes/preferences editor mirrors the same Bezirk multi-select and no longer collects or validates travel radius.

## Impact

- **Constants / validation:** `packages/auth/src/constants.ts`, `onboarding.ts`, `profile.ts`, exports in `index.ts`; unit tests `onboarding.test.ts`, `profile.test.ts`.
- **UI:** `LocationStepForm.tsx`, `PreferencesForm.tsx` — remove radius controls; districts from new allowlist via native checkboxes.
- **Copy / labels:** `apps/web/app/lib/onboarding-content.ts` (+ tests); radius section copy unused on those surfaces.
- **Parsers / routes:** `onboarding-route.ts`, `profile-route.ts` — `max_distance` optional / cleared on save.
- **Admin (minimal):** `AdminUserDetailPage` max-distance row null-friendly or hidden if one-liner; fuller admin polish in step 04.
- **Unchanged this step:** accessibility/languages UI; interests Other; feed ranking; DB migration for JSONB keys; full Gherkin/Playwright/i18n inventory updates (step 04).
- **Source brief:** `.dev-plan/current-iteration/onboarding-prefs-01-districts-and-travel.md`
- **Parent:** `.dev-plan/current-iteration/onboarding-prefs-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `onboarding-prefs-02-accessibility-and-languages`
- **Verification:** `bun run lint`, `bun run typecheck`, `bun test packages/auth` (location/profile allowlist + no required `max_distance`)
