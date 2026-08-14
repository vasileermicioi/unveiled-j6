## Context

Parent feature: Date & tickets form (`.dev-plan/current-iteration/event-date-tickets-parent-guide.md`), step 04 of 04 — Gherkin, Playwright, canonical docs, Ladle, coverage matrix. Closes the feature.

Steps 01–03 are merged and archived (2026-08-13):

- Catalog persists `capacity_mode` (`SHARED` | `PER_OCCURRENCE`) and `occurrence_capacities[]`. Booking remaining stays event-level.
- Date & tickets order: Timing mode → Capacity allocation + capacity (all ticket types) → ticket type / redemption → range builder + datetime rows → totals.
- All day hides clock inputs. Per date shows per-row `event_capacity_*` defaulted from the capacity field; range rebuild stamps that default. SHARED hides per-row capacity.
- Totals: credits, datetime capacity, and (voucher types) available codes/tickets. Mismatch uses `.admin-form__total--mismatch` (theme `--danger`). Submit rejects `CAPACITY_INVENTORY_MISMATCH` instead of overwriting capacity from inventory.
- Locked DE/EN copy already in `getAdminCopy` (`Zeitmodus` / `Timing mode`, `Kapazitätsverteilung` / `Capacity allocation`, `Ganztägig` / `All day`, `Pro Termin` / `Per date`, totals strings).
- Ladle already has `EventAdminForm / Date & tickets time slot` and `Date & tickets all day`.
- `openspec/specs/event-catalog/spec.md` already contains 01–03 persist/UI requirements (capacity columns, All day, allocation, totals). Product Gherkin and `docs/product/` do not.

Stale surfaces this step owns:

| Area | Current drift |
|---|---|
| `docs/product/features/admin-events.feature` | No field-order / All day / Shared vs Per date / mismatch titles. Voucher scenarios still say “there is no separate capacity field”. `Default values on creation` omits `capacityMode` `SHARED`. |
| `e2e/specs/admin-events.spec.ts` | No tests for those titles. `Total credits shown on the form` and `Update an event's capacity` exist and must keep working (`goToEventFormStep(2)` already). Voucher preview helper `createVoucherPromoViaUI` pastes two codes but never asserts capacity vs inventory. |
| `e2e/fixtures/admin.ts` | `createEventViaUI` fills capacity on step 2 but has no Timing mode / Capacity allocation labels. `adminLabels.capacity` is `"Kapazität*"` (event-level required). Per-row capacity is `"Kapazität"` / `"Capacity"` without `*`. |
| `coverage-matrix.md` | No rows for the new titles. |
| `schema-overview.md` | Events table already documents `capacity_mode` / `occurrence_capacities`. Voucher inventory section still says admin does not set capacity separately (inventory-derived). |
| `ui-component-map.md` Events row | Mentions per-row credits + list total and range builder; does not mention Timing mode first, All day hiding times, Capacity allocation, per-row capacity, or voucher mismatch totals. |
| `gaps-and-decisions.md` | Multi-datetime row says capacity stays event-scoped (true for booking remaining) but does not record authored `occurrence_capacities` / visible voucher capacity / mismatch reject. |
| OpenSpec main spec | 01–03 UI/persist requirements present; no Gherkin-title BDD requirement analogous to `Event wizard BDD and docs`. |

Constraints: product SoT is `docs/product/` (`AGENTS.md`). BDD contract — proximity/layout selectors only; `test("Scenario: <exact Gherkin title>")`; no `data-testid`; no CSS-class or CSS-color assertions (cannot select `.admin-form__total--mismatch`). Native file input keeps the existing `// BDD exception: file-input` comment. R2 skip unchanged for create/image specs. Do not change field `name`s, catalog persist, or booking remaining. HeroUI-only markup if any a11y fix is required for a selector.

## Goals / Non-Goals

**Goals:**

