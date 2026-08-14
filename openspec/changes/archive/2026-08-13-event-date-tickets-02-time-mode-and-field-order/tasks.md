## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-date-tickets-02-time-mode-and-field-order.md`, parent guide (field order items 1 and 4, non-goals), and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 01 is merged (`CapacityMode` exists). Do **not** post `capacity_mode` / `occurrence_capacities`. Confirm create/edit share `EventAdminForm` + mounted step 2; clone uses `CloneEventForm`

## 2. Helper and tests

- [x] 2.1 Export `showsEventTimeInputs(timingMode)` from `apps/web/app/lib/admin-event-form.ts` (`timingMode !== "ALL_DAY"`)
- [x] 2.2 Unit-test the helper; keep the existing ALL_DAY midnight + first-slot credits expansion test; add a parse case: ALL_DAY with `event_date_0` + credits and no `event_time_0` still yields midnight via `eventFormValuesToOccurrences`

## 3. Date & tickets field order

- [x] 3.1 In `EventAdminBaseFields` step 2 `Surface`, move Timing mode `AdminFormSelect` to the top; keep SECRET_CODE `total_capacity` + ticket type + secret code / voucher inventory + `capacityFromInventoryHint` as today; place `EventAdminDateTimeList` last
- [x] 3.2 Keep `timingMode` state in `EventAdminBaseFields` and pass it into the list; existing range-rebuild `useEffect` on mode change stays. Do not unmount inactive wizard steps. Field `name`s unchanged

## 4. All day hides clocks

- [x] 4.1 In `EventAdminDateTimeList`, when `!showsEventTimeInputs(timingMode)`: do not render `type="time"` on range slots or rows; render only the first range slot (credits only); omit “Add time slot” and extra slot rows; keep start/end dates, first-slot credits, per-row date + credits. TIME_SLOT keeps current times + extra slots
- [x] 4.2 Extra `timeSlots` stay in React state when switching to All day (restore on Time slot). Never `required` on time fields. ALL_DAY POSTs `range_slot_count=1`, `range_slot_credit_0`, and hidden (non-clock) `range_slot_time_0` so rebuild still has a non-empty first slot. Rows omit `event_time_N`
- [x] 4.3 Add `rangeAllDayHint` (DE/EN per design.md). While All day, hide `rangeTimeSlotsLabel` and replace the time-slot `rangeRebuildHint` with `rangeAllDayHint`; keep `rangeClosedDaysHint` when the partner has opening hours. Existing Timing mode labels unchanged

## 5. Clone

- [x] 5.1 In `CloneEventForm`, replace hidden `timing_mode` with visible `AdminFormSelect` (`useState` from `source.timingMode`, `name="timing_mode"`). Render it above `EventAdminDateTimeList`. Pass `timingMode` into the list. Keep hidden `ticket_type`. No clone stepper

## 6. Stories and verification

- [x] 6.1 Add or adjust Ladle `EventAdminForm` stories with `initialStep={2}` (Time slot default and `defaults.timingMode: "ALL_DAY"`). Leave `EventAdminBaseFields / Collapsed preview` as-is
- [x] 6.2 Run `bun run lint` — exits 0
- [x] 6.3 Run `bun run typecheck` — exits 0
- [x] 6.4 Run `cd apps/web && bun test app/lib/admin-event-form.test.ts` — exits 0 (ALL_DAY midnight + first-slot credits)
- [x] 6.5 Manual: Time slot shows times; All day hides times on builder and rows (create, edit, clone); list is last on step 2
- [x] 6.6 Mark step 02 done in `.dev-plan/current-iteration/event-date-tickets-parent-guide.md`. Do not add Gherkin/Playwright/canonical docs (step 04). No new convention beyond “All day hides clock inputs”
