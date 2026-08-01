## Why

Step 01 already persists `country` / `city` / `zip_code` on profiles and left compile-shim zip inputs on onboarding step 3 and Vibes — but those forms still use hangout/district copy, hide Germany/Berlin, and Membership HQ still labels preference intel as districts. This step makes member location UX match the postal model (and the admin pattern from step 02) so new and returning members set a Berlin PLZ under fixed Germany/Berlin.

## What Changes

- Onboarding step 3 (`LocationStepForm` + location POST): replace districts-era chrome with **prefilled, non-editable** country (Germany / Deutschland) and city (Berlin) plus a **native** zip/PLZ input; keep travel radius absent.
- Profile Vibes (`PreferencesForm` + preferences POST): same location chrome and field contract (`country`, `city`, `zip_code`).
- Update DE/EN copy (Country / Land, City / Stadt, PLZ / Zip code) plus a short hint that Unveiled currently serves Berlin — without claiming the data model can never expand.
- Admin member detail preference intel: show zip (and country/city when useful) instead of a districts multi-select list; update labels accordingly.
- Stop offering Bezirk multi-select on these member surfaces; leave unused `DISTRICTS` / `getDistrictLabel` constants only if still needed elsewhere (full cleanup → step 04).
- Out of scope: `max_distance` / travel-distance UI; event admin UI (step 02 done); Gherkin/docs/e2e matrix (step 04); city/country picker; additional cities.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `member-onboarding`: Step 3 collects Berlin PLZ under fixed Germany/Berlin instead of 12-Bezirk multi-select; travel radius still not collected.
- `member-profile`: Vibes location editor collects/edits `zip_code` under prefilled Germany/Berlin with shared postal validation; no districts multi-select; travel radius still not collected.
- `admin-users`: Membership HQ member detail preference intel shows zip (+ country/city) instead of districts list.

## Impact

- **Onboarding UI:** `LocationStepForm.tsx` (+ stories), `onboarding-content.ts` (+ tests), location route POST / `parseLocationPayload` error mapping if needed.
- **Profile UI:** `PreferencesForm.tsx`, profile content modules if they own location labels, preferences POST handler / validation error surfacing.
- **Admin intel:** `AdminUserDetailPage.tsx` (+ stories/fixtures), `admin-content.ts` preference label keys (`usersPrefDistricts` → zip/location labels).
- **Unchanged:** Domain `validatePostalCode` / preference persistence from step 01; event admin/public zip UX (02); product Gherkin/schema-overview/e2e wording (04); travel-distance feature.
- **Source brief:** `.dev-plan/current-iteration/berlin-zip-code-03-onboarding-and-profile-ui.md`
- **Parent:** `.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`
- **Depends on:** `berlin-zip-code-01-schema-and-domain` (done); may proceed in parallel with 02 (02 also done)
- **Consumed by:** `berlin-zip-code-04-docs-and-e2e`; enables `onboarding-travel-distance-*`
- **Verification:** `bun run lint`; `bun run typecheck`; manual smoke: onboarding location with valid/invalid Berlin PLZ; Vibes zip edit; travel radius still absent
