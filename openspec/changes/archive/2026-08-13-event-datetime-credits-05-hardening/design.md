## Context

Parent feature: per-occurrence credits (`.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`), step 05 of 05 — docs and e2e after checkout slot booking (step 04 done).

Shipped runtime (do not reimplement):

- Catalog: `date_times[]` + `occurrence_credit_prices[]`; denormalized `date_time` / `credit_price` = primary/next.
- Admin create/edit/clone: add/remove rows with per-row credits + list total; range builder (start/end × time slots, rebuild-from-scratch); partner opening-hours default slots on create; closed-day skip. `ALLOW_MULTI_DATETIME_UI = true` still exported.
- Booking: `bookings.date_time`; `bookEvent({ dateTime })` charges that occurrence; checkout native `<select>` labeled `Datum und Uhrzeit` / `Date and time` for eligible members with ≥2 future slots.

Stale surfaces this step owns:

| Area | Current drift |
|---|---|
| `docs/product/features/admin-events.feature` | Add/remove exists but no per-row credits, total, range builder, or partner-hours defaults. Create still says a single “credit price”. |
| `docs/product/features/booking.feature` | “event-scoped; no datetime slot selection”; multi-datetime books “without a slot selection step”; ICS uses next upcoming. |
| `docs/product/features/event-discovery.feature` | Lists all datetimes on detail; no checkout dropdown / guest-omit-dropdown scenarios. |
| `schema-overview.md` | `occurrence_credit_prices` present; `events.date_time` still listed as ICS/email source; `bookings` has no `date_time`. |
| `gaps-and-decisions.md` | “Admin add/remove datetime UI is parked” / “MVP booking remains event-scoped”. |
| `ui-component-map.md` | Admin Events row does not mention per-row credits, range builder, or checkout slot select. |
| `coverage-matrix.md` | No rows for add/remove, range builder, partner hours, checkout dropdown, or slot booking. |
| `e2e/specs/admin-events.spec.ts` | `Scenario: Add and remove datetimes on create` is `test.skip(true, "…ALLOW_MULTI_DATETIME_UI=false")`. |
| OpenSpec `admin-events` | “Canonical Gherkin for the inline builder MAY wait for the parent feature’s hardening step.” |

Constraints: product SoT is `docs/product/` (`AGENTS.md`). BDD contract — proximity/layout selectors only; `test("Scenario: <exact Gherkin title>")`; native controls via `getByLabel`; no `data-testid`. Environment skips (`E2E_ADMIN_*`, R2, `DATABASE_URL`) stay named skips, not `@skip-no-ui`. No new product behavior beyond copy/a11y needed for those selectors. Parent locks 3–4 and 8 stay: capacity/inventory event-scoped; booking slot-scoped for time and credits only.

## Goals / Non-Goals

**Goals:**

- Canonical Gherkin matches shipped UI; Playwright titles match those Scenario lines verbatim.
- Unskip admin add/remove datetime e2e; extend it to fill per-row credits.
- Add Playwright for range builder, partner-hours defaults, checkout dropdown, and slot booking.
- Schema overview, gaps/decisions, UI map, and coverage matrix describe shipped behavior.
- Delete `ALLOW_MULTI_DATETIME_UI` together with the parked skip.
- Sweep fixtures/stories/comments that still say event-scoped booking or parked multi-datetime UI.
- Mark step 05 and the parent feature released.

**Non-Goals:**

- Per-slot capacity, remaining seats, or voucher inventory.
- Waitlist slot picker; waitlist join stays event-level.
- Partner portal / check-in.
- New admin routes (including `/admin/events/series/new`).
- Design-token or theme changes.
- EventCard / map price ranges.
- New catalog or booking domain logic (already shipped in 01–04).
- Rewriting historical `credit_ledger` rows.

## Decisions

