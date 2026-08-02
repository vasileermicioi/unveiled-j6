## 1. Schema & domain

- [x] 1.1 Confirm prerequisites: `events` Drizzle schema, catalog create/update/clone, `EVENT_LANGUAGES`, `EventAdminBaseFields`, `EventDetailPage`, admin-events / event-discovery features, coverage matrix
- [x] 1.2 Add `has_subtitles` (boolean NOT NULL default false) and nullable `subtitle_language` on `events`; generate + apply migration
- [x] 1.3 Add domain resolve/validate helper (on → require allowlisted code; off → coerce language null); wire into create/update inputs
- [x] 1.4 Copy `hasSubtitles` + `subtitleLanguage` in `cloneEvent`; optional demo seed with one subtitled event
- [x] 1.5 Add catalog unit tests for require/coerce/independence/clone paths

## 2. Admin UI

- [x] 2.1 Extend `event-admin-types` / form defaults with subtitle fields
- [x] 2.2 Add native Subtitles checkbox + conditional `AdminFormSelect` for `subtitle_language` in `EventAdminBaseFields` (independent of language-independent; no HeroUI Select/Checkbox/Switch)
- [x] 2.3 Parse/validate `has_subtitles` / `subtitle_language` in `admin-event-form.ts` (+ tests)
- [x] 2.4 Add DE+EN labels/hints/errors in `admin-content.ts`; update `EventAdminBaseFields` stories

## 3. Public detail

- [x] 3.1 Show DETAILS MetaCell for subtitles + language when `has_subtitles` is true; omit when false (`EventDetailPage`)
- [x] 3.2 Update fixtures / `EventDetailPage.stories.tsx` for subtitled and non-subtitled cases

## 4. Docs & e2e

- [x] 4.1 Document columns in `docs/product/database/schema-overview.md`; note in gaps/i18n inventory if useful
- [x] 4.2 Add Gherkin scenarios to `admin-events.feature` and `event-discovery.feature` matching the spec deltas
- [x] 4.3 Update `coverage-matrix.md`; add Playwright proximity tests (or named deferral) for admin save + public display
- [x] 4.4 Mark `ux-polish-04-event-subtitles` done in `.dev-plan/current-iteration/ux-polish-parent-guide.md`

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run catalog unit tests for subtitle validation/clone — pass
- [x] 5.4 Run touched Playwright specs (or confirm named coverage-matrix deferral) — pass / documented
  <!-- Specs + coverage-matrix rows added. Live Playwright needs `db:migrate` (0015) + R2; not executed in this session (shared Neon mutate blocked). -->
