## Why

Admins cannot mark that an event has subtitles or which language those subtitles use, so members cannot tell whether a spoken-language event is accessible via captions. Parent UX polish step 04 adds a single allowlisted subtitle language, independent of spoken languages / language-independent.

## What Changes

- Add `has_subtitles` (boolean, default false) and nullable allowlisted `subtitle_language` on events; validate language required when on, null when off; clone/seed preserve the pair.
- Admin create/edit: native Subtitles checkbox + required native language `<select>` from `EVENT_LANGUAGES` when checked (independent of spoken languages multi-select / language-independent).
- Public event detail: when `has_subtitles` is true, show subtitles availability + language label in DETAILS; when false, omit subtitles chrome.
- Align schema overview, admin-events / event-discovery features, coverage matrix, Playwright (proximity selectors), admin copy/stories; optional demo seed example.
- Out of scope: multi-select subtitle languages; caption/subtitle file uploads; feed filters by subtitles; `ux-polish-05`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Events SHALL support `has_subtitles` (default false) and nullable allowlisted `subtitle_language`; language required when on, null when off; independent of spoken languages / `language_independent`.
- `admin-events`: Admin create/edit SHALL offer a native Subtitles checkbox and, when checked, a required native language select from the event language allowlist.
- `event-discovery`: When `has_subtitles` is true, public detail SHALL show subtitles availability and language label; when false, omit subtitles chrome.
- `bdd-and-e2e`: Admin checkbox/select and public display SHALL have Playwright coverage (proximity selectors) or a named coverage-matrix deferral.

## Impact

- **Schema / domain (`@unveiled/db`):** Drizzle `events` columns + migration; create/update/clone validation; catalog unit tests; optional seed fixture.
- **Admin UI (`apps/web`):** `EventAdminBaseFields`, `admin-event-form` parsers, `admin-content` DE/EN copy, stories; native checkbox + `<select>` only (no HeroUI Select/Switch).
- **Public UI:** `EventDetailPage` DETAILS metadata row (+ stories/fixtures as needed).
- **Docs / e2e:** `schema-overview.md`; `admin-events.feature`, `event-discovery.feature`; coverage matrix; Playwright admin-events / event-discovery; optional `gaps-and-decisions.md` / i18n inventory note.
- **Source brief:** `.dev-plan/current-iteration/ux-polish-04-event-subtitles.md`
- **Parent:** `.dev-plan/current-iteration/ux-polish-parent-guide.md`
- **Depends on:** none (independently mergeable; preferred after 03 for delivery order only)
- **Consumed by:** none (next planned: `ux-polish-05-featured-thumbnails`)
- **Verification:** `bun run lint`; `bun run typecheck`; catalog unit tests + touched Playwright