- Canonical Gherkin matches shipped Date & tickets UI; Playwright titles match those `Scenario:` lines verbatim.
- Voucher Gherkin no longer claims capacity is hidden; mismatch is documented and tested.
- Default create documents `capacityMode` `SHARED`.
- Coverage matrix, schema-overview voucher paragraph, Events UI-map row, and gaps-and-decisions describe shipped allocation + event-scoped remaining.
- Confirm OpenSpec main `event-catalog` already has 01–03; add this step’s Gherkin-facing BDD requirement so archive sync stays aligned.
- Cheap Ladle coverage for Per date (Time slot / All day stories already exist). Totals danger is e2e-owned if a mismatch story needs voucher islands.
- Keep `Update an event's capacity`: `newTotal` is the shared capacity number or the sum of per-date capacities.
- Mark step 04 and the parent feature released.

**Non-Goals:**

- Partner portal / check-in.
- New wizard steps; converting clone to the three-step wizard.
- Per-occurrence `remaining_capacity` or booking/waitlist enforcement per datetime.
- Phase 6+ billing/email.
- Changing default `totalCapacity` 10, ticket type, or Timing mode.
- Theme / design-token changes; CSS-color assertions.
- New AGENTS.md convention.
- Re-implementing 01–03 UI or catalog writes.

## Decisions

1. **Gherkin titles are locked here so Playwright can match them verbatim**
   - **Choice:** Use these `Scenario:` titles (punctuation and casing as written). Implementers MUST copy them into both `admin-events.feature` and `test("Scenario: …")`.

   | Title | Intent |
   |---|---|
   | `Timing mode is first on Date & tickets` | Open `/admin/events/new`, fill step 1, Next to step 2. Timing mode (`Zeitmodus` / `Timing mode`) appears above Capacity allocation (`Kapazitätsverteilung` / `Capacity allocation`), ticket type, and the datetime list (`Termin hinzufügen` / `Add datetime` or a visible Datum/Date field). Assert vertical order via `boundingBox().y` (layout), not CSS. |
   | `All day hides time inputs` | On step 2, set Timing mode to All day (`Ganztägig` / `All day`). Hour/minute inputs (`Uhrzeit` / `Time`) are not visible on the range builder or datetime rows. Date fields remain. |
   | `Time slot shows times` | Timing mode Time slot (`Zeitfenster` / `Time slot`, the create default). Datetime rows and range slots show time inputs. |
   | `Shared capacity is one pool` | Capacity allocation Shared (`Gemeinsam für alle Termine` / `Shared across all dates`), capacity 10, two datetime rows. Persist; stored `total_capacity` is 10. Datetime rows do **not** show a per-row capacity input. R2 skip (create). |
   | `Per-date capacities persist` | Per date (`Pro Termin` / `Per date`), default capacity 5, two rows set to 4 and 6. After save, edit step 2 shows those row capacities in datetime order; list capacity total is 10. R2 skip. |
   | `Range rebuild stamps default capacity` | Per date, capacity 8, generate a date range. Each generated datetime row’s capacity is 8. R2 skip (partner create). |
   | `Total credits shown on the form` | **Keep existing** — already implemented; do not retitle. |
   | `Capacity and inventory totals mismatch` | VOUCHER_PROMO, datetime capacity total 10, paste 7 codes. Capacity and inventory totals are shown (`Kapazität gesamt: 10` / `Total capacity: 10` and `Verfügbare Codes/Tickets: 7` / `Available codes/tickets: 7`). Submit is rejected until they match (mismatch copy `Kapazität und Inventar stimmen nicht überein.` / `Capacity and inventory do not match.`). Do **not** assert CSS color or `.admin-form__total--mismatch`. R2 skip (partner + image walk if submit reaches step 3). |
   | `Admin uploads promo codes with preview` | Keep title. Drop “no separate capacity field”. Preview still one non-empty code per line; available-codes total equals that count; submit succeeds only when datetime-capacity total equals that count. |
   | `Default values on creation` | Keep title. Given without specifying capacity, ticket type, timing mode, or capacity allocation → `totalCapacity` 10, `ticketType` `SECRET_CODE`, `timingMode` `TIME_SLOT`, `capacityMode` `SHARED`. Existing list `10/10` assertion stays; also assert step-2 defaults (Timing mode Time slot, Capacity allocation Shared, capacity 10). |

   Also rewrite the two PDF voucher scenarios the same way as promo (drop “no separate capacity field”; capacity total must equal ticket count). Dedicated Playwright for those two is **not** required this step if they remain expensive (private-bucket PDF). Promo preview + mismatch cover the contract. Document PDF titles in Gherkin + coverage-matrix (pass via promo/mismatch coverage note, or skip with reason).

   Keep `Update an event's capacity` unchanged. Comment that `newTotal` is the shared field or the sum of per-date capacities; the existing SHARED bump 10 → 15 test is enough.

   Do **not** add a Playwright test for a docs-only “coverage lists …” scenario.

   - **Rationale:** Step-plan titles. Separate mismatch from promo-preview so one is danger+reject and the other is happy-path match.
   - **Alternatives:** One mega-scenario (weaker matching); keep “no separate capacity field” (false).

