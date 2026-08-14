## Context

Parent feature: Date & tickets form (`.dev-plan/current-iteration/event-date-tickets-parent-guide.md`), step 03 of 04 — Capacity allocation UI, per-row capacity, live totals, and voucher mismatch reject.

Current state (01 + 02 merged):

- Catalog already persists `capacity_mode` (`SHARED` | `PER_OCCURRENCE`) and `occurrence_capacities[]`. `CreateEventInput` / `UpdateEventInput` / `CloneEventInput` accept `capacityMode` + `occurrenceCapacities`. SHARED fills the array from `totalCapacity`; PER_OCCURRENCE derives `total_capacity` as the sum. Booking remaining stays event-level.
- Date & tickets order: Timing mode → SECRET_CODE-only `total_capacity` → ticket type + secret code / voucher inventory → `EventAdminDateTimeList` (range builder then rows). All day hides clocks.
- `timingMode` state lives in `EventAdminBaseFields` and `CloneEventForm` and is passed into the list. Inactive wizard steps stay mounted.
- Rows are `{ date, time, credits }`. Credits total is a HeroUI `Paragraph` under the list. Range rebuild replaces the whole list (existing rebuild-from-scratch).
- Create/edit POST still runs `withVoucherCapacityFromInventory`, which overwrites `totalCapacity` from promo/PDF counts. Clone POST does not pass `capacityMode` / `occurrenceCapacities` and still overwrites posted `timingMode` from the source event (step 02 leftover).
- `PromoCodeInventoryFields` / `PdfVoucherInventoryFields` own preview counts internally; totals below the list cannot see them today.

Constraints: SSR-only mutation; HeroUI-only markup (`AGENTS.md` §8–9); Tailwind layout only; native `select` / `input type="number"` (`§14`); theme-only danger (no `text-red-*`); form math in `apps/web` helpers; persist/validate in `@unveiled/db`; no per-slot remaining in booking.

## Goals / Non-Goals

**Goals:**

- Capacity allocation select + capacity number immediately after Timing mode, for every ticket type (default create: `SHARED`, capacity 10).
- SHARED hides per-row capacity; posted `total_capacity` is the pool.
- PER_OCCURRENCE shows per-row `event_capacity_*` (`>= 0`); add-row and range rebuild stamp the current capacity field; changing the default does not rewrite already-edited rows unless the builder rebuilds.
- Live totals: credits, datetime capacity, and (voucher types) available codes/tickets. Danger styling on the capacity and inventory totals when they disagree. Credits are not compared.
- Submit rejects `CAPACITY_INVENTORY_MISMATCH` instead of overwriting capacity from inventory. `assertVoucherInventoryPresent` still required. SECRET_CODE omits the inventory total and that error.
- Parser, create/update/clone inputs, edit/clone defaults, and clone POST all round-trip `capacityMode` + capacities.
- Unit tests for SHARED vs PER_OCCURRENCE parse, rebuild default stamp, mismatch helper, and edit defaults.

**Non-Goals:**

- Gherkin / Playwright / canonical `docs/product/` / Ladle coverage matrix (step 04).
- Per-occurrence `remaining_capacity` or booking/waitlist enforcement per datetime.
- Changing waitlist promotion, range rebuild-from-scratch, or opening-hours skip-closed-days.
- Turning clone into the three-step wizard.
- Per-slot capacity on the range builder.
- New theme color tokens beyond an optional `.admin-form__total--mismatch` component class.

## Decisions

1. **Insert allocation between Timing mode and ticket type; show capacity for every ticket type**
   - **Choice:** In `EventAdminBaseFields` step 2, after the Timing mode `AdminFormSelect`: native `AdminFormSelect` `name="capacity_mode"` (`SHARED` / `PER_OCCURRENCE`) and a native capacity number `name="total_capacity"` (min 1, default 10, required). Remove the `ticketType === "SECRET_CODE"` gate. Stop rendering `capacityFromInventoryHint`. Ticket type + secret code / voucher islands stay next; `EventAdminDateTimeList` stays last. Hold `capacityMode` and `totalCapacity` in React state (create default `SHARED` / `10`; edit from `defaults`) and pass them into the list.
   - **Rationale:** Parent field-order items 1–4. Voucher types now have an explicit capacity field; inventory is compared, not used as a silent source.
   - **Alternatives:** Keep SECRET_CODE-only capacity (violates the parent lock); put allocation inside the datetime list (hides it when `includeDateTime` is false).

