## Context

Parent feature: multi subtitle languages on events (`.dev-plan/current-iteration/01-event-subtitle-languages-parent-guide.md`), step 01 — schema + catalog domain only. See proposal.md for motivation.

Current state:

- `events.has_subtitles` boolean NOT NULL default false + nullable `subtitle_language` text (`packages/db/src/schema/events.ts`, migration `0015_event_subtitles.sql`).
- `resolveEventSubtitles(hasSubtitles, subtitleLanguage)` in `packages/db/src/catalog/event-subtitles.ts`: off → language null; on → one uppercase ISO 639-1 via `isIso6391LanguageCode` (broader than `EVENT_LANGUAGE_CODES`; `SW` allowed). Throws `INVALID_SUBTITLE_LANGUAGE` otherwise.
- `CreateEventInput` / `UpdateEventInput` take `subtitleLanguage?: string | null`. `cloneEvent` copies the scalar. Admin list `eventLanguageFilterCondition` ORs `unnest(languages)` with `lower(subtitle_language) = $code`.
- Admin form still posts `subtitle_language` (native `<select>`). `parseEventFormBody` returns `subtitleLanguage: string | null`. UI, Gherkin, and public DETAILS join copy are step 02.

Constraints: business logic in `@unveiled/db`; `public` schema only; `bun run db:generate` then review SQL; do not model `neon_auth`; no admin CheckboxMultiSelect / Playwright / DETAILS copy rewrite this step.

## Goals / Non-Goals

**Goals:**

- Persist `events.subtitle_languages text[]` (nullable). Drop `subtitle_language` after backfill.
- Shared coerce: off → `{ hasSubtitles: false, subtitleLanguages: null }`; on → unique uppercase ISO 639-1, length ≥ 1, else `INVALID_SUBTITLE_LANGUAGE`.
- Thread the array through create / update / clone / language filter.
- Keep the build green: wrap posted `subtitle_language` → `[code]` in `parseEventFormBody`; compile-fix TypeScript callers. Display may still show the first code.
- Unit tests for off-clears, ≥1 ISO, uniqueness, single-code wrap, `SW` allowed.

**Non-Goals:**

- Admin CheckboxMultiSelect, form field rename (`subtitle_language` POST name stays until step 02).
- Public DETAILS join copy, admin/featured table multi-code labels, Gherkin/Playwright (step 02).
- Caption files, member-feed subtitle filter, changing spoken `languages` / `language_independent`.
- Narrowing subtitle codes to `EVENT_LANGUAGES`.
- New AGENTS.md convention.

## Decisions

1. **Nullable `subtitle_languages text[]`; drop `subtitle_language`**
   - **Choice:** Drizzle `subtitleLanguages: text("subtitle_languages").array()` — nullable, no `.notNull()`, no default, no CHECK pairing with `has_subtitles`. Domain still owns on/off invariants (same as today’s scalar).
   - **Rationale:** Matches spoken `languages: text[]` (nullable). Empty vs unset is `null` when off, never `{}` from catalog writes.
   - **Alternatives:** Keep both columns (two sources of truth); `NOT NULL DEFAULT '{}'` (collapses off with empty-on and fights the “off → null” coerce).

2. **Migration: add → backfill → drop (next file after `0025_`)**
   - **Choice:** `bun run db:generate`, then hand-edit so SQL is:
     1. `ALTER TABLE "events" ADD COLUMN "subtitle_languages" text[];`
     2. `UPDATE "events" SET "subtitle_languages" = ARRAY["subtitle_language"] WHERE "has_subtitles" AND "subtitle_language" IS NOT NULL;`
     3. `ALTER TABLE "events" DROP COLUMN "subtitle_language";`
   - Same backfill shape as `0017_sour_kree.sql` (`date_times = ARRAY[date_time]`). Snapshot/`meta/_journal.json` stay in sync with the generated name; only SQL body is edited.
   - Rows with `has_subtitles = true` and null language stay `subtitle_languages` null (pre-existing invalid); next catalog write still rejects until a code is supplied.
   - **Rationale:** Step plan lock. Generated rename/drop would lose data.
   - **Alternatives:** Dual-read period (extra code for one deploy); view/compat column (unused once types change).

