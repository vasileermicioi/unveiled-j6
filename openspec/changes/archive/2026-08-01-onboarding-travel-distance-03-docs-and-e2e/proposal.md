## Why

Steps 01–02 already persist and collect travel distance (`max_distance`, 1–50 km) beside zip on onboarding step 3 and profile Vibes, and Membership HQ shows it when set — but product Gherkin, schema overview, i18n inventory, gaps/decisions, coverage matrix, and Playwright still assert that travel radius is unavailable or legacy/unused. Until SoT and e2e match the shipped UX, agents and CI keep verifying the wrong location contract and the parent feature cannot close.

## What Changes

- Flip onboarding / profile Gherkin: remove “cannot set travel distance / radius” and “travel radius is not part of Vibes”; document zip + required km distance on step 3 / Vibes.
- Update `schema-overview.md`: `max_distance` is an active integer-km preference (collected in onboarding and Vibes; preference saves no longer clear it by policy).
- Restore `radiusLabel` / `km` in `content-i18n-inventory.md` (EN “How far will you travel?” / DE “Wie weit bist du bereit zu fahren?” + `km`).
- Record step-02 UX decisions in `gaps-and-decisions.md`: native `input type="number"`; required on onboarding step 3 and Vibes location save; inclusive bounds 1–50 km (`MAX_DISTANCE_MIN` / `MAX_DISTANCE_MAX`).
- Align Playwright (onboarding step 3, profile Vibes) to assert the distance control is present; update coverage-matrix notes; grep away stale “legacy/unused” / “cannot set travel distance” claims.
- Out of scope: discovery ranking by distance; changing zip validation; new product behavior beyond docs/e2e/close-out.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `member-onboarding`: Product docs, i18n inventory, coverage matrix, and Playwright MUST describe step 3 as zip under Germany/Berlin **plus** required travel distance (km); remove “no travel radius” / “cannot set travel distance” requirements.
- `member-profile`: Product docs and Playwright MUST describe Vibes location as zip + travel distance (`max_distance`); remove “travel radius is not part of the Vibes form” requirements.
- `admin-users`: Product Gherkin / e2e titles and notes MUST stay consistent with travel distance shown when `max_distance` is set (null still omits / unset); no “radius never collected” framing.
- `event-catalog`: `schema-overview.md` MUST document `users.profile.max_distance` as an active integer-km preference (not legacy/unused); preference saves MUST NOT be documented as clearing it by policy.

## Impact

- **Product SoT:** `docs/product/features/{onboarding,profile,admin-users}.feature`, `docs/product/database/schema-overview.md`, `docs/product/extras/{content-i18n-inventory,gaps-and-decisions}.md`, `docs/product/product/user-journeys.md` (step wording if still zip-only), `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/{onboarding,profile}.spec.ts` (+ fixtures if needed); remove “no travel radius” assertions; assert distance control / labels with proximity selectors; scenario titles match Gherkin verbatim.
- **Parent close-out:** mark `onboarding-travel-distance-03` + parent guide done; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/{member-onboarding,member-profile,admin-users,event-catalog}` via this change’s deltas (not product SoT).
- **Unchanged:** domain validation / UI controls from 01–02; zip registry; feed geo-filtering; Bezirk multi-select (still gone).
- **Source brief:** `.dev-plan/current-iteration/onboarding-travel-distance-03-docs-and-e2e.md`
- **Parent:** `.dev-plan/current-iteration/onboarding-travel-distance-parent-guide.md`
- **Depends on:** `onboarding-travel-distance-02-ui-surfaces` (done)
- **Consumed by:** closes the onboarding-travel-distance parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; onboarding/profile e2e location scenarios pass or documented skip
