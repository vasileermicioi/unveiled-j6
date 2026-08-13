## Why

Step 01 persists per-occurrence credits on catalog create/update/clone, but admin create/edit/clone still parks multi-datetime chrome (`ALLOW_MULTI_DATETIME_UI = false`) and posts a single event-level `credit_price`. Admins cannot add or remove datetime rows inplace, cannot price occurrences independently, and clone still flattens mixed prices to `source.creditPrice`. This step unparks the list UI so authoring matches the domain API (parent feature `event-datetime-credits`, step 02 of 05).

## What Changes

- Set `ALLOW_MULTI_DATETIME_UI` to `true` so create/edit/clone show add/remove datetime rows (min one row in chrome).
- Extend each datetime row with a native number credits input (`event_credit_${index}`); default new-row credits = 1; min 0 to match domain.
- Parse indexed date/time/credit rows into paired occurrences; map to `dateTimes` + `occurrenceCreditPrices` in `toCreateEventInput` / `toUpdateEventInput` / clone POST.
- Remove the standalone event-level Credits field (`name="credit_price"`) from create/edit (clone already has none). Capacity stays. Do not post a leftover event-level price that could override row credits.
- Show a live **total credits** figure (sum of listed row prices; informational, not a charge) with DE/EN copy.
- Prefill edit/clone from `event.dateTimes` + `event.occurrenceCreditPrices` (full list, not only primary). Failed submit re-renders rows including credits.
- Reject submit when zero complete datetime rows remain (`EMPTY_DATE_TIMES`); incomplete rows (missing date) are skipped.
- Unit tests for multi-row parse with different credits, empty-list rejection, and credit pairing / round-trip.
- Out of scope: range builder, partner opening-hours defaults, checkout dropdown, booking domain, e2e unskip (step 05). Do not revive `/admin/events/series/new`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Create/edit/clone forms present an editable datetime list where each row includes date, time (when `TIME_SLOT`), and a credit price. The form shows the sum of listed credits and SHALL NOT show a separate event-level Credits field. Submit persists `occurrence_credit_prices` in datetime order; denormalized `credit_price` remains the primary/next slot’s price (catalog write from step 01). Empty complete-row lists are rejected before catalog write.

## Impact

- **UI:** `EventAdminDateTimeList` / `EventAdminDateFields.tsx` — per-row native number credits + live total; `EventAdminBaseFields` drops `name="credit_price"`; clone uses the same list (already has no event-level Credits field). HeroUI layout + native `input type="date|time|number"` (`AGENTS.md` §8–9, §14); theme via `admin-native-number` / existing date-time classes.
- **Parsers / mappers:** `admin-event-form.ts` (`EventDateTimeRow.credits`, `parseEventDateTimeRows`, `eventFormValuesToDateTimes` or paired helper), `admin-event-input.ts` (`occurrenceCreditPrices`), `admin-event-route-helpers.ts` (`eventToFormDefaults` / `formValuesToDefaults`), clone route POST.
- **Copy:** `admin-content.ts` — per-row credits label, list total label; keep add/remove labels. Accessible names must work with `getByLabel` for e2e in step 05.
- **Tests:** `admin-event-form.test.ts`, `admin-event-route-helpers.test.ts`.
- **Domain (unchanged this step):** `@unveiled/db` already accepts `dateTimes` + `occurrenceCreditPrices`; booking still charges denormalized `credit_price`.
- **Source brief:** `.dev-plan/current-iteration/event-datetime-credits-02-admin-list-ui.md`
- **Parent:** `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`
- **Depends on:** `event-datetime-credits-01-schema-and-domain` (done)
- **Consumed by:** `event-datetime-credits-03-range-builder`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test apps/web/app/lib/admin-event-form.test.ts apps/web/app/lib/admin-event-route-helpers.test.ts`
