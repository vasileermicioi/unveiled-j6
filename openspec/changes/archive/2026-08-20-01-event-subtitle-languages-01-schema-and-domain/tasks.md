## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`packages/db/src/schema/events.ts`, `packages/db/drizzle/0015_event_subtitles.sql`, `packages/db/src/catalog/event-subtitles.ts`, `CreateEventInput` / `UpdateEventInput` / `eventLanguageFilterCondition` / `cloneEvent` in `packages/db/src/catalog/events.ts`, `event-subtitles.unit.test.ts`)
- [x] 1.2 Confirm latest drizzle file is `0025_`; lock write semantics: off → `subtitleLanguages` null; on → unique uppercase ISO 639-1, length ≥ 1, else `INVALID_SUBTITLE_LANGUAGE`; `SW` still allowed

## 2. Schema & migration

- [x] 2.1 Replace Drizzle `subtitleLanguage: text("subtitle_language")` with `subtitleLanguages: text("subtitle_languages").array()` (nullable, no default); update column comments
- [x] 2.2 Run `bun run db:generate`; hand-edit the new file (next after `0025_`): `ADD COLUMN "subtitle_languages" text[]`; `UPDATE … SET "subtitle_languages" = ARRAY["subtitle_language"] WHERE "has_subtitles" AND "subtitle_language" IS NOT NULL`; `DROP COLUMN "subtitle_language"`; do not commit a generated drop without backfill

## 3. Catalog domain

- [x] 3.1 Rewrite `resolveEventSubtitles(hasSubtitles, subtitleLanguages)` to return `{ hasSubtitles, subtitleLanguages: string[] | null }`: off clears to null; on unique-cases (first-seen order), rejects missing/empty/non-ISO with `INVALID_SUBTITLE_LANGUAGE`
- [x] 3.2 Replace `subtitleLanguage` with `subtitleLanguages?: string[] | null` on `CreateEventInput` / `UpdateEventInput`; persist the resolved array on create/update; `cloneEvent` copies `hasSubtitles` + `subtitleLanguages`
- [x] 3.3 Change `eventLanguageFilterCondition` to `unnest(subtitle_languages)` (same pattern as spoken `languages`); keep OR with spoken codes; update the list-options comment
- [x] 3.4 Update seed (`packages/db/src/catalog/seed.ts`) to `subtitleLanguages: ["EN"]` (or equivalent one-element list)

## 4. Parser wrap & compile-fix

- [x] 4.1 In `parseEventFormBody`, keep reading `body.subtitle_language`; set `subtitleLanguages` to `[code]` when subtitles are on and a code is posted, else `null`; thread the array through `admin-event-input` / route helpers
- [x] 4.2 Compile-fix remaining `subtitleLanguage` on event rows (booking unit fixtures, e2e/story fixtures, `EventAdminBaseFields` `defaultSelectedKey`, DETAILS / admin table / featured-add display) with `subtitleLanguages` or `subtitleLanguages?.[0] ?? null` — no CheckboxMultiSelect, no DETAILS join copy, no POST field rename

## 5. Tests

- [x] 5.1 Update `packages/db/src/catalog/event-subtitles.unit.test.ts`: off → `subtitleLanguages: null`; on `"DE"` / `" en "` / `["SW"]`; duplicates `["en","DE","EN"]` → `["EN","DE"]`; null / `[]` / `"xx"` throw `INVALID_SUBTITLE_LANGUAGE`
- [x] 5.2 Update `parseEventFormBody` unit tests to expect `subtitleLanguages: ["EN"]` (or null when off) while the form still posts `subtitle_language`
- [x] 5.3 If `DATABASE_URL` is set, update `clone-event.integration.test.ts` to create/clone `subtitleLanguages: ["DE","EN"]` and assert equality; otherwise skip with reason

## 6. Verification & handoff

- [x] 6.1 Run `bun run lint` — exits 0
- [x] 6.2 Run `bun run typecheck` — exits 0
- [x] 6.3 Run `cd packages/db && bun test src/catalog/event-subtitles.unit.test.ts` — exits 0
- [x] 6.4 Replace `subtitle_language` with `subtitle_languages text[]` in `docs/product/database/schema-overview.md`; mark step 01 done in `01-event-subtitle-languages-parent-guide.md`; do not edit Gherkin, Playwright, or AGENTS.md
