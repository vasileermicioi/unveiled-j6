## Context

Parent feature: multi subtitle languages on events (`.dev-plan/current-iteration/01-event-subtitle-languages-parent-guide.md`), step 02 of 02 — admin/public UI, parser field rename, Gherkin/e2e, canonical docs. See proposal.md for motivation.

Step 01 is done (`01-event-subtitle-languages-01-schema-and-domain`, archived 2026-08-20):

- `events.subtitle_languages text[]` (nullable). `resolveEventSubtitles` off → `null`; on → unique uppercase ISO 639-1, length ≥ 1, else `INVALID_SUBTITLE_LANGUAGE`. `SW` still allowed. Clone and admin `language=` filter use the array.
- Admin form still posts `subtitle_language` (native `AdminFormSelect`). `parseEventFormBody` wraps a single code as `[code]`. Display uses `subtitleLanguages?.[0]`.

Current live UI this step replaces:

- `EventAdminBaseFields` Subtitles block: native checkbox `has_subtitles` + `AdminFormSelect` `name="subtitle_language"`, `defaultSelectedKey={defaults?.subtitleLanguages?.[0]}`, options from `getEventSubtitleLanguageOptions` (full ISO, DE+EN pinned then A–Z). Spoken languages already use `CheckboxMultiSelect` `name="languages"` with search + `LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE`.
- `EventDetailPage` DETAILS: `event.languages.join(", ")` (raw codes); subtitles value is `event.subtitleLanguages?.[0]` only.
- `AdminEventsTable` / `AdminFeaturedAddResults`: spoken languages join `formatAdminLanguageCode`; subtitles format only `[0]`.
- E2E: `getByLabel(adminLabels.subtitleLanguage)` on a `<select>`; `createEventViaUI` `subtitleLanguage?: string` + `selectOptionByLabel`.

Constraints: SSR form POST only; HeroUI chrome + native checkboxes (hard rules §8, §14); no client-only save; Playwright titles match Gherkin verbatim; proximity selectors; yellow page / theme tokens unchanged. Domain catalog contract is frozen (step 01) — this step must not retouch `resolveEventSubtitles` / migration.

## Goals / Non-Goals

**Goals:**

- Subtitles-on → searchable `CheckboxMultiSelect` posting `subtitle_languages`; Subtitles-off → control unmounted, persist `subtitle_languages = null`.
- Remove `subtitle_language` POST name and the step-01 parser wrap.
- Public DETAILS and admin/featured Subtitles cells list every stored code.
- Plural DE/EN copy + i18n inventory; Gherkin/Playwright/fixtures match multi-select + one-or-more.
- Mark step 02 done and the parent feature released.

**Non-Goals:**

- Caption files / timed-text assets.
- Member-feed filter by subtitle language.
- Changing spoken `languages` / `language_independent` / `EVENT_LANGUAGES`.
- Narrowing subtitle codes to `EVENT_LANGUAGES`.
- Native HTML `required` on a checkbox group (HTML treats each checkbox independently; catalog error is the requirement).
- New AGENTS.md rule or design tokens.

## Decisions

1. **Reuse `CheckboxMultiSelect`; POST name `subtitle_languages`**
   - **Choice:** In `EventAdminBaseFields`, replace the Subtitles `AdminFormSelect` with the same island already used for spoken languages:

     ```tsx
     {hasSubtitles ? (
       <Surface className="flex w-full flex-col gap-1" variant="transparent">
         <Label>{copy.subtitleLanguageLabel}</Label>
         <CheckboxMultiSelect
           enableSearch
           filterPlaceholder={copy.subtitleLanguagesSearchPlaceholder}
           initialVisibleCount={LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE}
           name="subtitle_languages"
           options={subtitleLanguageOptions.map((option) => ({
             value: option.id,
             label: option.label,
           }))}
           searchHint={copy.subtitleLanguagesSearchHint}
           selected={defaults?.subtitleLanguages ?? []}
         />
       </Surface>
     ) : null}
     ```

     Keep the existing `has_subtitles` native checkbox + `useState` show/hide. Do **not** add a `required` prop to the island. Empty-on is rejected by `resolveEventSubtitles` → `INVALID_SUBTITLE_LANGUAGE` → `fieldErrors.subtitleLanguage` (existing map in `admin-content.ts`).
   - **Rationale:** Step plan: same searchable checkbox pattern; selected values stay mounted when filtered (island already does this). HTML `required` on checkboxes cannot express “at least one of this name.”
   - **Alternatives:** `<select multiple>` (forbidden by design-system); HeroUI Select (hard rule §14); wrap `LanguageMultiSelect` (onboarding-only featured list — wrong allowlist).

