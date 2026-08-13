## Context

Parent feature: per-occurrence credits (`.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`), step 03 — range builder after admin list UI (step 02 done).

Current state:

- Create/edit/clone post an editable datetime list (`event_date_N` / `event_time_N` / `event_credit_N`) into paired `dateTimes` + `occurrenceCreditPrices`. `ALLOW_MULTI_DATETIME_UI` is true. Event-level Credits field is gone.
- `EventAdminDateTimeList` (`EventAdminDateFields.tsx`) owns row chrome in one client island: add/remove, per-row credits, live total. Date/time inputs are uncontrolled (`defaultValue`); credits are controlled. New rows default time `19:30`, credits `1`.
- Create-only `handlePartnerChange` in `EventAdminBaseFields` prefills structured address + geocode. `PartnerOption` is `{ id, name, street, houseNumber, addressLine2, zipCode }` — no hours. Clone has no partner select.
- Legacy series helper `expandSeriesSlotsFromBuilder` + private `enumerateDatesInclusive` + `MAX_SERIES_SLOTS` (52) still live in `admin-event-form.ts` (weekday checkboxes, excluded dates, times only). Series routes stay dead. `MAX_EVENT_DATE_TIME_ROWS` is also 52.
- Partner hours already exist on `partners` (`has_opening_hours` + `opening_hours` JSONB). `@unveiled/db` exports `OpeningHoursWeek`, `parseOpeningHours`, `OPENING_HOURS_DAY_KEYS`. Public event detail displays hours; the event form does not consume them.
- Playwright multi-datetime scenarios stay skipped until step 05.

Constraints: SSR form POST only (island owns chrome, server owns validation); HeroUI layout + native `input type="date|time|number"` (`AGENTS.md` §8–9, §14); Tailwind for layout only; copy in `admin-content.ts` (DE and EN); Europe/Berlin via existing `parseBerlinDateTime`. Parent locks 5–6: cartesian replace-only rebuild; partner hours are defaults (create prefill + closed-day skip), not a second schedule. Cap 52.

## Goals / Non-Goals

**Goals:**

- Range builder on create, edit, and clone: inclusive start/end + repeatable time-slot rows (time + credits).
- Changing start, end, or any time-slot row replaces the datetime list from scratch (manual add/remove discarded; hint copy required).
- Create: partner with published hours prefills distinct sorted `open` times; expansion skips closed Berlin weekdays. No hours → one slot `19:30` / 1 credit, every calendar day in range.
- Edit/clone: partner change does not overwrite datetimes or builder fields (clone has no partner select).
- Reject empty and over-52 generated lists before catalog write; visible cap error.
- `ALL_DAY`: one row per date, midnight Berlin, first slot’s credits.
- Unit tests for expand, closed-day skip, distinct open times, cap, and replace-not-merge.

**Non-Goals:**

- Weekday checkbox matrices, excluded-date pickers, RRULE.
- Checkout dropdown / `bookings.date_time` (step 04).
- Canonical Gherkin / Playwright unskip (step 05).
- Reviving `/admin/events/series/new` or wiring `expandSeriesSlotsFromBuilder` into a route.
- Per-slot capacity or per-weekday slot matrices (admins delete extra cartesian rows).
- Moving `parseBerlinDateTime` into `@unveiled/db`.

## Decisions

1. **Closed-day helpers in `@unveiled/db`; expand stays next to `parseBerlinDateTime`**
   - **Choice:** Add `distinctOpenTimes(week: OpeningHoursWeek): string[]` (unique `open` values from non-closed days, lexicographically sorted — `HH:MM` sorts correctly) and `isClosedOnBerlinYmd(week, ymd): boolean` in `packages/db/src/catalog/opening-hours.ts`. Map the Europe/Berlin weekday of `ymd` onto `OPENING_HOURS_DAY_KEYS` using noon-UTC + `Intl` (same trick as `getBerlinWeekdayIndex` in `admin-event-form.ts`: `` `${ymd}T12:00:00.000Z` ``). Add `expandOccurrencesFromRange` in `admin-event-form.ts` returning `{ startsAt: Date; creditPrice: number }[]`. Reuse private `enumerateDatesInclusive` and `parseBerlinDateTime`. Do not call or extend `expandSeriesSlotsFromBuilder`.
   - **Rationale:** Step plan prefers closed-day skip next to `opening-hours.ts` for reuse; expansion needs admin `parseBerlinDateTime` (TIME_SLOT wall times). Keep the dead series helper untouched.
   - **Alternatives:** Put expand in `@unveiled/db` (requires duplicating or moving Berlin wall-time parse); revive series builder (forbidden).