2. **Locked copy in `getAdminCopy`; per-row label reuses `capacityLabel`**
   - **Choice:** Add DE/EN keys from the parent guide:

     | Key | DE | EN |
     |---|---|---|
     | `capacityAllocationLabel` | Kapazitätsverteilung | Capacity allocation |
     | `capacityAllocationShared` | Gemeinsam für alle Termine | Shared across all dates |
     | `capacityAllocationPerDate` | Pro Termin | Per date |
     | `capacityAllocationSharedHint` | Ein Kontingent für das gesamte Event. | One ticket pool for the whole event. |
     | `capacityAllocationPerDateHint` | Jeder Termin startet mit dieser Kapazität; pro Zeile änderbar. | Each date starts with this capacity; you can change it per row. |
     | `dateTimesTotalCapacityLabel(n)` | Kapazität gesamt: n | Total capacity: n |
     | `dateTimesTotalInventoryLabel(n)` | Verfügbare Codes/Tickets: n | Available codes/tickets: n |

     Event-level and per-row number labels both use existing `capacityLabel` (**Kapazität** / **Capacity**). Render the matching allocation hint as HeroUI `Description` under the select (swap on mode change). `mapCatalogErrorCode` for `CAPACITY_INVENTORY_MISMATCH`: DE `Kapazität und Inventar stimmen nicht überein.` / EN `Capacity and inventory do not match.`
   - **Rationale:** Step plan: match parent guide verbatim; per-row label is Capacity / Kapazität.
   - **Alternatives:** Distinct per-row label (not requested); keep `capacityFromInventoryHint` (now false).

3. **Per-row `capacity` on `EventDateTimeRow`; SHARED does not post `event_capacity_*`**
   - **Choice:** Extend `EventDateTimeRow` with `capacity: string` (same pattern as `credits`). `parseEventDateTimeRows` reads `event_capacity_${index}` (default `""`).
     - **SHARED:** do not render per-row (or per-slot) capacity inputs. `toCreateEventInput` / `toUpdateEventInput` pass `capacityMode: "SHARED"` and `totalCapacity`; omit `occurrenceCapacities` so catalog fills from the pool.
     - **PER_OCCURRENCE:** native `<input type="number" min={0} step={1} className="admin-native-number">` named `event_capacity_${index}` with `Label` **Capacity** / **Kapazität**. Parser builds `occurrenceCapacities` from those integers (`>= 0`; non-integer / missing → `NEGATIVE_CAPACITY`, same spirit as credits). Catalog derives `total_capacity` as the sum. Posted `total_capacity` is still the default field (create/edit always POST it) but PER_OCCURRENCE persist uses the array.
     - Row grid: SHARED All day `sm:grid-cols-2` (date + credits); SHARED Time slot `sm:grid-cols-3`; PER_OCCURRENCE All day `sm:grid-cols-3` (date + credits + capacity); PER_OCCURRENCE Time slot `sm:grid-cols-4`.
   - **Rationale:** Step 01 already ignores posted arrays in SHARED. Hiding the inputs avoids posting stale per-row values that the admin cannot see.
   - **Alternatives:** Always post per-row capacities and let SHARED ignore them (hidden fields in the a11y tree); persist caller arrays in SHARED (rejected in 01).

4. **Default stamp on add/rebuild only — not when the capacity field changes**
   - **Choice:** Pass `defaultOccurrenceCapacity: string` (current `total_capacity` field) into `EventAdminDateTimeList`. `createRow` / `addRow` and `rowsFromOccurrences` after `expandOccurrencesFromRange` set `capacity` to that string. Range slots stay credits-only (no per-slot capacity). Do **not** `useEffect`-sync existing row capacities when `defaultOccurrenceCapacity` changes. Switching Timing mode still rebuilds (existing effect) and therefore restamps. Switching Capacity allocation SHARED ↔ PER_OCCURRENCE does **not** rebuild the list; PER_OCCURRENCE reveals whatever is already on the row (edit defaults from `occurrence_capacities`; new empty rows get the current default).
   - **Rationale:** Step plan: changing the default does not rewrite rows the admin already edited unless the range builder rebuilds (existing rebuild-from-scratch).
   - **Alternatives:** Live-sync all rows from the default (destroys per-row edits); add per-slot capacity on the builder (explicitly out of scope).

5. **Parser + catalog input mapping**
   - **Choice:** `parseCapacityMode`: `PER_OCCURRENCE` or default `SHARED`. `EventFormValues.capacityMode: CapacityMode`. `eventFormValuesToOccurrences` includes `capacity` when `capacityMode === "PER_OCCURRENCE"` (parse integer `>= 0` or throw `NEGATIVE_CAPACITY`). `eventFormValuesToOccurrenceLists` returns `occurrenceCapacities?: number[]` only in that mode. `toCreateEventInput` / `toUpdateEventInput` pass `capacityMode` and, when PER_OCCURRENCE, `occurrenceCapacities`. `eventDateTimesToFormRows` / `dateTimesToFormRows` accept `occurrenceCapacities` and stringify onto rows (SHARED edit still loads the filled array so switching to Per date pre-fills). Add `NEGATIVE_CAPACITY`, `OCCURRENCE_CAPACITY_LENGTH_MISMATCH`, and `CAPACITY_INVENTORY_MISMATCH` to `SCHEDULE_CATALOG_CODES` (today the first two fall through to wizard step 1).
   - **Rationale:** Catalog write rules from 01 stay; the form is the missing caller. Mapping those codes to step 2 is required once the UI posts them.
   - **Alternatives:** Always send `occurrenceCapacities` even in SHARED (catalog would ignore; extra parser work).

