## Why

Travel distance (`max_distance`) is collected in onboarding step 3 and Vibes but never used to filter or rank the member feed — it is capture-for-later noise. Dropping the control simplifies location to Germany/Berlin + zip only, matching the first slice of `ux-polish`.

## What Changes

- Stop requiring, validating, showing, or writing `max_distance` on onboarding location and Vibes preference saves.
- Remove travel-distance UI, copy, and form parsers from onboarding step 3 and `/profile/preferences`.
- Leave existing JSONB `max_distance` values untouched (no SQL purge); preference/location saves SHALL NOT clear or rewrite the key.
- Admin Membership HQ SHALL still show km when `max_distance` is non-null; omit/unset when null — framed as legacy remnant, not an active preference.
- Align unit tests, stories, Gherkin, schema overview, gaps/i18n, coverage matrix, `DEPLOYMENT.md`, and Playwright with the new contract.
- Out of scope: later `ux-polish` steps; feed ranking by distance; SQL key purge.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `member-onboarding`: Location step SHALL collect Germany/Berlin + Berlin zip only and SHALL NOT require, show, or persist travel distance / `max_distance`.
- `member-profile`: Vibes location SHALL accept zip under Germany/Berlin without `max_distance` and SHALL NOT show a travel-distance control; preference saves SHALL NOT require or write `max_distance`.
- `event-catalog`: Schema overview SHALL document `max_distance` as optional legacy JSONB, not an active onboarding/Vibes preference.
- `admin-users`: Membership HQ intel MAY show legacy `max_distance` km when non-null; docs/features SHALL treat it as remnant (not an actively collected preference).

## Impact

- **Domain:** `@unveiled/auth` — drop required `maxDistance` from `LocationStepPayload` / cultural preference payloads; relax or remove `validateMaxDistance` on location/preference saves; keep constants only if still useful for admin display bounds (or leave unused until cleanup).
- **UI:** `LocationStepForm`, `PreferencesForm`, onboarding/profile route parsers + content (`radiusLabel`, `invalidMaxDistance`, km copy).
- **Admin:** `AdminUserDetailPage` keeps null/non-null display (no invention); copy/docs reframe as legacy.
- **Docs / e2e:** `onboarding.feature`, `profile.feature`, `admin-users.feature`; `schema-overview.md`; `gaps-and-decisions.md`; `content-i18n-inventory.md`; `coverage-matrix.md`; `apps/web/DEPLOYMENT.md`; Playwright onboarding/profile/admin-users specs.
- **Tests:** `packages/auth` onboarding/profile unit tests; web content tests; Ladle stories fixtures.
- **Source brief:** `.dev-plan/current-iteration/ux-polish-01-drop-travel-distance.md`
- **Parent:** `.dev-plan/current-iteration/ux-polish-parent-guide.md`
- **Reversal context:** `openspec/changes/archive/2026-08-01-onboarding-travel-distance-*`
- **Depends on:** none
- **Consumed by:** none (independently mergeable; next planned: `ux-polish-02-structured-address`)
- **Verification:** `bun run lint`; `bun run typecheck`; auth unit tests + touched onboarding/profile e2e
