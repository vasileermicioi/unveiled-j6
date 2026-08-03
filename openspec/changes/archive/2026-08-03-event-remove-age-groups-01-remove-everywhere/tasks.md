## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/01-event-remove-age-groups-01-remove-everywhere.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm prerequisites: `packages/db/src/schema/events.ts` (`targetAgeGroups`), catalog create/update/clone, `EventAdminBaseFields`, admin form helpers, `getEventAgeGroupOptions`, admin-events e2e age-groups scenario

## 2. Schema and catalog domain

- [x] 2.1 Remove `targetAgeGroups` from `packages/db/src/schema/events.ts`; run `bun run db:generate` and review migration that drops `events.target_age_groups`
- [x] 2.2 Remove `targetAgeGroups` from `CreateEventInput` / `UpdateEventInput` and create/update/clone writes in `packages/db/src/catalog/events.ts` (and any related exports/types)
- [x] 2.3 Fix package fixtures/tests that still set `targetAgeGroups` (e.g. booking unit fixture)

## 3. Admin UI and form I/O

- [x] 3.1 Remove age-groups `CheckboxMultiSelect` block from `EventAdminBaseFields.tsx`; drop `targetAgeGroups` from `event-admin-types.ts`
- [x] 3.2 Remove parse/map of `target_age_groups` from `admin-event-form.ts`, `admin-event-input.ts`, and `admin-event-route-helpers.ts` (ignore legacy POST if present)
- [x] 3.3 Remove `getEventAgeGroupOptions`, `targetAgeGroupsLabel`, and story fixture `targetAgeGroups` from `admin-content.ts` / stories fixtures

## 4. Tests and product docs

- [x] 4.1 Update unit tests (`admin-event-form.test.ts`, route-helpers tests, etc.) so they no longer expect `targetAgeGroups`
- [x] 4.2 Remove e2e `Scenario: Age groups multi-select without search` and its coverage-matrix row; keep discovery DETAILS absence assertion (zip + no Zielgruppe) aligned with updated Gherkin
- [x] 4.3 Update `docs/product/features/admin-events.feature`, `event-discovery.feature`, `schema-overview.md`, `design-system.md`, and related i18n/gaps mentions per step-plan deltas

## 5. Cleanup and verification

- [x] 5.1 Mark step done in `.dev-plan/current-iteration/01-event-remove-age-groups-parent-guide.md`
- [x] 5.2 Grep sanity: no remaining `target_age_groups` / `targetAgeGroups` / `getEventAgeGroupOptions` in `apps/` or `packages/` (historical drizzle snapshots OK)
- [x] 5.3 Run `bun run lint` — exits 0
- [x] 5.4 Run `bun run typecheck` — exits 0
- [x] 5.5 Run targeted unit tests for admin event form parsing / catalog create — exit 0
