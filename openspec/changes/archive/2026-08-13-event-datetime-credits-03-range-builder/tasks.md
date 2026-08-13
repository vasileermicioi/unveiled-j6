## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`EventAdminDateTimeList` / `EventAdminDateFields.tsx`, `expandSeriesSlotsFromBuilder` / `enumerateDatesInclusive` / `MAX_SERIES_SLOTS` in `admin-event-form.ts`, `PartnerOption` + `toPartnerOptions`, `@unveiled/db` `OpeningHoursWeek` / `parseOpeningHours` / `OPENING_HOURS_DAY_KEYS`, create-only partner address prefill in `EventAdminBaseFields`)
- [x] 1.2 Confirm step 02 is merged: multi-row datetime+credits list posts `occurrenceCreditPrices`; `ALLOW_MULTI_DATETIME_UI` is true

## 2. Opening-hours helpers and expansion

- [x] 2.1 Add `distinctOpenTimes(week)` (sorted unique `open` values from non-closed days) and `isClosedOnBerlinYmd(week, ymd)` in `packages/db/src/catalog/opening-hours.ts` (Berlin weekday via noon-UTC + `Intl`, mapped to `OPENING_HOURS_DAY_KEYS`)
- [x] 2.2 Unit-test distinct opens `10:00` and `12:00`, Sunday closed for a known YMD, and an open weekday not skipped (`packages/db/src/catalog/opening-hours.unit.test.ts`)
- [x] 2.3 Add `expandOccurrencesFromRange({ startDate, endDate, slots: { time, creditPrice }[], timingMode, openingHours?: OpeningHoursWeek | null })` in `admin-event-form.ts`: inclusive Berlin dates via existing `enumerateDatesInclusive`, skip closed days when hours provided, `TIME_SLOT` cartesian with per-slot credits, `ALL_DAY` one row per date at midnight using first slot’s credits. Reuse `parseBerlinDateTime`. Do not call `expandSeriesSlotsFromBuilder`
- [x] 2.4 If `startDate > endDate` or dates/slots incomplete, return `[]` (do not swap). If length `> MAX_EVENT_DATE_TIME_ROWS` (52), throw `CatalogValidationError("TOO_MANY_OCCURRENCES")`. Add the code to `CatalogErrorCode` and `mapCatalogErrorCode` (DE/EN cap copy)
- [x] 2.5 `eventFormValuesToOccurrences` also rejects lists longer than 52 with `TOO_MANY_OCCURRENCES`. Catalog write still uses the posted list only (do not re-expand builder fields on the server)

## 3. Admin UI (create / edit / clone)

- [x] 3.1 Extend `PartnerOption` in `event-admin-types.ts` and `toPartnerOptions` with `hasOpeningHours` + `openingHours`. Lift `selectedPartnerId` and `timingMode` in `EventAdminBaseFields`; pass `applyPartnerHours={!isEdit}`, hours, and `timingMode` into `EventAdminDateTimeList`
- [x] 3.2 Add builder chrome in the same island above the list: native start/end dates, repeatable time-slot rows (time + credits, add/remove, min one row, default `19:30` / `1`). Changing start, end, any slot row, or timing mode replaces `rows` from a fresh expand (new row ids). Hint copy: rebuild discards manual add/remove. Optional closed-day hint when hours are on
- [x] 3.3 Over-cap or start>end: show the matching error; do **not** apply an illegal/empty expansion over a previous non-empty list. Submit still rejects empty (`EMPTY_DATE_TIMES`) and `> 52`
- [x] 3.4 Create `handlePartnerChange`: keep address prefill; set builder slots from `distinctOpenTimes` (credits `"1"`) or `19:30`/`1`; rebuild if start/end exist. Edit: do not touch builder or list (address overwrite already skipped). Clone: builder on, `applyPartnerHours={false}`, `openingHours={null}`
- [x] 3.5 Optional POST fields `range_start` / `range_end` / `range_slot_count` / `range_slot_time_N` / `range_slot_credit_N` for error re-render only. `formValuesToDefaults` round-trips them. Do not parse legacy `builder_time_N` as range slots
- [x] 3.6 DE/EN copy in `admin-content.ts` for builder labels, rebuild hint, closed-day hint, cap error, start-after-end. Accessible names must work with `getByLabel` for e2e in step 05

## 4. Tests and verification

- [x] 4.1 Unit-test expand: 2026-09-01..03 × 10:00@1 and 18:00@3 = six occurrences with those credits; Sunday 2026-09-06 skipped when `sun: { closed: true }`; partner with no hours includes Sunday; 53rd occurrence throws `TOO_MANY_OCCURRENCES`; ALL_DAY two dates × two slots = two midnight rows priced from the first slot; start>end returns `[]`
- [x] 4.2 Cover rebuild-replace as a pure assignment (expand result is the new list, not merged with prior rows). Update `toPartnerOptions` tests/fixtures if they construct `PartnerOption`
- [x] 4.3 Run `bun run lint`, `bun run typecheck`, `bun test apps/web/app/lib/admin-event-form.test.ts`, and `bun --filter @unveiled/db test src/catalog/opening-hours.unit.test.ts` — all exit 0 without cloud services
- [x] 4.4 Mark this step done in `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`. Do not unskip Playwright (step 05). Do not rewrite canonical Gherkin
