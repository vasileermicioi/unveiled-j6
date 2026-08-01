## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/berlin-zip-code-03-onboarding-and-profile-ui.md` and parent guide Location Model + travel-distance non-goal
- [x] 1.2 Confirm preference save field names from step 01 (`country` / `city` / `zipCode` / form `zip_code`) and inventory shim UI in `LocationStepForm`, `PreferencesForm`, parsers, `AdminUserDetailPage`

## 2. Onboarding location UI

- [x] 2.1 Update `onboarding-content.ts` (+ tests): replace district hangout copy with country/city/zip labels, displays, and Berlin-serves hint (DE+EN)
- [x] 2.2 Update `LocationStepForm` to show visible non-editable Germany/Berlin + native `zip_code` input; keep hidden named `country=DE` / `city=berlin`; no districts multi-select; no travel radius
- [x] 2.3 Confirm location POST / `parseLocationPayload` round-trips zip + country/city; map `PostalValidationError` (or equivalent) to a user-visible onboarding error if missing
- [x] 2.4 Update `LocationStepForm` stories for the new controls

## 3. Profile Vibes UI

- [x] 3.1 Update `PreferencesForm` location section to the same Germany/Berlin + zip chrome and shared onboarding copy keys
- [x] 3.2 Confirm preferences POST / `parsePreferencesPayload` round-trips and surfaces invalid zip errors without mutating prefs
- [x] 3.3 Confirm travel radius / `max_distance` control remains absent on Vibes

## 4. Admin member intel

- [x] 4.1 Update `AdminUserDetailPage` preference row to show zip (+ country/city) instead of districts list; drop districts fallback chrome
- [x] 4.2 Rename `usersPrefDistricts` (and DE/EN strings) in `admin-content.ts` to zip/location labels
- [x] 4.3 Update AdminUserDetail / member fixtures/stories that still present Bezirk districts as location intel

## 5. Verification and handoff

- [x] 5.1 Grep member UI for leftover Bezirk multi-select on onboarding/profile; leave unused `DISTRICTS` / `getDistrictLabel` only if still needed elsewhere (full cleanup → step 04)
- [x] 5.2 Run `bun run lint` — exit 0
- [x] 5.3 Run `bun run typecheck` — exit 0
- [x] 5.4 Manual smoke: complete onboarding location with valid Berlin PLZ (country/city stay Germany/Berlin); invalid rejected; Vibes edit updates zip; travel radius still absent
- [x] 5.5 Mark step done in parent guide; leave Gherkin/docs/e2e for step 04; do not mark travel-distance work done; note change ID for PR/handoff