2. **Labels in `e2e/fixtures/admin.ts`; fill Date & tickets only on step 2**
   - **Choice:** Add bilingual labels (proximity/`getByRole` / `getByLabel` only):

     ```ts
     timingMode: /^(zeitmodus|timing mode)\*?$/i,
     timingModeTimeSlot: /^(zeitfenster|time slot)$/i,
     timingModeAllDay: /^(ganztägig|all day)$/i,
     capacityAllocation: /^(kapazitätsverteilung|capacity allocation)\*?$/i,
     capacityAllocationShared: /gemeinsam für alle termine|shared across all dates/i,
     capacityAllocationPerDate: /^(pro termin|per date)$/i,
     rowCapacity: /^(kapazität|capacity)$/i, // per-row; not the required event-level "Kapazität*"
     totalCredits: /credits gesamt:|total credits:/i,
     totalCapacityLine: /kapazität gesamt:|total capacity:/i,
     totalInventory: /verfügbare codes\/tickets:|available codes\/tickets:/i,
     capacityInventoryMismatch: /kapazität und inventar stimmen nicht überein|capacity and inventory do not match/i,
     pasteCodes: /codes einfügen|paste codes/i,
     ```

     Keep `adminLabels.capacity` as `"Kapazität*"` for the event-level required number.

     - `createEventViaUI` already Nexts to step 2 before dates/capacity. Optionally accept `capacityMode` / per-row capacities later; default stays SHARED so existing tests stay green.
     - `fillNewEventRequiredFields` stays step 1; callers that touch Date & tickets MUST `clickEventFormNext` / `goToEventFormStep(2)` first (already true).
     - Per-row capacity: `getByLabel(adminLabels.rowCapacity)` / `getByRole("spinbutton", { name: adminLabels.rowCapacity })`, scoped to datetime rows. Do not use `adminLabels.capacity` (`Kapazität*`) for rows.

   - **Rationale:** Step plan: `goToEventFormStep(2)` before filling; existing helpers already walk the wizard. Distinct labels avoid colliding event-level vs per-row capacity.
   - **Alternatives:** `input[name=event_capacity_N]` (forbidden standing name-attribute exception); `data-testid` (forbidden).

3. **Field-order assertion is layout, not DOM source order**
   - **Choice:** Helper `expectLabelAbove(page, upper, lower)` using `boundingBox().y`. Compare Timing mode vs Capacity allocation vs ticket type vs Add datetime (or first date field). Inactive wizard steps are `hidden`/`inert` — only step-2 controls should be visible, so labels from step 1/3 must not match.
   - **Rationale:** BDD allows layout/`nth`; source-order in the full mounted form includes hidden steps.
   - **Alternatives:** CSS/flex selectors (forbidden); `compareDocumentPosition` on hidden nodes (false positives).

