## Why

Step 01 already persists `events.subtitle_languages text[]`, but the admin form still posts a single `subtitle_language` `<select>` and public/admin surfaces print `subtitleLanguages?.[0]`. Admins cannot author multiple subtitle languages, and Gherkin/Playwright still describe the old single-select. This step closes parent `01-event-subtitle-languages` (step 02 of 02).

## What Changes

- Admin create/edit: when Subtitles is checked, replace `AdminFormSelect` (`name="subtitle_language"`) with searchable `CheckboxMultiSelect` (`name="subtitle_languages"`) using `getEventSubtitleLanguageOptions` (full ISO 639-1, not spoken `EVENT_LANGUAGES`). Hide the control when unchecked. Require ≥1 checked code via existing `INVALID_SUBTITLE_LANGUAGE` / `fieldErrors.subtitleLanguage`.
- **BREAKING (form POST):** stop reading `body.subtitle_language`. `parseEventFormBody` uses `parseBodyStringArrayField(body, "subtitle_languages")`; remove the step-01 `[code]` wrap.
- Public DETAILS: join every stored subtitle code the same way spoken languages are shown on that page (comma-separated codes today).
- Admin Events table and Featured add-results Subtitles column: join locale labels via `formatAdminLanguageCode` (same pattern as spoken Languages).
- Copy: plural `subtitleLanguageLabel` (Untertitelsprachen / Subtitle languages); hint says one or more; keep `fieldErrors.subtitleLanguage` for empty/invalid lists.
- Canonical Gherkin, Playwright, `e2e/fixtures/admin.ts`, schema-overview, gaps-and-decisions, content-i18n-inventory, ui-component-map, coverage-matrix titles.
- Out of scope: caption uploads; member-feed subtitle filter; spoken-language allowlist / `EVENT_LANGUAGES` changes; new AGENTS.md hard rule.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Admin create/edit SHALL collect subtitle languages with a searchable checkbox multi-select (`subtitle_languages`) when Subtitles is checked (full ISO 639-1; ≥1 required; hidden when off). Admin/featured Subtitles cells SHALL list every stored code. Gherkin/Playwright SHALL describe multi-select + one-or-more codes, not a native `<select>`.
- `event-discovery`: Public event detail DETAILS SHALL show every code in `subtitle_languages` when `has_subtitles` is true (same presentation as spoken-language codes on that page).
- `design-system`: Multi-value allowlists SHALL include admin event subtitle languages as a `CheckboxMultiSelect` field (not `<select multiple>` or HeroUI Select).

## Impact

- **Admin UI:** `EventAdminBaseFields.tsx` Subtitles block; `admin-content.ts` (plural label, hint, search copy, `getEventSubtitleLanguageOptions` comment / featured-first order); `admin-event-form.ts` parser; `AdminEventsTable` / `AdminFeaturedAddResults` subtitle cells; Ladle stories that still assume a select.
- **Public UI:** `EventDetailPage` DETAILS subtitles `MetaCell` (join all codes; keep omit-when-off).
- **E2E:** `e2e/fixtures/admin.ts` (`subtitleLanguage` select helper → checkbox + search); `admin-events.spec.ts` and `event-discovery.spec.ts` titles matching rewritten Gherkin; proximity selectors only — no `getByLabel` on a single select.
- **Product SoT:** `docs/product/features/admin-events.feature`, `event-discovery.feature`; `docs/product/ui/design-system.md` Form controls; `docs/product/ui/ui-component-map.md`; `docs/product/extras/content-i18n-inventory.md`, `gaps-and-decisions.md`; `docs/product/database/schema-overview.md` (array already noted in step 01 — confirm wording); `docs/product/testing/coverage-matrix.md` titles.
- **Unchanged:** `@unveiled/db` `resolveEventSubtitles` / create/update/clone/filter (step 01); caption files; public feed filters.
- **Source brief:** `.dev-plan/current-iteration/01-event-subtitle-languages-02-admin-and-public-ui.md`
- **Parent:** `.dev-plan/current-iteration/01-event-subtitle-languages-parent-guide.md`
- **Depends on:** `01-event-subtitle-languages-01-schema-and-domain` (done / archived 2026-08-20)
- **Consumed by:** closes the Event subtitle languages feature
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/admin-event-form.test.ts`; Playwright `admin-events.spec.ts` + `event-discovery.spec.ts` `-g "Subtitle"` when `DATABASE_URL` is set (otherwise document skip)