3. **`resolveEventSubtitles` takes an array; unique uppercase, first-seen order**
   - **Choice:**
     ```ts
     resolveEventSubtitles(
       hasSubtitles: boolean,
       subtitleLanguages: string[] | null | undefined,
     ): { hasSubtitles: boolean; subtitleLanguages: string[] | null }
     ```
     | Input | Result |
     |---|---|
     | `hasSubtitles = false` (any list) | `{ hasSubtitles: false, subtitleLanguages: null }` |
     | on + missing / empty / all-blank | throw `INVALID_SUBTITLE_LANGUAGE` |
     | on + any non-ISO token | throw `INVALID_SUBTITLE_LANGUAGE` (do not silently drop) |
     | on + `["en", "DE", "EN", " sw "]` | `{ hasSubtitles: true, subtitleLanguages: ["EN", "DE", "SW"] }` |

     Dedupe is case-insensitive after trim+uppercase; first-seen order; do **not** alpha-sort (spoken `languages` keep caller order).
   - Keep error code `INVALID_SUBTITLE_LANGUAGE`. Message may say “at least one ISO 639-1 code”.
   - **Rationale:** Step plan: unique uppercase, ≥1, `SW` still allowed. Silent-drop of bad codes would hide admin mistakes.
   - **Alternatives:** Dual helper signature `string | string[]` (only if a catalog caller is painful; prefer updating callers). Alpha-sort (changes clone equality vs source order).

4. **Catalog inputs are array-only — no lingering `subtitleLanguage` on create/update**
   - **Choice:** Replace `subtitleLanguage?: string | null` with `subtitleLanguages?: string[] | null` on `CreateEventInput` / `UpdateEventInput`. `insertEventRow` / update SET / `cloneEvent` copy `subtitles.subtitleLanguages`. Update merge: if `input.subtitleLanguages !== undefined` use it, else `existing.subtitleLanguages`.
   - Seed demo: `subtitleLanguages: ["EN"]`. Booking/e2e/story fixtures: `subtitleLanguages: null` or `["EN"]`.
   - **Rationale:** Step plan prefers updating all catalog callers this step. A transitional string on the input type would leak into step 02.
   - **Alternatives:** Accept `string` on input and wrap (allowed only if wrap is trivial and a caller cannot be updated; not needed).

5. **Language filter uses `unnest(subtitle_languages)`**
   - **Choice:** Replace `lower(subtitle_language) = $code` with the spoken-languages pattern:
     ```sql
     exists (select 1 from unnest(subtitle_languages) as sub where lower(sub) = $lower)
     ```
     Keep OR with spoken `unnest(languages)`. Null/empty array → no subtitle match. Language-independent events still match only via subtitle (unchanged).
   - **Rationale:** Parent risk: missing this leaves subtitled-only events unfindable after the column drop.
   - **Alternatives:** `subtitle_languages @> ARRAY[code]` (case-sensitive unless codes are always upper; unnest+lower matches today’s spoken filter).

6. **Temporary parser wrap; UI still posts `subtitle_language`**
   - **Choice:** In `parseEventFormBody`, keep reading `body.subtitle_language`. Map to `subtitleLanguages: hasSubtitles && code ? [code] : null` (or `[]` then let domain reject — prefer null when off, `[code]` when on with a value, `null` when on with blank so domain throws). Change `EventFormValues.subtitleLanguage` → `subtitleLanguages: string[] | null`. `toCreateEventInput` / `toUpdateEventInput` pass the array.
   - Compile-fix display that still expects a scalar: `event.subtitleLanguages?.[0] ?? null` in `EventDetailPage` DETAILS, `AdminEventsTable` / `AdminFeaturedAddResults` subtitle column, `EventAdminBaseFields` `defaultSelectedKey`. Do **not** join with commas or switch to CheckboxMultiSelect.
   - **Rationale:** Step plan: temporary wrap so the build stays green; remove wrap in step 02 when the control posts `subtitle_languages[]`.
   - **Alternatives:** Leave form values as `subtitleLanguage` and wrap only in `admin-event-input` (two names live longer). Compat getter on the Drizzle row (hides the rename).

