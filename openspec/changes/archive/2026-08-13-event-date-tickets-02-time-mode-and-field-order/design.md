## Context

Parent feature: Date & tickets form (`.dev-plan/current-iteration/event-date-tickets-parent-guide.md`), step 02 of 04 — Timing mode first and All day hides clocks. Schema/domain from `event-date-tickets-01-schema-and-domain` is merged (`capacity_mode` / `occurrence_capacities` exist). This step MUST NOT post those fields; capacity allocation UI is step 03.

Current state:

- Create/edit share `EventAdminForm` + one multipart POST. Step 2 lives in `EventAdminBaseFields` (`data-event-form-step="2"`, inactive steps `hidden`/`inert`, never unmounted).
- Step 2 order today: `EventAdminDateTimeList` (range builder + rows) → Timing mode `AdminFormSelect` → SECRET_CODE `total_capacity` → ticket type → secret code / voucher inventory.
- `timingMode` React state lives in `EventAdminBaseFields` (`defaultTimingMode(defaults)`, default `TIME_SLOT`) and is already passed into `EventAdminDateTimeList`. Changing mode runs the existing `useEffect` that calls `applyRebuild`.
- `EventAdminDateTimeList` always renders `type="time"` on every range slot and every datetime row, plus “Add time slot” for extra slots. `expandOccurrencesFromRange` already emits one Europe/Berlin midnight row per date from the **first** slot’s credits when `ALL_DAY`.
- `parseBerlinDateTime` ignores clock time for `ALL_DAY`. `eventFormValuesToOccurrences` uses `row.time.trim() || null` then that parser. `parseEventDateTimeRows` treats missing `event_time_N` as `""`.
- Clone (`CloneEventForm`) posts `timing_mode` as a **hidden** input from `source.timingMode` and always shows times on the list. Ticket type stays a hidden copy. Clone is not the three-step wizard.

Constraints: SSR-only mutation; HeroUI-only markup (`AGENTS.md` §8–9); Tailwind layout only; native `AdminFormSelect` / `input type="date|time|number"` (`§14`); wizard inactive steps stay mounted; Europe/Berlin unchanged; do not post `capacity_mode`.

## Goals / Non-Goals

**Goals:**

- Date & tickets order: Timing mode; then existing ticket/capacity/redemption block; then range builder + datetime list.
- All day hides every clock input (range-builder slot times and per-row times) and extra time-slot rows beyond the first; dates, per-row credits, and first-slot credits remain.
- Time slot keeps times + credits on slots and rows.
- Clone exposes Timing mode as a visible `AdminFormSelect` so the same hide-times behavior applies.
- ALL_DAY POST still yields dates + credits that `parseEventFormBody` / `eventFormValuesToOccurrences` accept (midnight instants).
- Existing ALL_DAY expansion unit test still passes.

**Non-Goals:**

- Capacity allocation select, per-row capacity, live totals, mismatch danger, voucher capacity field (step 03).
- Posting `capacity_mode` / `occurrence_capacities`.
- Changing `expandOccurrencesFromRange` rebuild-from-scratch or opening-hours skip-closed-days.
- Gherkin / Playwright / canonical `docs/product/` (step 04).
- Turning clone into the three-step wizard.
- New theme tokens or raw HTML.

## Decisions

1. **Reorder JSX only — do not split the step-2 `Surface`**
   - **Choice:** In `EventAdminBaseFields` step 2, move the existing Timing mode `AdminFormSelect` to the top of that `Surface`. Keep the SECRET_CODE `total_capacity` field, ticket type select, inventory hint, secret code, and voucher islands as they are (no allocation select). Place `EventAdminDateTimeList` last (`includeDateTime` still gates the list only). Field `name`s unchanged (`timing_mode`, `total_capacity`, `ticket_type`, `event_date_N`, …).
   - **Rationale:** Parent field-order items 1 and 4 for this step; item 2 (allocation) waits for 03. One Surface keeps wizard `hidden`/`inert` behavior.
   - **Alternatives:** Nested Surfaces per block (no benefit); hide the list with CSS order (fragile, worse a11y).

