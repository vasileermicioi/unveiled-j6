## Context

Parent feature: per-occurrence credits (`.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`), step 02 — admin list UI after schema/domain (step 01 done).

Current state:

- Catalog create/update/clone already accept `dateTimes` + optional `occurrenceCreditPrices` (paired path). When credits are omitted, every slot is filled from a single `creditPrice` (clone: `source.creditPrice`).
- Admin create/edit still post a standalone `name="credit_price"` via `AdminFormNumberField` in `EventAdminBaseFields`. Clone has no Credits field and therefore flattens mixed prices on POST.
- `EventAdminDateTimeList` already implements indexed `event_date_N` / `event_time_N` + add/remove chrome, gated by `ALLOW_MULTI_DATETIME_UI = false`. Edit/clone prefill only the primary instant via `eventDateTimesToFormRows`.
- Parsers: `parseEventDateTimeRows` → `{ date, time }[]`; `eventFormValuesToDateTimes` skips incomplete (missing date) rows and throws `EMPTY_DATE_TIMES` when none remain. `toCreateEventInput` / `toUpdateEventInput` pass `dateTimes` + `creditPrice` only.
- Playwright multi-datetime scenarios stay skipped until step 05 (`e2e/specs/admin-events.spec.ts`).

Constraints: SSR form POST only (island owns chrome, server owns validation); HeroUI layout + native `input type="date|time|number"` (`AGENTS.md` §8–9, §14); Tailwind for layout only; theme via `admin-native-number` / existing date-time classes; copy in `admin-content.ts` (DE and EN); Europe/Berlin parse via existing `parseBerlinDateTime`. Parent locks 1–2 and 7: parallel arrays, reject duplicate instants on the paired path, admin total is the sum of listed credit prices (informational, not a charge).

## Goals / Non-Goals

**Goals:**

- Unpark add/remove datetime rows on create, edit, and clone (`ALLOW_MULTI_DATETIME_UI = true`).
- Each row has a native credits input; persist paired `dateTimes` + `occurrenceCreditPrices`.
- Drop the event-level Credits field from authoring; keep capacity.
- Show a live total-credits figure (sum of row prices).
- Prefill edit/clone from the full `dateTimes` + `occurrenceCreditPrices` lists.
- Reject submit with zero complete rows; re-render submitted rows including credits.
- Unit tests for multi-row parse, empty rejection, and credit pairing.

**Non-Goals:**

- Range builder / partner-hours defaults (step 03).
- Checkout dropdown, `bookings.date_time`, `bookEvent` signature (step 04).
- Canonical Gherkin / Playwright unskip (step 05).
- Changing catalog normalize/sync rules from step 01.
- Per-slot capacity or inventory.
- Reviving `/admin/events/series/new`.

## Decisions

1. **Flip the parked flag; keep the constant**
   - **Choice:** Set `ALLOW_MULTI_DATETIME_UI` to `true` in `admin-event-form.ts`. Keep the named export so a one-line revert remains and step 05 can delete it together with the e2e skip. Collapse island early-returns that no-op when the flag is false (add/remove always work). `eventDateTimesToFormRows` uses the true branch (full `dateTimes` list).
   - **Rationale:** Step plan is a flag flip, not a rewrite of list chrome that already exists.
   - **Alternatives:** Delete the flag now (more diff, no benefit until e2e unskip).

2. **Row model: `{ date, time, credits: string }`**
   - **Choice:** Extend `EventDateTimeRow` in both `admin-event-form.ts` and `event-admin-types.ts` with `credits: string` (form string; parsed to int on submit). Keep `EventFormValues.creditPrice: number` as a **derived** convenience (first complete row’s parsed price, else `1`) so `CreateEventInput.creditPrice` still typechecks. Do **not** parse `body.credit_price` as the source of truth.
   - **Rationale:** Step plan: string in the form, parsed to int. Derived `creditPrice` avoids a breaking type change on every helper while guaranteeing catalog writes also send `occurrenceCreditPrices`.
   - **Alternatives:** Drop `EventFormValues.creditPrice` entirely (touches more call sites including dead `toSeriesCreateInput`); keep posting `credit_price` hidden (rejected — leftover event-level price can flatten mixed slots on update).

