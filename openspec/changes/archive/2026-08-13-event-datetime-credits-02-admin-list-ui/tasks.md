## 1. Setup

- [x] 1.1 Read step plan + parent guide; confirm artifacts (`EventAdminDateTimeList` / `EventAdminDateFields.tsx`, `ALLOW_MULTI_DATETIME_UI`, `parseEventFormBody` / `eventFormValuesToDateTimes`, `EventAdminBaseFields` `credit_price`, `eventToFormDefaults`, clone form, `admin-content.ts` add/remove copy, `admin-event-form.test.ts`, `admin-event-route-helpers.test.ts`)
- [x] 1.2 Confirm step 01 is merged: `CreateEventInput` / `UpdateEventInput` / `CloneEventInput` accept `occurrenceCreditPrices`; `Event` has `occurrenceCreditPrices`

## 2. Form model and parsing

- [x] 2.1 Extend `EventDateTimeRow` (`admin-event-form.ts` and `event-admin-types.ts`) with `credits: string`; keep `EventFormValues.creditPrice` as derived from the first complete row (else `1`); do not parse `body.credit_price` as the source of truth when `event_credit_N` is present
- [x] 2.2 Parse `event_credit_${index}` in `parseEventDateTimeRows`; missing credit on an indexed row defaults the string to `"1"`; zip credits into each row
- [x] 2.3 Add `eventFormValuesToOccurrences` (or equivalent) returning `{ startsAt, creditPrice }[]`: skip blank dates; validate integer credits `>= 0` on complete-date rows (blank/NaN/negative fail submit); throw `EMPTY_DATE_TIMES` when none remain. Implement `eventFormValuesToDateTimes` via this helper
- [x] 2.4 Update `dateTimesToFormRows` / `eventDateTimesToFormRows` to zip `dateTimes` with `occurrenceCreditPrices` by index (missing → `"1"`)
- [x] 2.5 `toCreateEventInput` / `toUpdateEventInput` pass `dateTimes` + `occurrenceCreditPrices` from the paired helper (plus derived `creditPrice` for create). Clone POST passes `occurrenceCreditPrices` into `cloneEvent`

## 3. Admin UI (create / edit / clone)

- [x] 3.1 Set `ALLOW_MULTI_DATETIME_UI` to `true`; collapse island early-returns that no-op when false; prefill all `dateTimes` + credits on edit/clone
- [x] 3.2 Add a labeled native `input type="number"` per row (`event_credit_${index}`, `admin-native-number`, `min={0}`, default `"1"`). New rows: time `19:30`, credits `1` (do not copy last-row credit; document in the PR). Cannot remove the last row
- [x] 3.3 Show live total credits = sum of parsed row prices (blank/invalid/negative count as 0 for display only). Add DE/EN `dateTimesTotalCreditsLabel`; reuse `creditPriceLabel` on each row so `getByLabel` / `getAllByLabel` work
- [x] 3.4 Remove `name="credit_price"` from `EventAdminBaseFields` (capacity stays). Do not add a hidden event-level price. Clone already has no Credits field — ensure its list posts row credits
- [x] 3.5 `eventToFormDefaults` / `formValuesToDefaults` / clone `sourceFromEvent` round-trip credits; failed submit re-renders rows including credits

## 4. Tests and verification

- [x] 4.1 Unit-test two rows with different credits parse into paired occurrences; empty list rejected; `formValuesToDefaults` keeps credits. Update fixtures from event-level `credit_price` to indexed `event_credit_N` (optional legacy `credit_price` fill only if cheaper than updating every test)
- [x] 4.2 Cover `toCreateEventInput` / `toUpdateEventInput` / clone helper paths so `occurrenceCreditPrices` is set (extend `admin-event-route-helpers.test.ts` or input tests as needed)
- [x] 4.3 Fix stories/types that still assume a single Credits field on the event form (`EventAdminBaseFields.stories.tsx`, clone types)
- [x] 4.4 Run `bun run lint`, `bun run typecheck`, and `bun test apps/web/app/lib/admin-event-form.test.ts apps/web/app/lib/admin-event-route-helpers.test.ts` — all exit 0
- [x] 4.5 Mark this step done in `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`. Do not unskip Playwright (step 05). Do not rewrite canonical Gherkin