2. **Do not render clock controls — do not CSS-hide them**
   - **Choice:** Export `showsEventTimeInputs(timingMode: TimingMode): boolean` from `apps/web/app/lib/admin-event-form.ts` as `timingMode !== "ALL_DAY"`. `EventAdminDateTimeList` uses it:
     - `ALL_DAY`: omit every `type="time"` (range slots and `EventAdminTimeInput` on rows). Render only the **first** range slot, credits only (no “Add time slot”, no extra slot rows). Keep start/end dates, first-slot credits, per-row date + credits. Row grid `sm:grid-cols-2` (date + credits) instead of `sm:grid-cols-3`.
     - `TIME_SLOT`: current UI (all slots, add-slot, times + credits on rows).
   - Never set `required` on time fields (they are not required today). Never `disabled` a time field as a hide strategy (disabled controls drop from FormData; we need either no field or a non-required hidden sentinel — see decision 3).
   - Keep extra `timeSlots` in React state when switching to All day so switching back restores them; only **render** `timeSlots.slice(0, 1)` while All day.
   - **Rationale:** Step plan: do not render clock inputs; unmounted times must not be `required`. Expansion already uses first-slot credits + midnight.
   - **Alternatives:** `hidden` attribute on time inputs (still in the accessibility tree as time controls); CSS `display:none` (easy to leave `required`); trim extra slots from state on mode change (loses TIME_SLOT data).

3. **ALL_DAY still POSTs a non-empty first range slot time as `type="hidden"`**
   - **Choice:** While All day, keep `slot.time` in state (existing `DEFAULT_RANGE_SLOT_TIME` / midnight from rebuild). Post `range_slot_count` as `1`, `range_slot_credit_0`, and `range_slot_time_0` as a **hidden** text value (not `type="time"`) so `applyRebuild`’s `slot.time.trim().length > 0` filter and `parseRangeBuilder` still see a first slot after an error re-render. Datetime **rows** omit `event_time_N`; empty time is already valid for ALL_DAY (`parseBerlinDateTime` midnight).
   - **Rationale:** Out of scope to change expand/rebuild filters. Hidden non-clock field is not a clock control. Rows are the source of truth for catalog writes.
   - **Alternatives:** Relax `expandOccurrencesFromRange` to allow empty slot times in ALL_DAY (out of scope); leave `range_slot_time_0` absent (error re-render would empty the builder’s first slot and skip rebuild until the user edits dates).

4. **Clone: visible Timing mode, same list, ticket type stays hidden**
   - **Choice:** In `CloneEventForm`, `useState<TimingMode>(source.timingMode)`. Replace the hidden `timing_mode` input with `AdminFormSelect` (`name="timing_mode"`, options from `copy.timingModeTimeSlot` / `timingModeAllDay`, `defaultSelectedKey` + `onSelectionChange`). Render it **above** `EventAdminDateTimeList`. Pass `timingMode` into the list. Keep hidden `ticket_type`. Do not add clone stepper chrome. Inventory block stays after the list (clone has no ticket-type UI).
   - **Rationale:** Step plan: clone is still a dates/inventory form, but All day must hide times there too. Duplicate `name="timing_mode"` (select + hidden) would double-post.
   - **Alternatives:** Keep hidden timing mode (All day would still show clocks on clone); reuse `EventAdminForm` (parent non-goal).

5. **Optional All-day builder hint; existing labels unchanged**
   - **Choice:** Keep `timingModeLabel` / `timingModeTimeSlot` / `timingModeAllDay` copy. When All day, hide `rangeTimeSlotsLabel` (the first slot is credits-only). Add `rangeAllDayHint`:
     | Key | DE | EN |
     |---|---|---|
     | `rangeAllDayHint` | Ganztägige Termine nutzen Mitternacht. Credits vom ersten Slot gelten für jedes Datum. | All-day dates use midnight. Credits from the first slot apply to each date. |
     Render as HeroUI `Description` under the first-slot credits (or instead of `rangeRebuildHint`’s time-slot wording while All day). Keep `rangeRebuildHint` / `rangeClosedDaysHint` for TIME_SLOT as today.
   - **Rationale:** Step plan allows a short All-day builder hint; hiding “Time slots” without explanation is confusing.
   - **Alternatives:** No new copy (allowed); reuse `rangeRebuildHint` verbatim (talks about time slots).