2. **Featured-first default list on the full ISO options**
   - **Choice:** Keep `getEventSubtitleLanguageOptions` as the **full** ISO 639-1 list (collapse same-label pairs, as today). Reorder so `FEATURED_PREFERRED_LANGUAGES` (`DE`, `EN`, `TR`, `RU`, `PL`, `AR`, `FR`, `ES`, `IT`, `UK`, `VI`, `PT`) come first in that order, then remaining codes A–Z by locale display label. Set `initialVisibleCount={LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE}` (that featured length). Search matches label **or** code (island already does). Do **not** shrink the option list to `EVENT_LANGUAGES`.
   - **Rationale:** Step plan: default-visible MAY be DE/EN plus a short featured set; search finds Swahili / Icelandic. Reusing the spoken featured set keeps one Berlin-common default. If we only pin DE+EN and then A–Z, `initialVisibleCount = 12` would show Afrikaans etc., not TR/RU.
   - **Alternatives:** Default-visible = DE+EN only (`initialVisibleCount={2}`) — weaker parity with spoken search UX; duplicate a second featured constant — unnecessary.

3. **Parser: array field only; off clears; empty-on stays empty for domain reject**
   - **Choice:** In `parseEventFormBody`:

     ```ts
     const hasSubtitles = asString(body.has_subtitles) === "on";
     const postedSubtitleLanguages = parseBodyStringArrayField(
       body,
       "subtitle_languages",
       asString,
     );
     const subtitleLanguages = hasSubtitles ? postedSubtitleLanguages : null;
     ```

     Stop reading `body.subtitle_language`. When on + `[]`, pass `[]` so catalog throws `INVALID_SUBTITLE_LANGUAGE` (same as missing). When off, ignore any posted codes (control is unmounted). `eventToFormDefaults` already passes `event.subtitleLanguages`. `toCreateEventInput` / `toUpdateEventInput` already pass the array.
   - **Rationale:** Step plan: remove the temporary wrap. `parseBodyStringArrayField` already handles checkbox arrays for `languages`.
   - **Alternatives:** Keep reading `subtitle_language` as a one-element fallback (hides missed callers; leave a landmine). Coerce empty-on to `null` in the parser (would skip the catalog error and persist invalid off-like state if `hasSubtitles` stayed true).

4. **Public DETAILS join raw codes; admin/featured join locale labels**
   - **Choice:** DETAILS: `event.hasSubtitles && event.subtitleLanguages && event.subtitleLanguages.length > 0` → `MetaCell` value `event.subtitleLanguages.join(", ")` (identical to spoken `event.languages.join(", ")` on that page). Off → omit the row. Admin Events + Featured add-results: `formatSubtitleLanguage` maps every code through `formatAdminLanguageCode` and joins `", "`, else `"—"`.
   - **Rationale:** Parent lock: match spoken presentation on the same surface. Public = codes; admin tables = labels.
   - **Alternatives:** Format public DETAIL with `formatAdminLanguageCode` (breaks “same as spoken codes on that page”); show only `[0]` (this step’s bug).