4. **Mismatch e2e asserts copy + reject, not danger color**
   - **Choice:** Visible totals text for 10 vs 7; click through to submit (Next to image, attach file, Anlegen) **or** submit from step 2 on clone if cheaper. Expect stay on form + mismatch message. Then paste 3 more codes (or set capacity to 7) and show submit can proceed. Do not `toHaveClass` / `toHaveCSS("color")`.
   - **Rationale:** Hard rule + `bdd-and-e2e.md`. Theme class is implementation.
   - **Alternatives:** Wrap totals in HeroUI `Alert` solely for `getByRole("alert")` (product-behavior change; out of scope unless a11y is the only way to assert — prefer the existing mapped error string on reject).

5. **Shared vs Per date persist: create then reopen edit step 2**
   - **Choice:** Shared: two rows, no per-row capacity locators (`rowCapacity` count 0), list `10/10` after save. Per date: set allocation, set default 5, add second row, set row capacities 4 and 6 via `rowCapacity` nth 0/1, submit, reopen edit step 2, expect those values and `Kapazität gesamt: 10` / `Total capacity: 10`. Range rebuild: set Per date + 8, fill start/end, generate; expect every visible `rowCapacity` value `"8"`.
   - **Rationale:** Step-plan numbers (4 and 6, default 8). Catalog already unit-tested this in 01; e2e proves the form posts it.
   - **Alternatives:** DB assertion via `DATABASE_URL` (allowed as supplement, not a substitute for visible form values).

6. **Voucher Gherkin rewrite; Playwright only for promo + mismatch**
   - **Choice:** Update all three voucher scenarios (promo, PDF split, PDF multi-file) in the feature file. Add Playwright for `Admin uploads promo codes with preview` (paste 10 codes, SHARED capacity 10, preview count + successful create) and `Capacity and inventory totals mismatch`. PDF split/multi-file: Gherkin + coverage-matrix note “behavior covered by promo preview + mismatch; dedicated PDF e2e deferred (private bucket)” **or** `skip` with that reason — do not implement a new PDF pipeline in this step.
   - **Rationale:** Step plan lists promo mismatch as the e2e example. PDF e2e is out of proportion for hardening.
   - **Alternatives:** Full PDF e2e (out of scope / expensive).

7. **Canonical docs — notes only; no new routes**
   - **Choice:**
     - `admin-events.feature`: add the new titles near other Date & tickets scenarios; rewrite voucher + defaults as in decision 1.
     - `schema-overview.md`: keep `capacity_mode` / `occurrence_capacities` table rows. Replace the voucher paragraph (“admin does not set capacity separately”) with: capacity allocation is authored; `total_capacity` must equal inventory count on a successful voucher save (mismatch reject); bookable quantity remains `min(remaining_capacity, available_inventory)`; remaining stays event-level.
     - `ui-component-map.md` Events row: Date & tickets order (Timing mode → Capacity allocation + capacity for every ticket type → ticket type / inventory → range builder + rows with per-row credits and per-row capacity when Per date; times only when Time slot) → totals (credits, datetime capacity, voucher inventory; theme danger when the last two disagree).
     - `gaps-and-decisions.md`: extend the multi-datetime row (or add a sibling): authored `capacity_mode` / `occurrence_capacities`; voucher capacity is visible and must match inventory; **booking remaining stays event-scoped** (not per datetime).
     - `coverage-matrix.md`: rows for every new title (`pass` or explicit R2/env skip). PDF titles: skip/deferred note as in decision 6.
   - **Rationale:** Parent release criteria. Canonical SoT is `docs/product/`.
   - **Alternatives:** New sitemap routes (none).

8. **OpenSpec main spec: add BDD requirement; do not rewrite 01–03 persist**
   - **Choice:** `openspec/specs/event-catalog/spec.md` already has capacity columns, All day, allocation UI, and totals. This change’s delta **ADDS** `Date & tickets BDD and docs` (locked Gherkin titles + Playwright verbatim + docs list) and voucher/default Gherkin-facing requirements. At apply time, merge those into main specs (same pattern as `Event wizard BDD and docs`). Do not duplicate persist scenarios already in main.
   - **Rationale:** Step plan “sync deltas from 01–03” is already true for persist/UI; this step syncs the **product Gherkin contract**.
   - **Alternatives:** Copy all 01–03 scenarios again (noise, archive conflict).