6. **Mismatch assert in `admin-voucher-inventory`; stop the overlay**
   - **Choice:** Keep `resolveVoucherDerivedCapacity` (create = incoming count; edit append = available + allocated + incoming; edit replace unused = allocated + incoming; empty incoming on edit = available + allocated). Add `datetimeCapacityTotal(values)`: SHARED → `values.totalCapacity`; PER_OCCURRENCE → sum of parsed row capacities. Add `assertCapacityMatchesInventory(values, existingCounts?)`: no-op for `SECRET_CODE`; no-op when derived is `null` (empty voucher payload — `assertVoucherInventoryPresent` still owns `EMPTY_VOUCHER_INVENTORY`); when derived is a number and `derived !== datetimeCapacityTotal(values)`, throw `CatalogValidationError("CAPACITY_INVENTORY_MISMATCH", ...)`. Add that code to `CatalogErrorCode`. Delete call sites of `withVoucherCapacityFromInventory` in `new.tsx` / `edit.tsx` (and clone if present); keep `assertVoucherInventoryForForm`. Call the new assert after inventory-present, before `createEvent` / `updateEvent` / `cloneEvent`.
   - **Rationale:** Step plan allows catalog **or** admin helper. Inventory math already lives in the web helper; catalog writes do not see voucher payloads. Overlay is the bug this step removes.
   - **Alternatives:** Put mismatch in `@unveiled/db` catalog (would need inventory counts on every write); keep overlay and only paint danger (parent lock: reject, do not overwrite).

7. **Live totals: lift inventory preview; danger via theme class**
   - **Choice:** Add `onInventoryPreviewChange?: (state: { incomingCount: number; replaceUnused: boolean })` to `PromoCodeInventoryFields` and `PdfVoucherInventoryFields` (and islands). `EventAdminBaseFields` / `CloneEventForm` hold that state plus `defaults.inventoryCounts`. Compute the display inventory count with the same rules as `resolveVoucherDerivedCapacity` (export a small `voucherInventoryDisplayCount` used by UI and tests). Pass `inventoryTotal: number | null` (`null` for SECRET_CODE) into `EventAdminDateTimeList`. Below the existing credits `Paragraph`, render capacity total and (when not null) inventory total as HeroUI `Paragraph`. When `inventoryTotal !== null && inventoryTotal !== capacityTotal`, add class `admin-form__total--mismatch` to **those two** paragraphs (not credits). Define the class in `globals.css` `@layer components` using theme danger tokens (e.g. `color: var(--danger)` / HeroUI danger). Do not use Tailwind `text-red-*`. Optional: wrap those two lines in HeroUI `Alert` `status="danger"` instead of the class — pick **one**; default the class so credits can stay a sibling `Paragraph`.
   - **Rationale:** Totals sit below the list, after inventory in the DOM for create/edit, so counts must be lifted. Theme class matches hard rule 9.
   - **Alternatives:** Put totals inside each inventory island (wrong place); poll hidden JSON fields (fragile).

8. **Clone: visible allocation, pass mode + arrays, stop overwriting posted timing/capacity**
   - **Choice:** Extend `CloneEventFormSource` with `capacityMode` and `totalCapacity`. `sourceFromEvent` copies them; `eventDateTimesToFormRows` includes capacities. Clone UI: Timing mode; Capacity allocation select + capacity number; voucher inventory (if needed); `EventAdminDateTimeList` with `capacityMode` / `defaultOccurrenceCapacity` / `inventoryTotal`; totals vs **new** inventory (clone is create-shaped: preview count only, no source inventory). Hidden `ticket_type` stays. Clone POST: honor posted `timing_mode` and `capacity_mode` (remove `values.timingMode = existing.timingMode`); keep `values.ticketType = existing.ticketType`; pass `capacityMode` + `occurrenceCapacities` (when PER_OCCURRENCE) into `cloneEvent`. Error re-render round-trips allocation + row capacities via `defaults`.
   - **Rationale:** Step plan: clone posts the same fields; totals vs new inventory. Overwriting `timingMode` would also undo step 02’s visible Timing mode.
   - **Alternatives:** Keep inventory below the list on clone without lifting counts (totals could not live-update); copy source inventory (clone must not copy voucher rows).

