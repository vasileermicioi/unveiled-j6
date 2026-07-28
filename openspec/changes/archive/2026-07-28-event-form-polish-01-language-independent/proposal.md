## Why

Partner events such as art exhibitions, installations, and silent walks often have no spoken-language requirement, but admins today can only leave `languages` empty or pick arbitrary codes. There is no first-class way to mark an event as language-independent, so metadata and any future language filter cannot treat those events correctly.

## What Changes

- Add `events.language_independent` (`boolean`, `NOT NULL`, default `false`) via Drizzle migration; wire through `@unveiled/db` create/update/types/seed fixtures as needed.
- Admin create/edit/series: native checkbox labeled **Language-independent** / **Sprachunabhängig**; when checked, hide the languages multi-select and persist `language_independent = true` with `languages = null`.
- When unchecked, keep today’s searchable languages multi-select behavior.
- Public/member event detail: show the language-independent label (or omit languages) — never invent a fake language list or show a misleading empty list.
- Discovery/search: any language filter/query predicate treats `language_independent = true` as matching **every** language value; ship a helper/predicate + test even if no language filter UI exists yet (do not add a new filter dropdown in this step).
- Update product Gherkin, schema overview, admin i18n copy, and gaps/decisions.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `admin-events`: ADMIN can mark create/edit/series events as language-independent; languages multi-select is hidden and not required when checked; persisted state forces `languages = null`.
- `event-discovery`: Language-independent events match any language filter value; detail metadata indicates language-independent clearly (or omits languages) rather than implying a spoken-language list.

## Impact

- **Schema / DB:** `packages/db` — `events` table column + migration; `createEvent` / `updateEvent` (and series path) accept the flag and coerce `languages` when true.
- **Admin UI:** `EventAdminBaseFields` (+ series), form parse/defaults (`EventFormValues`, `eventToFormDefaults`), admin copy keys in `admin-content.ts`.
- **Public UI:** `EventDetailPage` (and any shared languages metadata display) for the new label/omit behavior.
- **Discovery:** query helper / filter predicate in `@unveiled/db` (or shared catalog helper) with unit/integration coverage — no new member language filter UI.
- **Docs:** `docs/product/features/admin-events.feature`, `event-discovery.feature` (forward-compatible note), `database/schema-overview.md`, `extras/content-i18n-inventory.md`, `extras/gaps-and-decisions.md`.
- **Unchanged this step:** address/map (02); image retention on error (03); member language filter dropdown; onboarding preferred-languages redesign; partner portal.
- **Source brief:** `.dev-plan/current-iteration/event-form-polish-01-language-independent.md`
- **Parent:** `.dev-plan/current-iteration/event-form-polish-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `event-form-polish-02-address-only-location`
- **Verification:** `bun run lint`; `bun run typecheck`; focused test for “flag ⇒ languages null” and “matches any language filter”; manual admin smoke on `/admin/events/new`