2. **Cartesian product, then ALL_DAY collapse**
   - **Choice:** `TIME_SLOT`: for each inclusive Berlin YMD (optionally skipping closed days) × each slot `{ time, creditPrice }`, emit `parseBerlinDateTime(ymd, time, "TIME_SLOT")` with that slot’s credits. `ALL_DAY`: emit **one row per remaining date**, midnight Berlin (`parseBerlinDateTime` already ignores time), credits = **first slot’s** `creditPrice`. If there are zero slots, expansion is empty. Do not emit date×slot then unique-merge (duplicate midnights would hit `DUPLICATE_OCCURRENCE_INSTANTS`).
   - **Rationale:** Parent non-goal: overnight / multi-day; `ALL_DAY` is date-only. Step plan: prefer one row per date using the first slot’s credits.
   - **Alternatives:** Keep one ALL_DAY row per slot (duplicate instants, catalog reject); average credits (not specified).

3. **Cap and empty: typed catalog errors; live UI refuses illegal lists**
   - **Choice:** If the would-be list length `> MAX_EVENT_DATE_TIME_ROWS` (52; keep `MAX_SERIES_SLOTS` as the same number, do not fork caps), throw `CatalogValidationError("TOO_MANY_OCCURRENCES")` from expand **and** from `eventFormValuesToOccurrences` when parsed rows exceed 52. Add the code to `CatalogErrorCode` + `mapCatalogErrorCode`. Live rebuild: if expand would exceed 52, **do not** write those rows into the list; set island cap error (copy includes 52); leave the previous list in place. If expand is empty (no slots, all days closed, invalid dates), **do not** wipe a previous non-empty list on a partial builder edit; set a range error. **Submit** still rejects when the posted list has zero complete rows (`EMPTY_DATE_TIMES`) or `> 52`. Catalog write uses the posted list only — do not re-expand builder fields on the server.
   - **Rationale:** Avoid posting a stale-valid list that no longer matches an over-cap builder *and* avoid posting 53 rows. Server list-length check is defense in depth. Builder fields may post for error re-render only.
   - **Alternatives:** Empty the list on over-cap (submit fails empty, user loses prior rows); put 53 rows in the form and rely on submit (worse UX, still need server check).

4. **Start > end: validate, do not swap**
   - **Choice:** If both dates are set and `startDate > endDate`, treat expansion as empty, show `rangeStartAfterEnd` copy, do not swap. Rebuild does not apply. Submit of an empty list is rejected.
   - **Rationale:** Silent swap is surprising while typing. Step plan allows swap *or* a validation message.
   - **Alternatives:** Auto-swap (parent lock does not require it).

5. **Rebuild trigger: builder fields + timing mode, not list edits**
   - **Choice:** Replacing `rows` happens when start, end, any time-slot row (time, credits, add, remove), or **timing mode** changes, and both dates plus at least one slot time are present. Manual add/remove/edit on the datetime list never writes back into the builder. Timing mode must be lifted in `EventAdminBaseFields` (`useState` + `onSelectionChange`) and passed into the list island so ALL_DAY collapse runs without a stale TIME_SLOT grid (which would duplicate midnights on submit).
   - **Rationale:** Spec names start/end/slots; timing mode is required for a correct ALL_DAY grid. List remains the submit source of truth after a rebuild.
   - **Alternatives:** Ignore timing-mode changes until the next builder edit (duplicate-instant submit failures).