1. **Gherkin titles are locked here so Playwright can match them verbatim**
   - **Choice:** Use these Scenario titles (punctuation and casing as written). Implementers MUST copy them into both the feature file and `test("Scenario: …")`.

   **`admin-events.feature` (keep existing add/remove; add the rest):**

   | Title | Intent |
   |---|---|
   | `Create a single event` | Keep; wording becomes “one or more dateTimes” and **credits per datetime** (not a single credit price). |
   | `Add and remove datetimes on create` | Keep title. Steps: add a second row, set distinct credits on each remaining row, remove one row, submit; persist remaining datetimes **and** their credits. |
   | `Per-datetime credits persist` | Two rows priced 1 and 3; stored `occurrence_credit_prices` match; denormalized `credit_price` is the primary/next slot. |
   | `Total credits shown on the form` | Rows priced 2 and 5 → visible “Credits gesamt: 7” / “Total credits: 7” (existing `dateTimesTotalCreditsLabel`). |
   | `Edit datetimes inplace` | Keep; rows include each row’s credits. |
   | `Range and two time slots generate a grid` | Start/end + two time slots (different credits) produce date × time rows with those prices. |
   | `Changing the end date rebuilds from scratch` | After a generated list + a manual extra row, changing end date replaces the list (manual row gone). |
   | `Create prefills slots from partner open times` | New-event form + partner with published hours → builder default time slot is that partner’s distinct `open` time. |
   | `Closed weekdays omitted from expansion` | Range over a closed weekday omits that day. |

   **`booking.feature`:**

   | Title | Intent |
   |---|---|
   | `Successful booking` | Drop “(event-scoped; no datetime slot selection)”. Charge **selected occurrence** credits × qty; capacity still event-level. Single-slot events need no dropdown. |
   | `Book a priced datetime slot` | **Replace** `Book event with multiple datetimes`. Eligible member picks a non-primary future slot, books, charged that slot’s credits; confirm/ICS use `bookings.date_time`. |
   | `Post-booking actions` | ICS / confirm / email time fields use the **booked** datetime, not next upcoming. |

   **`event-discovery.feature`:**

   | Title | Intent |
   |---|---|
   | `Dropdown changes credits` | Eligible member, morning 1 / evening 4; choosing evening updates checkout total to 4 per ticket. |
   | `Guest checkout omits slot picker` | Guest on the same event: no datetime dropdown, no credit totals (existing guest chrome). |
   | `Event card shows next upcoming datetime` | Keep. Cards still next upcoming + denormalized `credit_price` (no price range). |
   | `Detail lists multiple datetimes` | Keep DETAILS listing; checkout dropdown is a separate scenario. |

   - **Rationale:** Step plan + BDD contract. Titles reuse OpenSpec scenario names from steps 02–04 where they already exist so archive merge stays clean.
   - **Alternatives:** Invent shorter e2e-only titles (rejected — contract forbids parallel titles).

2. **Which new Gherkin gets Playwright vs coverage-matrix skip**
   - **Choice:** Every new/changed Scenario above MUST appear in `coverage-matrix.md`. Playwright **must run** (env-skip only) for:
     - `Add and remove datetimes on create` (unskip; fill per-row credits)
     - `Per-datetime credits persist` (may be asserted inside add/remove **only if** the Gherkin title still has its own `test("Scenario: …")` — prefer a dedicated test)
     - `Range and two time slots generate a grid`
     - `Create prefills slots from partner open times`
     - `Dropdown changes credits`
     - `Guest checkout omits slot picker`
     - `Book a priced datetime slot`
     - Existing `Successful booking` / `Post-booking actions` — update assertions (ICS/confirm time) without renaming unless Gherkin title stays the same
   - `Total credits shown on the form`, `Changing the end date rebuilds from scratch`, and `Closed weekdays omitted from expansion` SHOULD have Playwright when the island is assertable with `getByLabel` / `getByText`. If a scenario is too timing-flaky for CI (live rebuild), record `skip` in the coverage matrix with reason “covered by `admin-event-form.test.ts` / island unit tests” — **not** `@skip-no-ui`.
   - **Rationale:** Step plan names those five e2e themes; BDD still wants a matrix row for every Gherkin scenario.
   - **Alternatives:** Skip all new admin scenarios except add/remove (fails parent release criteria).

3. **Unskip add/remove; delete `ALLOW_MULTI_DATETIME_UI`**
   - **Choice:** Remove `test.skip(true, "Multi-datetime admin UI parked…")`. Keep `test.skip(!r2Configured(), …)` and admin-credential skips. Extend the test to fill `getByLabel` Credits on each datetime row (`nth` is allowed). After submit, assert remaining dates **and** that edit form still shows those credit values. Then delete `ALLOW_MULTI_DATETIME_UI` and every branch that reads it (`admin-event-form.ts`, island early-returns, comments). Grep must be clean in `apps/`, `packages/`, `e2e/`, `docs/product/`.
   - **Rationale:** Step 02 kept the flag specifically so this step could delete it with the skip.
   - **Alternatives:** Leave the constant `true` forever (dead gate).

4. **Admin e2e: native labels already exist — fix a11y only if `getByLabel` fails**
   - **Choice:** Datetime rows: date `Datum`/`Date`, time `Uhrzeit`/`Time`, credits `Credits` (`EventAdminCreditInput` + `htmlFor`). Range builder: `range_start` / `range_end` labeled `builderStartLabel` / `builderEndLabel`; time slots reuse time + credits labels. Add datetime: button `Termin hinzufügen` / `Add datetime`. Checkout: `getByLabel(/datum und uhrzeit|date and time/i)`. Duplicate “Credits” labels on a row vs builder: scope with `.filter({ has })` / `nth` on the datetime list vs the builder block (proximity), not `input[name=event_credit_N]`.
   - If a control has no accessible name, add a HeroUI `Label` + `htmlFor` (copy/a11y only). Do not add `data-testid`.
   - **Rationale:** BDD §3–4; CHARTER gap G7 is not an excuse to expand name-attribute locators.
   - **Alternatives:** `page.locator('input[name=event_credit_0]')` (forbidden standing exception).