7. **Tests: unit helper required; clone integration when DB is available**
   - **Choice:**
     - `packages/db/src/catalog/event-subtitles.unit.test.ts` — off clears to `null`; on requires ≥1 ISO; `" en "` → `["EN"]`; `["en","DE","EN"]` → `["EN","DE"]`; `"sw"` / `["SW"]` allowed; `null` / `[]` / `"xx"` throw `INVALID_SUBTITLE_LANGUAGE`. Include a backfill-equivalent wrap: treating a single code as `[code]` (parser or a one-line helper used by the parser; unit-test the domain with arrays).
     - `clone-event.integration.test.ts` — create with `subtitleLanguages: ["DE","EN"]`; expect clone equal. Skip when `DATABASE_URL` unset (existing file already requires DB).
   - **Rationale:** Step verification names the unit file; clone is optional-with-reason.
   - **Alternatives:** SQL migration test (no harness); fold uniqueness only into createEvent integration (needs DB).

8. **Schema-overview one-liner allowed; Gherkin stays single-select**
   - **Choice:** Update `docs/product/database/schema-overview.md` `subtitle_language` row to `subtitle_languages text[]`. Do **not** edit `admin-events.feature` / `event-discovery.feature` (still describe native `<select>`). Mark step 01 done in the parent guide at handoff.
   - **Rationale:** Schema SoT would be wrong if this PR lands alone. Canonical Gherkin is step 02.

## Risks / Trade-offs

- **[Risk] Generated migration drops the column without backfill** → Mitigation: always hand-edit; review SQL before applying; never commit a bare DROP.
- **[Risk] Filter still references `subtitle_language` after the drop** → Mitigation: same PR as schema; typecheck fails if the Drizzle field is gone and SQL still uses it.
- **[Risk] Type ripple across apps/web + e2e fixtures** → Mitigation: array field + `?.[0]` compile-fix only; no copy/join rewrite.
- **[Trade-off] Public DETAILS and admin tables still show one code** → Accepted until step 02. Domain can already store many; UI ignores extras.
- **[Trade-off] Parser still understands only the old POST name** → Accepted; step 02 removes the wrap when CheckboxMultiSelect posts an array.
- **[Trade-off] No DB CHECK that on ⇒ cardinality ≥ 1** → Same as today; catalog is the only writer.

## Migration Plan

1. Change Drizzle `events` column `subtitleLanguage` → `subtitleLanguages` (`text[]`); update comments.
2. `bun run db:generate`; hand-edit: ADD `subtitle_languages`, backfill `ARRAY[subtitle_language]` where `has_subtitles AND subtitle_language IS NOT NULL`, DROP `subtitle_language`. Next number after `0025_`.
3. Rewrite `resolveEventSubtitles` + create/update/clone/filter; update seed.
4. Parser wrap + compile-fix TS callers (`?.[0]` for remaining single-select UI).
5. Update unit tests; run clone integration if `DATABASE_URL` is set.
6. Optional schema-overview one-liner; mark step 01 done in the parent guide.
7. `bun run typecheck` and `bun run lint`.
8. Rollback: restore `subtitle_language` from `subtitle_languages[1]` then drop the array column (only safe before step 02 depends on many codes).

## Open Questions

- None blocking. Whether `parseEventFormBody` tests assert `subtitleLanguages: ["EN"]` vs a tiny wrap helper is an implementation detail; domain tests use arrays.