5. **Copy keys: pluralize label; add subtitle search strings; keep error key**
   - **Choice:**

     | Key | DE | EN |
     |---|---|---|
     | `subtitleLanguageLabel` | Untertitelsprachen | Subtitle languages |
     | `hasSubtitlesHint` | Unabhängig von gesprochenen Sprachen. Eine oder mehrere Sprachen aus der vollständigen Liste wählen. | Independent of spoken languages. Choose one or more languages from the full list. |
     | `subtitleLanguagesSearchPlaceholder` (new) | Untertitelsprachen suchen | Search subtitle languages |
     | `subtitleLanguagesSearchHint` (new) | Same idea as `languagesSearchHint` (only common languages shown; search finds the rest). | (EN equivalent) |
     | `fieldErrors.subtitleLanguage` | …mindestens eine gültige ISO-639-1… | …at least one valid ISO 639-1… |

     Keep `catalogErrorMessages.INVALID_SUBTITLE_LANGUAGE → "subtitleLanguage"`. Do not rename the error key (would churn `mapCatalogError` tests for no user benefit).
   - **Rationale:** Distinct placeholder so e2e can target the subtitle search without colliding with spoken “Sprachen suchen”. Plural label is the step-plan copy lock.
   - **Alternatives:** Reuse spoken search placeholder (ambiguous when both controls are visible).

6. **Gherkin titles locked for Playwright `test("Scenario: …")`**

   | File | Title | Intent |
   |---|---|---|
   | `admin-events.feature` | `Check Subtitles reveals language multi-select` | **Replace** `Check Subtitles reveals language select`. After check: searchable checkboxes, full ISO via search (Swahili / Icelandic), no native `<select>` for the subtitle field, ≥1 required (submit empty-on → field error **or** assert required copy / catalog error). |
   | `admin-events.feature` | `Save event with Subtitles and multiple languages` | **Replace** `Save event with Subtitles and language`. Create with DE+EN; public DETAILS shows both codes. |
   | `admin-events.feature` | `Subtitles controls available when language-independent` | Keep title; Then = multi-select, not select. |
   | `event-discovery.feature` | `Detail shows subtitles when present` | Keep title; And = each stored code (seeded promo may still be one-element `{EN}` — still valid “one or more”). |

   - **Rationale:** Existing tests use `Check …` / `Save event with …`. Changing only “select” → “multi-select” and “language” → “multiple languages” keeps grep-friendly titles.
   - **Alternatives:** Spec-delta wording “Checking subtitles reveals…” (drifts from sibling scenarios).

7. **E2E fixtures: checkboxes + search; no `getByLabel` on a select**
   - **Choice:**
     - `adminLabels.subtitleLanguage` → `/untertitelsprachen|subtitle languages/i`.
     - Add `subtitleLanguagesSearch: /untertitelsprachen suchen|search subtitle languages/i`.
     - `CreateEventOverrides.subtitleLanguages?: string[]` (ISO codes). Remove `subtitleLanguage?: string`. Default `["EN"]` when `hasSubtitles`.
     - Helper: for each code, `checkOptionByName` on the locale label (EN → `/englisch|english/i`); if not visible, fill the **subtitle** search (placeholder above), then check. Do not use `selectOptionByLabel` for this field.
     - Reveal test: assert subtitle `<select>` count is 0; search visible; DE/EN checkboxes visible without search; fill search `"SW"` / Icelandic and expect those checkboxes (full ISO). Option-count-on-select is gone.
     - Save test: `subtitleLanguages: ["DE", "EN"]`; DETAILS proximity: subtitles label + `DE` and `EN` (joined `"DE, EN"` if check order is DE then EN).
     - `event-discovery.spec.ts` `Detail shows subtitles when present`: keep seeded promo `EN` assertion; still valid for one-or-more.
   - **Rationale:** Spoken-languages e2e already uses `checkOptionByName` + search. R2 skip unchanged (partner logo).
   - **Alternatives:** DB-seed a two-code event for discovery (heavier; admin save scenario already covers two codes on public DETAIL).