5. **Seeding multi-slot events for discovery/booking e2e**
   - **Choice:** Prefer creating the multi-slot event through admin UI in admin specs (already the add/remove pattern). For discovery/booking, add a small DB helper (or reuse catalog `createEvent` / update with two future `dateTimes` + mixed `occurrenceCreditPrices`) behind `DATABASE_URL`, same as other booking seeds. Do **not** change demo seed titles that existing tests depend on unless a dedicated multi-slot demo event is clearly named and documented in `DEPLOYMENT.md`.
   - Morning vs evening: use two future Europe/Berlin instants the same calendar day (or consecutive days) with prices 1 and 4 to match `Dropdown changes credits`.
   - **Rationale:** Avoid breaking SECRET_CODE demo titles; admin create already needs R2.
   - **Alternatives:** Always create via admin UI from booking tests (slow, needs `E2E_ADMIN_*` on booking file — acceptable as extra skip, but a db helper is faster).

6. **Schema overview + gaps + UI map (docs only)**
   - **Choice:**
     - `events.date_time` notes: used for feed sort, cards, map popups, admin list primary cell. **Remove** “ICS/email calendar fields”.
     - `events.credit_price`: denormalized primary/next occurrence price; cards/feed/map still read this column (not a range).
     - `bookings`: add `date_time timestamptz NOT NULL` — booked occurrence instant; confirm / ICS / email / ticket card read this. Historical backfill from `events.date_time`.
     - Gaps row: replace parked/event-scoped text with shipped model (admin list + range builder + partner-hours defaults; member slot picker; capacity still event-scoped; waitlist still event-scoped). Keep clone-vs-series row; it already allows an inline builder.
     - UI map Events row: per-row credits, list total, range builder on create/edit/clone, partner-hours default slots on create. Event detail checkout: native datetime `<select>` for eligible members when ≥2 future occurrences.
   - **Rationale:** Agents read these files first; leaving ICS on `events.date_time` would undo step 04.
   - **Alternatives:** Only update Gherkin (rejected — schema overview is the DB SoT).

7. **OpenSpec mirror**
   - **Choice:** This change’s delta specs are the planning contract. After apply, merge them into `openspec/specs/{admin-events,booking,event-discovery}/spec.md` if those files still say Gherkin “MAY wait” or omit product-doc requirements. Do **not** invent an `event-catalog` delta unless schema-overview notes still contradict step 01 (they already list `occurrence_credit_prices`). Canonical SoT remains `docs/product/`.
   - **Rationale:** Step plan optional sync; AGENTS.md says ignore `openspec/specs/` for product behavior.
   - **Alternatives:** Skip OpenSpec main specs entirely (fine if apply/archive still copies deltas).

8. **Copy / a11y only when selectors fail**
   - **Choice:** Do not change DE/EN marketing copy. If Playwright cannot `getByLabel` the checkout select or per-row credits, add/fix `Label htmlFor` and ensure `datetimeLabel` is passed into `EventDetailCheckoutCard` (already in content modules). Range builder labels stay as shipped.
   - **Rationale:** Step plan: no new product behavior beyond copy/a11y for proximity selectors.

## Risks / Trade-offs

- **[Risk] Duplicate “Credits” labels** on datetime rows and range time slots confuse `getByLabel` → Mitigation: scope to the Termine list vs Zeitfenster block with `getByText` / layout filter; `nth` allowed.
- **[Risk] Range-builder live rebuild is an island** — Playwright may race → Mitigation: `waitFor` row count after filling start/end; if flaky, matrix-skip rebuild/closed-day and rely on unit tests.
- **[Risk] Booking/discovery tests need a mixed-price multi-slot event** → Mitigation: db helper with two future ISO instants; env-skip without `DATABASE_URL`.
- **[Risk] ICS assertion timezone** — confirm page formats Europe/Berlin → Mitigation: assert the booked slot’s Berlin date/time text, not raw ISO.
- **[Risk] Grep leftovers** (`ALLOW_MULTI_DATETIME_UI`, “event-scoped”, “parked”) in comments/stories → Mitigation: sweep `apps/`, `packages/`, `e2e/`, `docs/product/`; archive/history exempt.
- **[Trade-off] Not every Gherkin scenario gets a dedicated e2e** (total credits / rebuild / closed-day may skip) → Acceptable if matrix names the skip and unit tests exist.
- **[Trade-off] No new demo seed event** unless existing seeds cannot express two future slots → Prefer helper over changing TARTUFFE-style titles.

## Migration Plan

1. Diff shipped UI vs step 01–04 spec deltas; list Gherkin drift (this design’s title table is the target).
2. Update the three feature files to the locked titles; then Playwright (unskip + new tests) so titles never diverge.
3. Update schema-overview, gaps-and-decisions, ui-component-map, coverage-matrix.
4. Delete `ALLOW_MULTI_DATETIME_UI`; sweep comments/fixtures.
5. Run `bun run lint`, `bun run typecheck`, targeted e2e.
6. Mark step 05 done and the feature released in the parent guide.
7. Rollback: revert the docs/e2e PR. No schema migration in this step.

## Open Questions

- None blocking. If `Total credits shown on the form` or rebuild/closed-day e2e is flaky in CI, skip via coverage matrix with a pointer to existing unit tests — do not use `@skip-no-ui`.