6. **Builder lives in the same island as the list**
   - **Choice:** Extend `EventAdminDateTimeList` (not a second island, not a modal). Layout: builder block **above** the list (start | end, then time-slot rows, then hint, then existing list + total). Time-slot rows: native time + native number credits, add/remove, cannot remove the last slot row. Default one slot `19:30` / `1`. New slot rows also default `19:30` / `1` (do not copy last-slot credit). Rebuild assigns `setRows(occurrencesToFormRows(result))` with **new row ids** so uncontrolled date/time inputs remount. Hidden `datetime_count` + indexed list fields unchanged. Optional posted builder fields: `range_start`, `range_end`, `range_slot_count`, `range_slot_time_N`, `range_slot_credit_N` (do not reuse legacy `builder_time_N`).
   - **Rationale:** Step plan: same island; native controls; list is what SSR persists.
   - **Alternatives:** Controlled date/time on the list (more state); separate island (sync bugs).

7. **Partner hours on create only for slot defaults; hours always available for skip**
   - **Choice:** Extend both `PartnerOption` types (`event-admin-types.ts` and `toPartnerOptions` `Pick`) with `hasOpeningHours` and `openingHours: OpeningHoursWeek | null`. `OpeningHoursWeek` is JSON-serializable (island-safe). Lift `selectedPartnerId` in `EventAdminBaseFields`. Pass `applyPartnerHours={!isEdit}`, `hasOpeningHours`, and `openingHours` into the list.
     - **Create** (`applyPartnerHours`): on partner change, set time-slot rows to `distinctOpenTimes(week)` each at credits `"1"`, or `[{ time: "19:30", credits: "1" }]` when hours are off/null/empty distinct set; if start and end are set, rebuild immediately (including closed-day skip). Address prefill stays as today.
     - **Edit:** `handlePartnerChange` still returns before address overwrite; do **not** reset builder slots or list rows. Updating the hours *prop* is OK so the **next** builder-triggered rebuild skips the newly selected partner’s closed days.
     - **Clone:** no partner select; pass `applyPartnerHours={false}` and `openingHours={null}` (no skip unless we later pass source partner hours — skip that; clone builder behaves like a blank generator over the copied list until the admin touches it).
   - **Rationale:** Parent lock 6: hours are defaults on create, not a second schedule; edit partner change matches location (do not overwrite).
   - **Alternatives:** Skip closed days only on create (edit builder would include Sundays for a Sunday-closed venue); reverse-engineer builder start/end from existing rows on edit (fragile, not specified).

8. **Do not reverse-engineer builder state on edit/clone**
   - **Choice:** Prefill the datetime list from stored occurrences as today. Leave builder start/end empty and one default time-slot row until the admin fills the range. First builder change then replaces the list from scratch (hint already warns). Failed submit restores posted builder fields via `formValuesToDefaults` when present.
   - **Rationale:** Stored data is a list, not a range recipe. Inferring a range from irregular manual rows would be wrong.
   - **Alternatives:** Min/max date of existing rows as start/end (looks clever, breaks as soon as a day was deleted).

9. **Closed-day skip uses hours at expand time**
   - **Choice:** `expandOccurrencesFromRange({ …, openingHours })` skips a YMD when `openingHours` is a full week and `isClosedOnBerlinYmd` is true. Pass hours only when `hasOpeningHours && openingHours`. Null/disabled → every calendar day. Distinct open times applied to **every non-closed day** (weekday 10:00 + Saturday 12:00 both appear on weekdays). Admins delete extras; no per-weekday matrix.
   - **Rationale:** Parent risk “mixed partner open times” is accepted.
   - **Alternatives:** Per-weekday slot matrices (explicit non-goal).

