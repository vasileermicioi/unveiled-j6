## Context

Parent feature `event-multi-datetime`, step 02 — admin form UI after schema/domain (step 01 done).

Current state:

- Catalog APIs already take `dateTimes: Date[]`; admin create/edit/clone still parse single `event_date`/`event_time` and wrap `[eventFormValuesToDateTime(values)]` in `admin-event-input.ts`.
- UI: `EventAdminDateTimeFields` (native date + time) in `EventAdminBaseFields` and `CloneEventForm`; island chrome via `EventAdminForm`.
- Defaults: `eventToFormDefaults` / clone source use only denormalized `event.dateTime`.
- Legacy series slot parsers (`slot_date_${index}` / `slot_time_${index}`) remain in `admin-event-form.ts` but series UI is gone — useful pattern for indexed rows, not for reusing series create.

Constraints: SSR form POST only (no mutation modals); HeroUI layout + native inputs (`AGENTS.md` §14); client island OK for list chrome; Europe/Berlin parse via existing `parseBerlinDateTime`; theme-owned visuals.

## Goals / Non-Goals

**Goals:**

- Inplace add/remove datetime rows on create, edit, and clone forms.
- Parse posted rows into `dateTimes`; reject empty list with i18n error; re-render preserving rows.
- Prefill edit/clone from `event.dateTimes` (full list), not only primary `dateTime`.
- Wire `toCreateEventInput` / `toUpdateEventInput` / clone POST to the multi-value list (drop one-element wrap).
- Unit tests for multi-value parse and empty rejection.

**Non-Goals:**

- Public/member detail multi-line times, feed cards, booking/ICS, product Gherkin/e2e polish (step 03).
- Per-slot booking or capacity.
- Changing catalog domain normalize/sync rules from step 01.
- Reviving series create UI.

## Decisions

1. **Field naming: indexed `event_date_N` / `event_time_N` (+ count)**
   - **Choice:** Post `datetime_count` (or infer by scanning indices) and pairs `event_date_0`…`event_date_N-1` with matching `event_time_*`, mirroring the old series slot indexing. Parse into `{ date: string; time: string }[]` on `EventFormValues`, then map to `Date[]` via `parseBerlinDateTime` + `timingMode`.
   - **Rationale:** Works with native controls and multipart FormData without relying on `[]` array quirks; matches existing series parser style already in-repo.
   - **Alternatives:** Single `datetime-local` per row named `date_times[]` (simpler DOM, but current UX is split date+time and clone/edit already use that pattern); keep sole `event_date`/`event_time` plus optional extras (awkward for clone multi-prefill).

2. **Form model: replace scalar date/time with `dateTimeRows`**
   - **Choice:** Change `EventFormValues` / `EventFormDefaults` from `eventDate`+`eventTime` to `dateTimeRows: { date: string; time: string }[]` (min length 1 when valid). Helpers: `eventFormValuesToDateTimes(values): Date[]` (filter incomplete rows or treat incomplete as parse errors — prefer reject empty after filtering blank rows; require ≥1 complete pair). Keep a thin compatibility shim only if a call site still needs one pair during migration inside this change (prefer updating all call sites in one PR).
   - **Rationale:** One shape for create/edit/clone/error re-render.
   - **Alternatives:** Keep scalars for “primary” plus `additionalDateTimes` (rejected — duplicates UI state).

3. **Island owns list chrome; SSR owns validation**
   - **Choice:** Extend `EventAdminForm` / date-fields component with client add/remove that inserts/removes native inputs inside the form. Submit remains normal POST. Server validates ≥1 datetime; on error, `formValuesToDefaults` rebuilds all submitted rows.
   - **Rationale:** Matches existing island pattern; no client-only mutation of catalog data.
   - **Alternatives:** Full-page reload add/remove via GET query (worse UX); pure SSR without island (awkward for dynamic rows without JS — island is already required for other admin form behavior).

4. **Clone prefills source list**
   - **Choice:** Clone GET maps `source.dateTimes` → rows; admin may edit before POST. Still require ≥1 datetime (same as create). Do not force a “new” single date different from source unless product later requires it — editing the list is enough.
   - **Rationale:** Step plan: copy source list, allow edit before confirm.
   - **Alternatives:** Clear dates on clone (worse UX; rejected).

5. **Remove temporary one-element wrap**
   - **Choice:** `toCreateEventInput` / `toUpdateEventInput` / clone route pass full `dateTimes` from parsed rows. Update admin-events spec text that allowed wrapping a single posted datetime.
   - **Rationale:** Step 01 temporary bridge ends here.

6. **Empty-list and incomplete-row handling**
   - **Choice:** Blank trailing rows may be ignored; if after parse zero complete datetimes remain, fail with dedicated admin copy (DE/EN). Do not call catalog create/update with `[]`.
   - **Rationale:** Matches domain check + clearer admin UX than a raw DB/domain error.

## Risks / Trade-offs

- **[Risk] Error re-render drops rows if defaults only map primary** → Mitigation: always round-trip `dateTimeRows` through `formValuesToDefaults` / `eventToFormDefaults` from `dateTimes`.
- **[Risk] Removing last row in the island leaves zero inputs** → Mitigation: either disable Remove when one row left, or allow zero in DOM and let server validation fail with empty-list message; prefer keep ≥1 row in UI chrome.
- **[Risk] Timing mode + empty time** → Mitigation: reuse existing `parseBerlinDateTime` / default time behavior per row consistently with today’s single-field rules.
- **[Trade-off] Admin list still shows primary/next only** → Accepted until step 03.
- **[Trade-off] Dead `toSeriesCreateInput` / series parsers may linger** → Out of scope cleanup unless they block typecheck; do not revive series UI.

## Migration Plan

1. Update form types, parsers, mappers, and unit tests.
2. Replace single datetime UI with list editor in base fields + clone form; add copy keys.
3. Prefill edit/clone from `event.dateTimes`.
4. Run lint, typecheck, and `admin-event-form` tests.
5. Rollback: revert admin form PR; domain still accepts one-element lists so catalog remains valid.

## Open Questions

- None blocking — field naming and island approach are decided above; product Gherkin narrative updates deferred to step 03 unless a one-line admin-events.feature tweak is needed for implementer clarity (optional, not required for this change’s verification).