3. **Field naming: `event_credit_${index}`**
   - **Choice:** Continue `datetime_count` + `event_date_N` / `event_time_N`; add `event_credit_N`. Parse in `parseEventDateTimeRows`. Missing credit field on an indexed row defaults the **string** to `"1"` (new-row default), not to a posted `credit_price`.
   - **Rationale:** Matches existing indexed FormData style; unique `name`/`id` per row.
   - **Alternatives:** `credits[]` array fields (FormData order quirks); keep `credit_price` as a hidden primary (overrides mixed prices).

4. **Paired submit helper; skip incomplete dates; validate credits on complete rows**
   - **Choice:** Add `eventFormValuesToOccurrences(values): { startsAt: Date; creditPrice: number }[]` (or equivalent). Skip rows with blank date. If none remain, throw `EMPTY_DATE_TIMES` (existing copy). For a complete-date row: parse credits with integer rules (`>= 0`); blank/NaN/non-integer/negative **fail submit** (do not coerce). Implement `eventFormValuesToDateTimes` via this helper (dates only) so empty rejection stays one path.
   - **Live total (island only):** `Number.parseInt(credits, 10)` per row; blank/NaN/negative count as `0` for the displayed sum. Submit still validates.
   - **Rationale:** Step plan: incomplete rows skipped; live total treats invalid as 0; submit validates. Domain already rejects `< 0` and non-integers on the paired path.
   - **Alternatives:** Coerce blank credits to 1 on submit (hides authoring errors); skip rows with invalid credits (drops a dated slot silently).

5. **Catalog writes always send `occurrenceCreditPrices`**
   - **Choice:** `toCreateEventInput` / `toUpdateEventInput` pass `dateTimes` and `occurrenceCreditPrices` from the paired helper (same order, same length). Still pass derived `creditPrice` (create requires it; catalog overwrites from the primary occurrence after sort). Clone POST currently calls `cloneEvent` with `{ dateTimes }` only — add `occurrenceCreditPrices` so mixed prices survive clone (step 01 flattens when omitted).
   - **Rationale:** Paired path is the only way to persist different prices; update-without-credits would fill every stored slot from `creditPrice`.
   - **Alternatives:** Pass only `creditPrice` when all rows share one price (extra branch, easy to get wrong).

6. **Prefill from parallel arrays by index**
   - **Choice:** `dateTimesToFormRows(dateTimes, occurrenceCreditPrices?)` zips by index (`String(price)` per slot; missing → `"1"`). `eventDateTimesToFormRows(event)` uses `event.dateTimes` + `event.occurrenceCreditPrices` once the flag is true. `eventToFormDefaults` / `formValuesToDefaults` / clone `sourceFromEvent` round-trip `dateTimeRows` including credits. Failed clone/create/edit re-render uses submitted `values.dateTimeRows`.
   - **Rationale:** Step 01 guarantees equal cardinality and datetime-sorted order on stored events.
   - **Alternatives:** Prefill every row from denormalized `creditPrice` (loses mixed prices on edit).

7. **Remove event-level Credits field; capacity stays**
   - **Choice:** Delete the `name="credit_price"` `AdminFormNumberField` from `EventAdminBaseFields`. Leave the capacity number field in that grid (full width when shown). Clone already has no Credits field. Do not add a hidden `credit_price` input. Reuse `creditPriceLabel` (“Credits” / “Credits”) as the **per-row** input label so `getByLabel` / `getAllByLabel` work for step 05 e2e. Add `dateTimesTotalCreditsLabel: (total: number) => string` for the list total (EN `Total credits: ${total}`, DE `Credits gesamt: ${total}`). Keep add/remove labels.
   - **Rationale:** Parent lock 7; step plan forbids a leftover event-level price. Same visible label on each row is OK — names differ (`event_credit_0` …).
   - **Alternatives:** Unique “Credits (1)” labels (noisier); HeroUI `NumberField` (forbidden by `AGENTS.md` §14).

