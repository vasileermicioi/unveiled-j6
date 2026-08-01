## Why

Step 01 already requires and persists `max_distance` (1–50 km) on onboarding location and Vibes preference saves, and web parsers fail closed when the field is missing — but member forms still only show zip under Germany/Berlin, so those POSTs cannot succeed with a user-chosen distance. This step adds the travel-distance controls beside zip so members can set willing travel km, and confirms admin Membership HQ shows the stored value.

## What Changes

- Onboarding step 3 (`LocationStepForm` + location POST): add a **required** native travel-distance control beside zip (Germany/Berlin defaults unchanged); submit `max_distance` with the location trio.
- Profile Vibes (`PreferencesForm` + preferences POST): same distance control beside zip; required when saving location fields.
- Restore DE/EN copy for travel distance (e.g. “How far will you travel?” / “Wie weit bist du bereit zu fahren?”) plus km unit; map `invalid_max_distance` (and related) to on-page form errors.
- Admin user detail: keep/show radius intel row when `max_distance` is non-null; omit or show unset when null — do not invent a value; update stale “not collected” comments if needed.
- Out of scope: docs/Gherkin/i18n inventory/e2e (step 03); using distance in discovery/feed queries; map/geolocation UI; reintroducing Bezirk multi-select.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `member-onboarding`: Step 3 SHALL collect travel distance (km) beside zip under Germany/Berlin defaults via a native control; submitting valid values stores country, city, zip_code, and max_distance.
- `member-profile`: Vibes SHALL allow editing travel distance (`max_distance`) together with zip and other Vibes fields; both zip and distance save on preference POST.
- `admin-users`: Membership HQ member detail SHALL show travel distance in km when `max_distance` is non-null; when null, omit or show unset — must not invent a value.

## Impact

- **Onboarding UI:** `LocationStepForm.tsx` (+ stories), `onboarding-content.ts` (+ tests), location route error mapping for `invalid_max_distance`.
- **Profile UI:** `PreferencesForm.tsx`, preferences POST error surfacing; reuse onboarding copy for distance labels where already shared.
- **Admin intel:** `AdminUserDetailPage.tsx` (+ fixtures/stories if needed), `admin-content.ts` `usersPrefRadius` label (already present).
- **Domain unchanged:** `@unveiled/auth` `validateMaxDistance` / `MAX_DISTANCE_MIN`–`MAX_DISTANCE_MAX` / parsers in `onboarding-route.ts` + `profile-route.ts` already accept `max_distance` / `maxDistance`.
- **Source brief:** `.dev-plan/current-iteration/onboarding-travel-distance-02-ui-surfaces.md`
- **Parent:** `.dev-plan/current-iteration/onboarding-travel-distance-parent-guide.md`
- **Depends on:** `onboarding-travel-distance-01-domain-and-persistence` (done)
- **Consumed by:** `onboarding-travel-distance-03-docs-and-e2e`
- **Verification:** `bun run lint`; `bun run typecheck`; manual smoke: set zip + distance on onboarding; edit in Vibes; see value on admin member detail