8. **Canonical docs in this step**
   - **Choice:**
     - `admin-events.feature` / `event-discovery.feature` — titles and steps above.
     - `design-system.md` Form controls — add **admin event subtitle languages** to the multi-value allowlist examples.
     - `content-i18n-inventory.md` — spoken = `CheckboxMultiSelect`; subtitles = searchable `CheckboxMultiSelect` (not `AdminFormSelect`); plural keys.
     - `gaps-and-decisions.md` — replace “subtitle language uses native `<select>`” with multi-select + `subtitle_languages text[]`.
     - `ui-component-map.md` Events / Featured — Subtitles column lists all codes; create/edit subtitle control is checkbox multi-select.
     - `coverage-matrix.md` — retitle the three scenario rows; notes: checkboxes + search, not native select.
     - `schema-overview.md` — already `subtitle_languages text[]` from step 01; grep for leftover `subtitle_language` (singular column) and fix if any.
   - **Rationale:** Step plan owns doc updates; parent release criteria name these files.

9. **Unit tests for array parse / off clears list**
   - **Choice:** Replace `parseEventFormBody keeps subtitle language when subtitles on` (body `subtitle_language: "EN"`) with:
     - on + `subtitle_languages: ["DE", "EN"]` → `["DE", "EN"]`
     - on + `subtitle_languages: "EN"` (single posted value) → `["EN"]` (`parseBodyStringArrayField` already accepts a lone string)
     - on + missing/empty → `[]` (domain rejects later; parser does not wrap)
     - off + posted codes → `null`
     - posted `subtitle_language` is **ignored**
   - **Rationale:** Step verification names this file. Catalog uniqueness/ISO stay in `@unveiled/db` (already shipped).

## Risks / Trade-offs

- **[Risk] Spoken and subtitle searches both on the page** → Mitigation: distinct placeholders; e2e targets subtitle placeholder, not a generic “search languages”.
- **[Risk] Full ISO list (~180) in the DOM when Subtitles is checked** → Accepted; same as today’s `<select>` option count. `initialVisibleCount` only hides, it does not drop nodes for selected + featured; search filter unmounts non-matching unselected options from the visible list but selected stay posted.
- **[Risk] Empty-on submit has no browser `required`** → Mitigation: catalog error + existing field-error chrome; e2e reveal scenario does not need to submit empty-on if the save scenario covers happy path and unit tests cover `[]`.
- **[Risk] Playwright still uses `getByLabel(subtitleLanguage)` on a select** → Mitigation: rewrite those three tests in the same PR; grep `subtitle_language` / `getByLabel(adminLabels.subtitleLanguage)` in `e2e/` and `apps/web`.
- **[Trade-off] Seeded promo event stays one-element `{EN}`** → Discovery e2e still passes “one or more”; two-code coverage lives in admin save + DETAILS.
- **[Trade-off] Public DETAILS stays raw codes (`DE, EN`)** → Matches spoken row; admin tables stay labels.

## Migration Plan

1. Confirm step 01 column + parser wrap exist (`subtitle_languages` in Drizzle; `body.subtitle_language` in `parseEventFormBody`).
2. Copy + `getEventSubtitleLanguageOptions` featured-first order; swap Subtitles control to `CheckboxMultiSelect`; parser array field; DETAILS + admin/featured joins.
3. Unit tests for `parseEventFormBody`; Ladle stories that still pass `subtitle_language` / a select.
4. Gherkin + Playwright + fixtures + canonical docs listed in Decision 8.
5. `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/admin-event-form.test.ts`.
6. Playwright `-g "Subtitle"` when `DATABASE_URL` (and R2 for admin create) is set; otherwise document skip.
7. Grep `apps/`, `e2e/`, `docs/product/` for `subtitle_language` (POST name / singular select). Archive/history exempt.
8. Mark step 02 done and the feature released in the parent guide.
9. **Rollback:** revert the PR. Domain array column stays (step 01); UI would again need a wrap to compile if rolled back alone — roll back UI+parser together.

## Open Questions

- None blocking. Whether to add a two-code seed for the discovery e2e is optional and out of this step (admin save already hits public DETAILS with DE+EN).
