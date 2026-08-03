## 1. Setup / confirm inputs

- [x] 1.1 Confirm step 01 `dateTimes: Date[]` on create/update/clone and that admin routes still wrap a single pair today
- [x] 1.2 Skim parent guide non-goals (no per-slot booking; list display polish is step 03)

## 2. Form model and parsing

- [x] 2.1 Replace scalar `eventDate`/`eventTime` on `EventFormValues` / `EventFormDefaults` with `dateTimeRows: { date: string; time: string }[]`
- [x] 2.2 Parse indexed `event_date_N` / `event_time_N` (plus count or index scan) in `parseEventFormBody`; ignore blank trailing rows
- [x] 2.3 Add `eventFormValuesToDateTimes` (≥1 complete row required for callers); update `toCreateEventInput` / `toUpdateEventInput` to pass full `dateTimes` (drop one-element wrap)
- [x] 2.4 Update `eventToFormDefaults` / `formValuesToDefaults` / clone source mapping to use `event.dateTimes` → rows so error re-renders keep all submitted rows

## 3. Admin UI (create / edit / clone)

- [x] 3.1 Replace `EventAdminDateTimeFields` single pair with a repeatable list (native date+time per row; HeroUI layout)
- [x] 3.2 Wire inplace Add / Remove in the EventAdminForm island (or shared list chrome); keep ≥1 row in UI; submit remains form POST
- [x] 3.3 Use the same list editor on create, edit, and `CloneEventForm`; clone GET prefills source `dateTimes`
- [x] 3.4 Add DE/EN copy for add/remove labels and empty-list error in `admin-content.ts`; surface empty-list validation before catalog write

## 4. Tests and verification

- [x] 4.1 Unit-test multi-value parse, blank-row filtering, and empty-list rejection in `admin-event-form.test.ts` (update fixtures that posted `event_date`/`event_time`)
- [x] 4.2 Fix related helper/story/type fallout from the form shape change
- [x] 4.3 Run `bun run lint`, `bun run typecheck`, and admin-event-form unit tests — all exit 0
- [x] 4.4 Mark this step done in `.dev-plan/current-iteration/03-event-multi-datetime-parent-guide.md` (leave product Gherkin / public surfaces for step 03)