6. **Helper test; parsers unchanged**
   - **Choice:** Unit-test `showsEventTimeInputs` in `admin-event-form.test.ts`. Keep the existing ALL_DAY midnight + first-slot credits expansion test. Add one parser case: ALL_DAY body with `event_date_0` + `event_credit_0` and **no** `event_time_0` still yields a midnight occurrence via `eventFormValuesToOccurrences`. Do not change `parseBerlinDateTime` / `expandOccurrencesFromRange` / `parseEventFormBody` field names.
   - **Rationale:** Step plan verification is that test file; the helper is the only new branch that is easy to unit-test without rendering HeroUI.
   - **Alternatives:** Component RTL tests (heavier, not required); skip the helper (harder to lock “should show time inputs”).

7. **Ladle: step-2 stories, no e2e**
   - **Choice:** Add (or adjust) `EventAdminForm` stories with `initialStep={2}`: Time slot default, and All day via `defaults.timingMode: "ALL_DAY"`. Leave `EventAdminBaseFields / Collapsed preview` (`includeDateTime={false}`) as-is. No Gherkin/Playwright.
   - **Rationale:** Step plan: adjust stories if they screenshot step 2. `initialStep` already exists on the form island.
   - **Alternatives:** Skip stories (weaker visual check); write Playwright now (step 04).

## Risks / Trade-offs

- **[Risk] Hidden `required` time fields block submit with an invisible tooltip** → Mitigation: do not render `type="time"` in ALL_DAY and do not add `required` to times (decision 2).
- **[Risk] ALL_DAY error re-render drops the first range slot so the builder cannot rebuild** → Mitigation: hidden `range_slot_time_0` + `range_slot_count=1` (decision 3). Datetime rows still POST dates/credits.
- **[Risk] Switching All day → Time slot after a server error shows empty row times** → Mitigation: `EventAdminTimeInput` already defaults empty to `DEFAULT_RANGE_SLOT_TIME`. Acceptable.
- **[Risk] Extra TIME_SLOT slots lost on ALL_DAY submit error re-render** → Mitigation: only the first slot is posted in ALL_DAY; extra slots are client-only until Time slot is used again. Acceptable (expansion never used extra slots in ALL_DAY).
- **[Risk] Clone accidentally keeps a hidden `timing_mode` alongside the select** → Mitigation: delete the hidden input; one `name="timing_mode"`.
- **[Risk] Step 03 expects allocation controls between Timing mode and ticket type** → Mitigation: leave a single ticket/capacity block so 03 can insert the allocation select without another reorder of the list.
- **[Trade-off] Booking remaining stays event-level** → Unchanged; this step is UI order + hide clocks only.
- **[Trade-off] Canonical Gherkin waits for step 04** → Delta lives in this change’s spec until then.

## Migration Plan

1. Export `showsEventTimeInputs`; add unit tests (helper + ALL_DAY parse without times).
2. Reorder step 2 in `EventAdminBaseFields`; keep `timingMode` passed into the list.
3. Gate clock UI + extra slots in `EventAdminDateTimeList`; hidden first-slot time for ALL_DAY POST; optional `rangeAllDayHint`.
4. Clone: visible Timing mode select + same list props; remove hidden `timing_mode`.
5. Ladle step-2 stories (`initialStep={2}`, All day defaults).
6. `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/admin-event-form.test.ts`.
7. Mark step 02 done in the parent guide. Do not edit Gherkin.
8. **Rollback:** revert the PR. No DB migration. Timing mode returns below the list; All day shows clocks again.

## Open Questions

- None blocking. Whether `rangeRebuildHint` stays visible in ALL_DAY (in addition to `rangeAllDayHint`) is implementer preference — default **replace** the time-slot-oriented rebuild hint with `rangeAllDayHint` while All day, and keep `rangeClosedDaysHint` if the partner has opening hours.