10. **Copy and accessible names**
    - **Choice:** Add DE/EN keys in `admin-content.ts`. Defaults:
      - EN `Generate from date range` / DE `Aus Zeitraum erzeugen`
      - `Start date` / `Startdatum`; `End date` / `Enddatum`
      - `Time slots` / `Zeitfenster`; `Add time slot` / `Zeitfenster hinzufügen`; reuse Remove / Entfernen
      - Hint EN: `Changing the range or time slots rebuilds the datetime list and discards manual add/remove.` DE: `Änderungen am Zeitraum oder an den Zeitfenstern erzeugen die Terminliste neu und verwerfen manuelles Hinzufügen/Entfernen.`
      - Optional closed-day hint EN: `Closed weekdays from the partner’s opening hours are skipped.` DE: `Geschlossene Wochentage laut Partner-Öffnungszeiten werden übersprungen.` Show this hint when `hasOpeningHours` is true.
      - Cap EN: `A range can create at most 52 datetimes. Narrow the dates or remove a time slot.` DE: `Ein Zeitraum darf höchstens 52 Termine erzeugen. Zeitraum verkürzen oder ein Zeitfenster entfernen.`
      - Start-after-end EN: `End date must be on or after start date.` DE: `Das Enddatum muss am oder nach dem Startdatum liegen.`
    - Labels must work with `getByLabel` for step 05. Time-slot time/credits labels may reuse `eventTimeLabel` / `creditPriceLabel` (names differ: `range_slot_time_N`).
    - **Rationale:** Step plan requires DE/EN for builder, hint, optional closed-day skip, cap error.

11. **Existing series helpers stay inert**
    - **Choice:** Leave `expandSeriesSlotsFromBuilder`, `parseBuilderTimes`, `BUILDER_TIME_ROWS`, `toSeriesCreateInput` compiling. Do not parse legacy `builder_time_N` as range slots. Do not change the OpenSpec “no `/admin/events/series/new`” rule except to clarify that an **inline** range builder on create/edit/clone is allowed (delta below). Canonical product Gherkin still waits for step 05.
    - **Rationale:** Parent lock 9.

## Risks / Trade-offs

- **[Risk] Cartesian size** (30 days × 2 slots = 60) → Mitigation: refuse to apply over-cap expansions; `TOO_MANY_OCCURRENCES` on submit if the list is still `> 52`; copy names the cap.
- **[Risk] Rebuild wipes manual add/remove** → Mitigation: required hint copy; do not rebuild on list-row edits.
- **[Risk] Over-cap leaves list out of sync with builder** → Mitigation: visible cap error until start/end/slots shrink; next valid builder change replaces the list. Do not submit builder-derived rows that were never applied.
- **[Risk] Mixed open times** (10:00 weekdays + 12:00 Saturday → 12:00 on weekdays too) → Mitigation: accepted; admins delete extra list rows; no weekday matrix.
- **[Risk] ALL_DAY + two slots without rebuild** → Mitigation: rebuild on timing-mode change when the builder is complete.
- **[Risk] Partner with hours but all days closed / empty distinct opens** → Mitigation: fall back slot `19:30`/`1` for chrome; skip still applies → empty expansion; submit rejected with empty-list error.
- **[Risk] Duplicate PartnerOption types drift** → Mitigation: extend both `event-admin-types` and `toPartnerOptions` in the same PR.
- **[Trade-off] No swap when start > end** → Clearer than silent reorder.
- **[Trade-off] Edit rebuild uses the newly selected partner’s closed days** without resetting slots → Matches “do not overwrite” while still skipping closed days on the next generate.
- **[Trade-off] Playwright stays skipped** → Required; step 05 unskips. Accessible labels are added now.

## Migration Plan

1. Add `distinctOpenTimes` / `isClosedOnBerlinYmd` + unit tests in `@unveiled/db`.
2. Add `expandOccurrencesFromRange` + `TOO_MANY_OCCURRENCES`; unit-test cartesian, Sunday skip, no-hours Sunday include, cap, ALL_DAY collapse, start>end empty.
3. Extend `PartnerOption` / `toPartnerOptions`; builder UI in `EventAdminDateTimeList`; create partner-change slot defaults; lift timing mode; DE/EN copy; parse optional builder fields for re-render only.
4. Run `bun run lint`, `bun run typecheck`, and the listed unit tests (no cloud).
5. Mark step 03 done in the parent guide. Do not unskip Playwright. Do not rewrite canonical Gherkin.
6. Rollback: revert the admin/db helper PR. No schema change. Existing events and list POST remain valid.

## Open Questions

- None blocking. Canonical `admin-events.feature` narrative updates wait for step 05. Copy strings above are the implementer default unless a later pass prefers different DE wording.
