## Why

`events.category` currently reuses member onboarding `INTERESTS` (`Theater`, `Kino`, …) and `event_type` uses a short `EVENT_TYPES` list (`Performance`, `Concert`, …). Product needs a venue-category list and a performance-type list with stable snake_case keys and DE/EN labels. Step 02 cannot land translated selects, cards, and feed aliases until writes reject unknown keys and existing rows are remapped.

## What Changes

- Add `EVENT_CATEGORIES` (27 keys) and **replace** catalog `EVENT_TYPES` (32 keys) in `@unveiled/db` with locale-invariant snake_case keys, DE/EN label maps, and `getEventCategoryLabel` / `getEventTypeLabel`.
- **BREAKING:** `createEvent` / `updateEvent` (and therefore `cloneEvent`) SHALL reject unknown category/type with `INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE`. Legacy INTERESTS ids and old type strings are no longer valid writes.
- SQL migration remaps existing `events.category` / `event_type` using the parent locked map (including fixture spellings `Music`, `music`, `Art`, `Film`, `Talk`) and `RAISE EXCEPTION` if any distinct unmapped value remains.
- Switch `getEventCategoryOptions` / `getEventTypeOptions` to the new lists so admin POST stays submittable. Leave `INTERESTS` / `getInterestLabel` unchanged.
- Remove old `EVENT_TYPES` from `@unveiled/auth/constants`. Do not dual-accept old+new keys on writes.
- Update in-repo `createEvent` callers (tests, demo seed, pagination seed) to new keys. Abundo remap, card/filter label polish, Gherkin, and schema-overview wording wait for steps 02–03.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: `events.category` and `events.event_type` SHALL be locale-invariant keys from `EVENT_CATEGORIES` and `EVENT_TYPES` (parent guide). Create/update SHALL reject unknown keys (`INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE`). A migration SHALL map legacy INTERESTS/`EVENT_TYPES` values (and known fixture spellings) to the new keys and SHALL fail if any other distinct value remains. Member onboarding `INTERESTS` SHALL NOT change.

## Impact

- **Catalog constants:** new `packages/db/src/catalog/event-taxonomy.ts` (allowlists, labels, legacy maps, validators); export from the catalog barrel. Auth keeps `INTERESTS` only; delete auth `EVENT_TYPES`.
- **Domain:** `insertEventRow` / `updateEvent` validate after `requireNonEmpty`. New `CatalogErrorCode`s. Admin `mapCatalogErrorCode` maps them to existing `fieldErrors.category` / `eventType`.
- **DB:** data-only SQL after `0027_` (`UPDATE` + fail-on-unmapped). Columns stay `text`; no Drizzle schema change.
- **Web:** `getEventCategoryOptions` / `getEventTypeOptions` emit new keys + labels (parent table order).
- **Callers:** every `createEvent` / `updateEvent` fixture that inserts events must use new keys or validation fails. Demo/pagination seed included. `scripts/fetch-abundo-seed.ts` stays step 03.
- **Source brief:** `.dev-plan/current-iteration/04-event-taxonomy-01-constants-and-migration.md`
- **Parent:** `.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`
- **Consumed by:** `04-event-taxonomy-02-admin-and-discovery-ui`
- **Verification:** `bun run lint`; `bun run typecheck`; unit tests for mapping + validation; grep/test that `INTERESTS` is unchanged
