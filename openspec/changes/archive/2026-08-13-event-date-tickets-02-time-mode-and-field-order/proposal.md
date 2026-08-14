## Why

Wizard step 2 (Date & tickets) currently leads with the range builder and datetime list, with Timing mode below it, and clock inputs always show — including All day, where midnight is stored anyway. Admins need Timing mode first so they choose All day vs Time slot before filling dates, and All day must hide every clock control. This is step 02 of 04 for parent feature `event-date-tickets`.

## What Changes

- Reorder Date & tickets: (1) Timing mode select, (2) existing SECRET_CODE `total_capacity` + ticket type + secret code / voucher inventory + inventory-derived hint, (3) `EventAdminDateTimeList` (range builder then rows) last.
- Keep `timingMode` state in `EventAdminBaseFields` and pass it into the list. Changing Timing mode still rebuilds range expansion (existing `useEffect`).
- When `timingMode === "ALL_DAY"`: do not render `type="time"` inputs on range slots or datetime rows; do not render extra time-slot rows beyond the first; keep start/end dates, first-slot credits, date + credits on rows. Expansion still uses first-slot credits + midnight (`expandOccurrencesFromRange`).
- When `TIME_SLOT`: keep current time + credits on slots and rows.
- Hidden/unmounted time fields MUST NOT be `required`. `parseBerlinDateTime` already ignores clock time for `ALL_DAY`.
- Clone: Timing mode is a visible `AdminFormSelect` (not only a hidden input) so All day hides times on the clone list too. Ticket type stays a hidden copy from source.
- Native `AdminFormSelect` / native date-time inputs; HeroUI `Label` / `Surface` / `Button` / `Description`; Tailwind layout only. Inactive wizard steps stay mounted.
- Unit tests: ALL_DAY expansion unchanged; add a focused helper test if “should show time inputs” is extracted.
- Out of scope: capacity allocation select, per-row capacity, totals/mismatch, showing capacity for voucher types, Gherkin/e2e (step 04), posting `capacity_mode`, changing range rebuild-from-scratch or opening-hours skip-closed-days.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin create/edit Date & tickets field order is Timing mode → ticket/capacity/redemption → range builder and datetime list. Clone exposes Timing mode as an editable control. When `timing_mode` is `ALL_DAY`, create/edit/clone hide every clock input and extra time-slot rows beyond the first; stored instants remain Europe/Berlin midnight.

## Impact

- **UI:** `EventAdminBaseFields.tsx` (step 2 order), `EventAdminDateFields.tsx` (`EventAdminDateTimeList` hide-times), `CloneEventForm.tsx` (visible Timing mode + same list behavior).
- **Copy:** `apps/web/app/lib/admin-content.ts` — existing `timingModeLabel` / `timingModeTimeSlot` / `timingModeAllDay` unchanged unless a short All-day builder hint is added.
- **Parsers:** `parseEventFormBody` / `eventFormValuesToOccurrences` / `parseBerlinDateTime` already accept ALL_DAY dates without times; do not post `capacity_mode` this step.
- **Tests:** `apps/web/app/lib/admin-event-form.test.ts` (ALL_DAY midnight + first-slot credits); optional helper test for show-times.
- **Stories:** Ladle `EventAdminForm` / `EventAdminBaseFields` if they screenshot step 2.
- **Source brief:** `.dev-plan/current-iteration/event-date-tickets-02-time-mode-and-field-order.md`
- **Parent:** `.dev-plan/current-iteration/event-date-tickets-parent-guide.md`
- **Depends on:** `event-date-tickets-01-schema-and-domain` (merged; types exist; this step does not post new capacity fields)
- **Consumed by:** `event-date-tickets-03-capacity-ui-and-totals`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/admin-event-form.test.ts`
