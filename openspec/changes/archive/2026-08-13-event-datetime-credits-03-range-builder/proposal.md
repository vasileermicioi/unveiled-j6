## Why

Step 02 restored manual add/remove datetime rows with per-row credits, but admins still cannot generate a week of morning/evening slots in one action, and partner opening hours are unused on the event form. This step adds a cartesian range builder (inclusive start/end × time slots with credits) and, on create, prefills those slots from the selected partner’s published hours (parent feature `event-datetime-credits`, step 03 of 05).

## What Changes

- Add a range-builder block on create, edit, and clone: native start date, end date, and repeatable time-slot rows (clock time + credits, add/remove).
- Any change to start, end, or time-slot rows **rebuilds** the datetime list from scratch (cartesian product of Europe/Berlin dates × slots). Manual list add/remove is discarded; hint copy must say so.
- On **create**, selecting a partner with `has_opening_hours` true and a valid week defaults time-slot rows to distinct `open` times (sorted). If start/end are already set, rebuild immediately. Range expansion skips dates whose Berlin weekday is marked closed.
- When the partner has no published hours, default one slot `19:30` / 1 credit and include every calendar day in range.
- On **edit** (and clone), partner change MUST NOT overwrite datetimes or builder fields.
- Enforce the 52-occurrence cap with a visible error; reject submit when the generated list is empty or over cap.
- `ALL_DAY`: dates still expand; ignore time-of-day (midnight Berlin); one row per date using the first slot’s credits.
- SSR still posts the **generated list** (`event_date_*` / `event_time_*` / `event_credit_*`); catalog write uses that list. Builder fields may also post for error re-render.
- Unit tests for cartesian expand, closed-day skip, distinct open times, cap, and rebuild replacing prior rows.
- Out of scope: weekday checkbox matrices, excluded-date pickers, checkout dropdown, booking, e2e, series create route (`/admin/events/series/new`). Canonical Gherkin waits for step 05.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Create/edit/clone forms offer a date-range occurrence builder (inclusive start/end × time slots with credits) that replaces the datetime list from scratch. On create, partner opening hours default the builder’s time slots and skip closed weekdays. Empty and over-52 expansions are rejected before catalog write.

## Impact

- **Domain helpers:** `@unveiled/db` `opening-hours.ts` — `distinctOpenTimes(week)` and `isClosedOnBerlinYmd(week, ymd)`; unit tests in `opening-hours.unit.test.ts`.
- **Expansion:** `expandOccurrencesFromRange` in `apps/web/app/lib/admin-event-form.ts` (reuse `enumerateDatesInclusive` / `parseBerlinDateTime` / `MAX_SERIES_SLOTS`; do not revive series routes). Typed cap/empty errors mapped in `admin-content.ts`.
- **UI:** Same island as the list (`EventAdminDateFields.tsx` / `EventAdminDateTimeList`); builder above or beside the list. `EventAdminBaseFields` create-only partner change prefills slots; clone form gets the builder without partner overwrite. Native `input type="date|time|number"` (`AGENTS.md` §8–9, §14).
- **Partner payload:** `PartnerOption` + `toPartnerOptions` include `hasOpeningHours` + `openingHours`.
- **Copy:** `admin-content.ts` DE/EN — builder labels, rebuild hint, optional closed-day skip hint, cap error.
- **Tests:** `admin-event-form.test.ts` plus opening-hours unit tests; no cloud services.
- **Source brief:** `.dev-plan/current-iteration/event-datetime-credits-03-range-builder.md`
- **Parent:** `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`
- **Depends on:** `event-datetime-credits-02-admin-list-ui` (done)
- **Consumed by:** `event-datetime-credits-04-checkout-slot`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test apps/web/app/lib/admin-event-form.test.ts` plus new opening-hours / expand unit tests
