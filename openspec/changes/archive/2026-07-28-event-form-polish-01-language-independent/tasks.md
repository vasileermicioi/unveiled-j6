## 1. Schema & catalog domain

- [x] 1.1 Add `language_independent` boolean (`NOT NULL`, default `false`) to `packages/db` events schema and generate/apply Drizzle migration
- [x] 1.2 Extend `CreateEventInput` / `UpdateEventInput` (and series create path) to accept `languageIndependent`; when true, force `languages = null` on write
- [x] 1.3 Export the field on event select/types used by admin and public detail; update seed fixtures if they construct full event rows
- [x] 1.4 Add a reusable language-filter match helper (language-independent ⇒ matches any selected language; else intersect `languages`) with unit or integration coverage

## 2. Admin form parse & UI

- [x] 2.1 Parse `language_independent` from admin form body; extend `EventFormValues`, defaults, and `eventToFormDefaults`
- [x] 2.2 Add native checkbox + show/hide for languages `CheckboxMultiSelect` in `EventAdminBaseFields` (covers create, edit, and series)
- [x] 2.3 Add DE/EN admin copy (`languageIndependentLabel` + short hint with exhibition example) in `admin-content.ts`

## 3. Public detail & discovery surfaces

- [x] 3.1 Update `EventDetailPage` (and any shared languages metadata) to show language-independent label or omit languages — never an empty misleading list
- [x] 3.2 Wire the match helper into any existing language filter/query path if one already exists; otherwise leave helper exported and documented for future feed filters (no new filter dropdown)

## 4. Product docs

- [x] 4.1 Update `docs/product/features/admin-events.feature` for language-independent checkbox, hide behavior, and mutual exclusivity with languages
- [x] 4.2 Update `docs/product/features/event-discovery.feature` with forward-compatible language-filter matching + detail metadata scenarios
- [x] 4.3 Update `docs/product/database/schema-overview.md`, `extras/content-i18n-inventory.md`, and `extras/gaps-and-decisions.md`

## 5. Verification & handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run focused db/catalog or form tests for “flag ⇒ languages null” and “matches any language filter” (exit 0)
- [ ] 5.3 Manual smoke: check Language-independent on `/admin/events/new` → languages control disappears → save → edit shows flag on and no languages picker
- [x] 5.4 Mark step done in `.dev-plan/current-iteration/event-form-polish-parent-guide.md` when merging; prepare PR/handoff linking this change id