8. **Per-row native number + live total in the island**
   - **Choice:** Add a native `input type="number"` per row (`className="admin-native-number"`, `min={0}`, `step={1}`, `name={`event_credit_${index}`}`, labeled). Prefer a small inline field (reuse `AdminFormNumberField` if the layout fits; otherwise the same native pattern with `htmlFor`/`id`). Grid: date | time | credits, then Remove. `createRow(date, time, credits = "1")` — **do not** copy the last row’s credit (spec default 1; document that choice in the PR). Time default stays `19:30`. Total is a labeled figure below the list, updated from React state as the user types (`onChange` on the credits inputs, or controlled credits fields). Not posted.
   - **Rationale:** Island already owns row chrome; total is display-only.
   - **Alternatives:** Uncontrolled credits + no live total until submit (fails the total scenario); copy last-row credit as convenience (allowed by the step plan but not the default — skip unless a later PR documents it).

9. **Legacy `event_date` / `event_time` / `credit_price` posts**
   - **Choice:** Keep the existing single-field date/time fallback in `parseEventDateTimeRows` for non-indexed bodies. **Do not** keep `credit_price` as an override when indexed `event_credit_N` exist. Update unit tests to post `event_credit_N` (and indexed dates). Optional thin compat: if the body has **no** `event_credit_*` keys and has `credit_price`, stamp that integer onto every parsed row’s `credits` string so older fixtures still parse — only if it is cheaper than updating every test in this PR. Prefer indexed-only once tests are updated.
   - **Rationale:** Step plan marks legacy credit_price parse as optional; UI will always post indexed credits.
   - **Alternatives:** Break all tests that still post `credit_price` without updating them (unnecessary churn if a one-line fallback exists).

10. **Dead series helper**
    - **Choice:** Leave `toSeriesCreateInput` compiling via derived `values.creditPrice`. Do not revive series UI. Out of scope to delete unless typecheck forces it.
    - **Rationale:** Same as the previous multi-datetime admin step.

## Risks / Trade-offs

- **[Risk] Hidden or leftover `credit_price` flattens mixed slots on update** → Mitigation: remove the named field; do not parse `body.credit_price` when `event_credit_N` is present; always pass `occurrenceCreditPrices` from the paired helper.
- **[Risk] Error re-render drops credits** → Mitigation: `formValuesToDefaults` copies `dateTimeRows` including `credits`; clone error path already restores `dateTimeRows`.
- **[Risk] Duplicate instants with different credits** → Mitigation: paired catalog path rejects duplicates (step 01). Surface via existing `mapCatalogError` / new codes (`DUPLICATE_OCCURRENCE_INSTANTS`). No silent unique-merge in the admin helper.
- **[Risk] Removing last row** → Mitigation: keep current island rule (cannot remove the last row); server still rejects zero complete dates if the remaining row is blank.
- **[Risk] Controlled vs uncontrolled date/time inputs** → Mitigation: credits may be controlled for the live total; date/time can stay defaultValue as today. If mixing controlled credits with defaultValue date/time, key rows by `row.id` as now.
- **[Trade-off] New rows default credits to 1, not the last row’s price** → Spec default; document in the PR.
- **[Trade-off] Playwright stays skipped** → Required; step 05 unskips. Accessible labels are still added now.
- **[Trade-off] `EventFormValues.creditPrice` remains** → Derived only; UI must not show a second Credits field.

## Migration Plan

1. Extend row types, parsers, paired helper, and unit tests (indexed credits, empty rejection, pairing).
2. Flip `ALLOW_MULTI_DATETIME_UI`; prefill all datetimes + credits; add per-row input + total; remove event-level Credits field; wire `occurrenceCreditPrices` on create/update/clone.
3. Add DE/EN copy keys; round-trip defaults.
4. Run `bun run lint`, `bun run typecheck`, and the listed admin-event unit tests.
5. Mark step 02 done in the parent guide. Do not unskip Playwright.
6. Rollback: revert the admin form PR. Catalog still accepts single-price fills; existing events remain valid.

## Open Questions

- None blocking. Canonical `admin-events.feature` narrative updates wait for step 05. Copy strings above are the implementer default unless a later pass prefers different DE wording.
