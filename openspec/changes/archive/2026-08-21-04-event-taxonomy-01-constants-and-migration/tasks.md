## 1. Setup

- [x] 1.1 Read step plan + parent guide locked tables; confirm artifacts (`packages/auth/src/constants.ts` `EVENT_TYPES` + `INTERESTS`, `getEventCategoryOptions` / `getEventTypeOptions` in `admin-content.ts`, `insertEventRow` / `updateEvent` in `packages/db/src/catalog/events.ts`, latest drizzle `0027_`)
- [x] 1.2 Lock write semantics: new keys only (no dual-accept); empty → `REQUIRED_FIELD`; unknown → `INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE`; do not change `INTERESTS`

## 2. Taxonomy module

- [x] 2.1 Add `packages/db/src/catalog/event-taxonomy.ts` with `EVENT_CATEGORIES` (27) and `EVENT_TYPES` (32) in parent-table order, DE/EN label maps, `getEventCategoryLabel` / `getEventTypeLabel` (unknown key → raw key), `LEGACY_EVENT_CATEGORY_MAP` / `LEGACY_EVENT_TYPE_MAP` (exact parent pairs including `Music`/`music`/`Art`/`Film`/`Talk`), `mapLegacyEventCategory` / `mapLegacyEventType`, `assertEventCategory` / `assertEventType`; export from `packages/db/src/catalog/index.ts`
- [x] 2.2 Add `INVALID_EVENT_CATEGORY` and `INVALID_EVENT_TYPE` to `CatalogErrorCode`
- [x] 2.3 Remove `EVENT_TYPES` and `EventType` from `packages/auth/src/constants.ts` and the auth barrel; keep `INTERESTS` unchanged

## 3. Domain validation and migration

- [x] 3.1 Use `assertEventCategory` / `assertEventType` in `insertEventRow` and `updateEvent` (update only when the field is in input)
- [x] 3.2 Hand-write `packages/db/drizzle/0028_event_taxonomy.sql` plus `_journal.json` entry: `UPDATE` CASE maps for category and event_type (ELSE keep value), then `RAISE EXCEPTION` listing remaining distinct values not in the allowlists; do not run `db:generate`

## 4. Admin options and errors

- [x] 4.1 Point `getEventCategoryOptions` / `getEventTypeOptions` at the new lists + label helpers (parent order); drop `INTERESTS` / auth `EVENT_TYPES` / local `eventTypeLabels` from those helpers; leave `getInterestLabel` on `INTERESTS`
- [x] 4.2 Map `INVALID_EVENT_CATEGORY` / `INVALID_EVENT_TYPE` to `fieldErrors.category` / `eventType` in `catalogErrorMessages` / `mapCatalogErrorCode`

## 5. Callers that write events

- [x] 5.1 Update `createEvent` / `updateEvent` fixtures in `packages/db` to new keys (`theater` / `theater_play` unless the test needs a specific pair); discovery filters must use the stored new key, not `Theater`
- [x] 5.2 Update `packages/db/src/catalog/seed.ts` and `seed-pagination-data.ts` using the parent map (`Theater`→`theater`, `Konzert`→`live_music_venue`, `Performance`→`theater_play`, `Concert`→`concert`)
- [x] 5.3 Update admin/discovery stories whose `<select>` values must match options (`music`/`Music`/`Theater`/`Kino`/`Live`); do not remap `scripts/fetch-abundo-seed.ts`; do not add feed `Theater` aliases

## 6. Tests

- [x] 6.1 Add `packages/db/src/catalog/event-taxonomy.unit.test.ts`: lengths 27/32; no `Other`; both locales labeled; parent DE/EN samples (`cinema`→Kino/Cinema); every legacy pair maps; `Music`/`music`→`live_music_venue`; unknown map → `undefined`; `assertEventCategory("Music")` → `INVALID_EVENT_CATEGORY`; `assertEventType("Performance")` → `INVALID_EVENT_TYPE`; empty → `REQUIRED_FIELD`
- [x] 6.2 Confirm `onboarding-content.test.ts` still asserts `INTERESTS` including `Other` (`Kino`→Cinema)

## 7. Verification and handoff

- [x] 7.1 Run `bun run lint` — exits 0
- [x] 7.2 Run `bun run typecheck` — exits 0
- [x] 7.3 Run `cd packages/db && bun test src/catalog/event-taxonomy.unit.test.ts` — exits 0
- [x] 7.4 Grep `INTERESTS` in `packages/auth/src/constants.ts` still lists `Theater`…`Other`; mark step 01 done in `04-event-taxonomy-parent-guide.md`; do not edit Gherkin, Playwright, schema-overview, or Abundo
