## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/01-event-subtitle-languages-02-admin-and-public-ui.md`, parent guide release criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 01 is present: `events.subtitle_languages` exists; `parseEventFormBody` still wraps `body.subtitle_language` → `[code]`; Subtitles UI is still `AdminFormSelect` `name="subtitle_language"`

## 2. Copy, options, and form control

- [x] 2.1 Pluralize `subtitleLanguageLabel` (Untertitelsprachen / Subtitle languages); update `hasSubtitlesHint` and `fieldErrors.subtitleLanguage` to one-or-more; add `subtitleLanguagesSearchPlaceholder` + `subtitleLanguagesSearchHint`; keep `INVALID_SUBTITLE_LANGUAGE` → `subtitleLanguage`
- [x] 2.2 Reorder `getEventSubtitleLanguageOptions` so `FEATURED_PREFERRED_LANGUAGES` come first, then remaining ISO 639-1 codes A–Z by locale label (still full ISO, not `EVENT_LANGUAGES`)
- [x] 2.3 Replace the Subtitles `AdminFormSelect` in `EventAdminBaseFields` with searchable `CheckboxMultiSelect` `name="subtitle_languages"`, `initialVisibleCount={LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE}`, shown only when `hasSubtitles`; hide when unchecked

## 3. Parser and display

- [x] 3.1 In `parseEventFormBody`, read `subtitle_languages` via `parseBodyStringArrayField`; on → posted array (empty `[]` if none); off → `null`; stop reading `body.subtitle_language`
- [x] 3.2 Public DETAILS: join every `subtitleLanguages` code with `", "` (same as spoken languages on that page); omit the row when off or empty
- [x] 3.3 Admin Events table and Featured add-results: join all subtitle codes through `formatAdminLanguageCode`, else em dash

## 4. Unit tests and stories

- [x] 4.1 Update `admin-event-form.test.ts`: on + `["DE","EN"]`; on + lone `"EN"` string; on + missing → `[]`; off clears posted codes to `null`; `subtitle_language` is ignored
- [x] 4.2 Update Ladle / fixtures that still assume a subtitle `<select>` or scalar (`EventAdminBaseFields.stories`, detail stories if they document a single code as the only shape)

## 5. Gherkin, Playwright, canonical docs

- [x] 5.1 Rewrite `admin-events.feature` titles `Check Subtitles reveals language multi-select` and `Save event with Subtitles and multiple languages`; update language-independent Then to multi-select. Rewrite `event-discovery.feature` `Detail shows subtitles when present` to every stored code
- [x] 5.2 Playwright + `e2e/fixtures/admin.ts`: `subtitleLanguages?: string[]` (default `["EN"]`); checkboxes + subtitle search (no `getByLabel` on a select); reveal test proves full ISO via search (Swahili / Icelandic); save test DE+EN on public DETAILS. `test("Scenario: …")` matches Gherkin verbatim
- [x] 5.3 Update `design-system.md` Form controls, `content-i18n-inventory.md`, `gaps-and-decisions.md`, `ui-component-map.md`, `coverage-matrix.md` titles/notes; grep `schema-overview.md` for leftover singular `subtitle_language` column wording

## 6. Verification & handoff

- [x] 6.1 Grep `apps/`, `e2e/`, `docs/product/` for leftover POST name `subtitle_language` / subtitle `<select>` (archive/history exempt)
- [x] 6.2 Run `bun run lint` and `bun run typecheck` — exit 0. Run `cd apps/web && bun test app/lib/admin-event-form.test.ts` — array parse / off clears list
- [x] 6.3 Playwright `-g "Subtitle"`: admin scenarios skipped (`E2E_ADMIN_*` unset); discovery omit passed; discovery “when present” needs a reseeded demo promo event (`has_subtitles`) — live DB event had no subtitles row. Documented in coverage-matrix.
- [x] 6.4 Mark step 02 done and the feature released in `.dev-plan/current-iteration/01-event-subtitle-languages-parent-guide.md`. Confirm canonical product specs match shipped behavior. Do not add an AGENTS.md hard rule