9. **Ladle: add Per date if cheap; do not duplicate Time slot / All day**
   - **Choice:** Keep `DateTicketsTimeSlot` and `DateTicketsAllDay`. Add `EventAdminForm / Date & tickets per date` with `initialStep={2}` and `defaults={{ capacityMode: "PER_OCCURRENCE" }}` if that already reveals per-row capacity. Skip a mismatch story unless defaults can feed `inventoryTotal` without voucher islands. No raw HTML in stories.
   - **Rationale:** Step plan “if the form story is cheap to extend.” Time slot vs All day already shipped in 02.
   - **Alternatives:** Story per mode × timing (four stories) — extra noise.

10. **`createVoucherPromoViaUI` must match capacity to code count**
    - **Choice:** The helper currently pastes two codes and leaves default capacity 10. After 03, that create should reject. Update it to set event-level capacity to `"2"` (or paste 10 codes) so `Clone voucher event requires inventory` stays green. Same for any other voucher create path.
    - **Rationale:** Hardening must not leave existing e2e red against shipped mismatch reject.
    - **Alternatives:** Leave helper broken (fails clone voucher test).

## Risks / Trade-offs

- **[Risk] `createVoucherPromoViaUI` still pastes 2 codes against capacity 10** → Mitigation: decision 10; run clone-voucher scenario in the same PR.
- **[Risk] Per-row `Kapazität` collides with event-level `Kapazität*`** → Mitigation: exact `rowCapacity` vs `adminLabels.capacity`; nth on datetime rows only.
- **[Risk] All day / Time slot labels collide with other “time” strings** → Mitigation: `getByLabel(adminLabels.timingMode)` then `selectOption`; hide-times asserts `getByRole("textbox", { name: adminLabels.eventTime })` count 0.
- **[Risk] Field-order `boundingBox` flaky on hidden steps** → Mitigation: assert after `expectEventFormStep(2)`; only visible labels.
- **[Risk] Mismatch submit never POSTs because step-3 image required** → Mitigation: walk to step 3, attach sample image, then Anlegen; R2 skip. Alternatively assert Next from step 2 still allowed (mismatch is server-side) — still must POST to see the error; include image.
- **[Risk] PDF voucher scenarios documented without dedicated e2e** → Mitigation: coverage-matrix skip/deferred note; promo + mismatch cover the capacity=inventory rule.
- **[Trade-off] No CSS danger assertion** → Acceptable; reject copy is the observable behavior.
- **[Trade-off] No booking per-slot remaining** → Parent non-goal.

## Migration Plan

1. Confirm 01–03 UI on create/edit/clone; smoke Date & tickets; Ladle Time slot / All day present.
2. Add labels in `e2e/fixtures/admin.ts`. Fix `createVoucherPromoViaUI` capacity vs code count.
3. Update `admin-events.feature` titles + voucher/default wording.
4. Add Playwright for the locked titles; keep existing Total credits / Update capacity / wizard tests.
5. Coverage matrix + schema-overview voucher paragraph + ui-component-map Events row + gaps-and-decisions.
6. Add Per date Ladle story if defaults support it.
7. Merge OpenSpec delta into `openspec/specs/event-catalog/spec.md` when applying (BDD requirement).
8. `bun run lint`; `bun run typecheck`; targeted `bun run test:e2e` for `e2e/specs/admin-events.spec.ts`.
9. Mark step 04 done and the feature released in the parent guide.
10. **Rollback:** revert the PR. 01–03 UI remains; docs/e2e go back to “no separate capacity field” (those docs would be stale against 03 UI).

## Open Questions

- None blocking. PDF voucher dedicated e2e stays deferred unless an existing private-bucket helper makes it cheap at apply time.