9. **Controlled capacity number (not `AdminFormNumberField` defaultValue-only)**
   - **Choice:** Event-level capacity uses a native number input with `value` + `onChange` (same chrome as `EventAdminCreditInput` / extend `AdminFormNumberField` with optional controlled props). Uncontrolled `defaultValue` cannot stamp add/rebuild from the **current** field. Per-row capacity is controlled on row state like credits. Do **not** use HeroUI `NumberField` or `Select`.
   - **Rationale:** Hard rule 14 + live default stamp.
   - **Alternatives:** Read `total_capacity` from the DOM on add (breaks SSR mental model; worse tests).

10. **Tests stay in the listed files; no db mismatch test unless the throw moves**
    - **Choice:** `admin-event-form.test.ts`: SHARED parse (mode + `total_capacity`, no `occurrenceCapacities`); PER_OCCURRENCE parse (`event_capacity_*` → `occurrenceCapacities`); ALL_DAY + per-row capacity without times still midnight; `eventFormErrorStep(CAPACITY_INVENTORY_MISMATCH) === 2`; helper that stamps default capacity on `occurrencesToFormRows` / rebuild mapping. `admin-voucher-inventory.test.ts`: mismatch helper (10 vs 7 throws; equal does not; SECRET_CODE no-op; empty voucher defers to present-assert). `admin-event-route-helpers.test.ts`: `eventToFormDefaults` / `formValuesToDefaults` include `capacityMode` and row `capacity`. Do not add a `datetime.test.ts` case unless mismatch is implemented in `@unveiled/db` (it is not, per decision 6). Still run that file if unchanged so the verification command stays green.
    - **Rationale:** Step plan verification list; mismatch is a web helper.
    - **Alternatives:** RTL component tests (heavier, not required this step).

## Risks / Trade-offs

- **[Risk] Clone POST still overwrites `timingMode` from source** → Mitigation: decision 8 removes that assignment; keep ticket type source-locked only.
- **[Risk] SHARED posts leftover `event_capacity_*` from a previous PER_OCCURRENCE client state after an error re-render** → Mitigation: do not render those inputs in SHARED so they are absent from FormData; parser ignores them unless mode is PER_OCCURRENCE.
- **[Risk] PER_OCCURRENCE sum 0 is accepted by the form and rejected later by catalog `REQUIRED_FIELD`** → Mitigation: acceptable; map `REQUIRED_FIELD` for `totalCapacity` already to step 2; add `occurrenceCapacities` / `capacityMode` to `SCHEDULE_REQUIRED_FIELDS` if the message uses those names.
- **[Risk] Inventory islands fire preview callbacks after first paint, so totals flash 0** → Mitigation: initialize incoming count from empty arrays; clone/create start at 0 until files are chosen (SECRET_CODE has no inventory line).
- **[Risk] Edit replace-unused checkbox lives inside the island** → Mitigation: include `replaceUnused` in `onInventoryPreviewChange`; parent recomputes display count.
- **[Risk] Wizard error step for `NEGATIVE_CAPACITY` is currently 1** → Mitigation: add the capacity catalog codes to `SCHEDULE_CATALOG_CODES` (decision 5).
- **[Trade-off] Booking remaining stays event-level** → Parent non-goal; do not add per-slot remaining.
- **[Trade-off] Canonical Gherkin waits for step 04** → Delta lives in this change’s spec until then.

## Migration Plan

1. Copy keys + mismatch string into `admin-content.ts`; add `CAPACITY_INVENTORY_MISMATCH` to `CatalogErrorCode` and `mapCatalogErrorCode`.
2. Extend row/parser/defaults/input helpers; unit-test parse + defaults + error step.
3. Add mismatch helper; remove `withVoucherCapacityFromInventory` from routes; call `assertCapacityMatchesInventory`.
4. UI: allocation + capacity in `EventAdminBaseFields`; per-row capacity + totals in `EventAdminDateTimeList`; lift inventory preview; optional `.admin-form__total--mismatch`.
5. Clone: source fields, visible allocation, list props, POST `capacityMode` / arrays, stop overwriting posted timing/capacity mode.
6. `bun run lint`; `bun run typecheck`; listed unit tests.
7. Mark step 03 done in the parent guide. Do not edit Gherkin.
8. **Rollback:** revert the PR. No DB migration. Capacity returns to SECRET_CODE-only + inventory overlay.

## Open Questions

- None blocking. Prefer `.admin-form__total--mismatch` over wrapping each total in `Alert` so the credits line stays a plain `Paragraph`. Clone inventory moves above the datetime list so lifted preview counts feed totals without a second totals block.
