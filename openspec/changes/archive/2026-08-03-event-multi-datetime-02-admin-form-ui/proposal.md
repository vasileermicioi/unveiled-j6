## Why

Step 01 shipped `dateTimes: Date[]` on catalog create/update/clone, but admin create/edit/clone forms still post a single `event_date`/`event_time` and wrap it as a one-element list. Admins cannot add or remove occurrences inplace on the SSR form. This step wires the admin UI and form parsers to the multi-datetime domain API (parent feature step 02 of 03).

## What Changes

- Replace the single date/time pair on admin create/edit (and clone) with an **editable list of datetime rows** (add row / remove row inplace; submit remains form POST).
- Parse repeated form fields into `dateTimes: Date[]`; reject submit when zero datetimes remain; re-render validation errors while preserving submitted rows.
- Clone flow: prefill from the source event’s `dateTimes` list and allow editing before confirm (at least one datetime required).
- Add DE/EN copy for add/remove controls and empty-list error in `admin-content.ts`.
- Unit tests for multi-value parse and empty-list rejection.
- Out of scope: public/member multi-value display polish, feed card multi-line times, full e2e suite (smoke OK), booking/ICS (step 03). Admin list/featured may keep showing primary/next only if helpers already exist.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Create/edit forms present an editable datetime list (add/remove inplace); reject zero datetimes; clone copies source datetimes by default and allows list edit before confirm. Remove the temporary “wrap single posted datetime” allowance once the multi-datetime form ships.

## Impact

- **UI:** `EventAdminDateFields` / `EventAdminBaseFields` / `EventAdminForm` island — repeatable native date+time rows matching current pattern; HeroUI layout + native inputs (`AGENTS.md` §14).
- **Parsers / mappers:** `admin-event-form.ts` (`EventFormValues`, `parseEventFormBody`, `eventFormValuesToDateTime` → multi), `admin-event-input.ts` (`toCreateEventInput` / `toUpdateEventInput`), clone route helpers / defaults from `event.dateTimes`.
- **Copy:** `admin-content.ts` — add/remove labels, empty-list error.
- **Tests:** `admin-event-form.test.ts` (and related) for multi-value parse / empty rejection.
- **Domain (unchanged):** `@unveiled/db` already accepts `dateTimes: Date[]`.
- **Source brief:** `.dev-plan/current-iteration/03-event-multi-datetime-02-admin-form-ui.md`
- **Parent:** `.dev-plan/current-iteration/03-event-multi-datetime-parent-guide.md`
- **Depends on:** `event-multi-datetime-01-schema-and-domain` (done)
- **Consumed by:** `event-multi-datetime-03-surfaces-and-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `admin-event-form` unit tests for multi-value parse / empty rejection
