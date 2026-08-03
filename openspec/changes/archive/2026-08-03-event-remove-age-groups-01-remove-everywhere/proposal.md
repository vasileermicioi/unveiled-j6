## Why

Product no longer tracks audience age bands on catalog events. Admins still set `target_age_groups`, the column still exists, and tests/docs still require the field — so this single step removes it end-to-end so nothing writes or displays event age groups. Member onboarding `age_group` is unchanged.

## What Changes

- **BREAKING** (schema): Drop `events.target_age_groups` via Drizzle migration; remove from `packages/db` events schema.
- Remove `targetAgeGroups` from catalog create/update/clone inputs and writes (`@unveiled/db` catalog events).
- Remove admin CheckboxMultiSelect, labels, `getEventAgeGroupOptions`, form parse/map helpers, and story fixtures.
- Remove e2e scenario “Age groups multi-select without search”; update unit tests and coverage matrix.
- Update product SoT: `admin-events.feature`, `event-discovery.feature` (DETAILS), `schema-overview.md`, design-system / i18n / gaps mentions of event age groups.
- Out of scope: onboarding `age_group`, browse filters, multi-datetime, spoken languages / subtitles / barrier-free.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Optional accessibility/audience metadata SHALL NOT include target age groups; remove age-groups multi-select requirement and BDD/e2e coupling for that scenario.
- `event-catalog`: Schema and admin form contracts SHALL NOT include `target_age_groups`; languages multi-select remains; native selects list drops age groups.
- `event-discovery`: Public event DETAILS SHALL NOT show a Target age groups / Zielgruppe row (zip DETAILS rules unchanged as already specified).
- `design-system`: Multi-value allowlist guidance SHALL drop “admin event age groups” as an example; languages/onboarding checkbox multi-select remain.

## Impact

- **DB (`@unveiled/db`):** `packages/db/src/schema/events.ts`; new migration dropping `target_age_groups`; `packages/db/src/catalog/events.ts` (+ unit/booking fixtures that set `targetAgeGroups`).
- **Web admin (`apps/web`):** `EventAdminBaseFields.tsx`, `event-admin-types.ts`, `admin-event-form.ts` / `admin-event-input.ts` / `admin-event-route-helpers.ts`, `admin-content.ts` (`getEventAgeGroupOptions`, labels), stories fixtures, related unit tests.
- **E2E / matrix:** `e2e/specs/admin-events.spec.ts` (remove age-groups scenario); `e2e/specs/event-discovery.spec.ts` + coverage-matrix rows; product feature files under `docs/product/features/`.
- **Docs:** `docs/product/database/schema-overview.md`, `docs/product/ui/design-system.md`, `content-i18n-inventory.md`, `gaps-and-decisions.md` as needed; parent guide checkbox.
- **Source brief:** `.dev-plan/current-iteration/01-event-remove-age-groups-01-remove-everywhere.md`
- **Parent:** `.dev-plan/current-iteration/01-event-remove-age-groups-parent-guide.md`
- **Depends on:** none (single child step; closes the feature)
- **Verification:** `bun run lint`; `bun run typecheck`; targeted unit tests; grep sanity — no remaining `target_age_groups` / `targetAgeGroups` / `getEventAgeGroupOptions` in app or packages
