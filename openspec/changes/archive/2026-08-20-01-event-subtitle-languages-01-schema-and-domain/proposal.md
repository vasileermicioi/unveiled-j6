## Why

Admins can only persist one subtitle language (`events.subtitle_language`) even though spoken event languages are already a `text[]`. Step 02 of parent `01-event-subtitle-languages` needs a multi-code column and catalog contract before the admin CheckboxMultiSelect and public DETAILS join can land. This step is the schema + domain foundation (step 01 of 02).

## What Changes

- **BREAKING** (catalog types / SQL): replace `events.subtitle_language` (`text`) with `events.subtitle_languages` (`text[]`, nullable). Drop the old column after backfill.
- Migration: add `subtitle_languages`; copy each existing non-null `subtitle_language` into a one-element array when `has_subtitles` is true; drop `subtitle_language`. Next Drizzle number after `0025_`.
- Rewrite `resolveEventSubtitles(hasSubtitles, subtitleLanguages)`: off → `{ hasSubtitles: false, subtitleLanguages: null }`; on → unique uppercase ISO 639-1 codes, **at least one**, else `INVALID_SUBTITLE_LANGUAGE`. Subtitle codes stay broader than spoken `EVENT_LANGUAGES` (`SW` still allowed).
- Update `CreateEventInput` / `UpdateEventInput` / `cloneEvent` / `eventLanguageFilterCondition` to the array shape. Filter uses `unnest(subtitle_languages)` (same pattern as spoken `languages`).
- Temporary parser wrap only: if the admin form still posts `subtitle_language`, `parseEventFormBody` wraps that single code as `[code]` so the build stays green. Remove the wrap in step 02.
- Compile-fix remaining TypeScript callers (seed, booking fixtures, UI that reads the Drizzle field) without rewriting admin CheckboxMultiSelect, Gherkin, or public DETAILS join copy.
- Out of scope: admin multi-select UI, Playwright/Gherkin, public DETAILS multi-code copy, caption file upload, member-feed subtitle filter.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Events SHALL persist `has_subtitles` plus nullable `subtitle_languages` (`text[]` of unique uppercase ISO 639-1 codes). Create/update SHALL require a non-empty valid list when on and SHALL persist `null` when off. `cloneEvent` SHALL copy the pair. A migration SHALL backfill each existing non-null `subtitle_language` as a one-element array. Admin list `language=` SHALL match spoken `languages` **or** any code in `subtitle_languages` (case-insensitive).

## Impact

- **DB:** `packages/db/src/schema/events.ts`; new migration after `0025_` (generated then hand-edited for backfill + drop). Optional one-line `subtitle_languages` note in `docs/product/database/schema-overview.md`; full Gherkin / gaps-and-decisions wait for step 02.
- **Domain:** `packages/db/src/catalog/event-subtitles.ts`, `events.ts` (`CreateEventInput` / `UpdateEventInput` / clone / `eventLanguageFilterCondition`), unit tests, clone integration (if `DATABASE_URL`), seed fixture.
- **Compile-green web:** `parseEventFormBody` wrap; TypeScript field rename on event rows (`subtitleLanguage` → `subtitleLanguages`). Display may still show the first code until step 02 — no UI rewrite.
- **Source brief:** `.dev-plan/current-iteration/01-event-subtitle-languages-01-schema-and-domain.md`
- **Parent:** `.dev-plan/current-iteration/01-event-subtitle-languages-parent-guide.md`
- **Consumed by:** `01-event-subtitle-languages-02-admin-and-public-ui`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/db && bun test src/catalog/event-subtitles.unit.test.ts`; clone integration when `DATABASE_URL` is set
