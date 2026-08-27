## Context

See `proposal.md` for motivation. Parent feature: one ticket per occurrence (`.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`), step 03 of 03 — Gherkin, Playwright, canonical docs, dead qty UI. Canonical product behavior is `docs/product/`; `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria (steps 01–02 done / archived):

- Partial unique index on `bookings (user_id, event_id, date_time)` WHERE `status IN ('CONFIRMED', 'USED')`.
- `bookEvent` / waitlist / admin comp persist `tickets_count` / `requested_qty = 1`; `ALREADY_BOOKED` on a second active occurrence.
- Qty steppers gone from live checkout; datetime `<select>` remains for ≥2 future slots.
- Eligible members see locked already-booked copy + My Tickets on detail overlay and book `view="already_booked"`.
- Unused `apps/web/app/islands/TicketCountSelect.tsx` still on disk (nothing imports it).

What remains is the **verification and documentation layer**. Product SoT still describes multi-qty checkout (guest cap of 3, credits × ticket count, “increase tickets”). Playwright still asserts `Anzahl Tickets` / `increase tickets` and the `confirmBooking` helper still uses `?qty=`.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim (`docs/product/testing/bdd-and-e2e.md`); proximity selectors only (`getByRole` / `getByText` / `getByLabel`); no `data-testid`; copy MUST stay verbatim from the parent guide; do not start another feature; do not change credit-capacity math beyond the one-ticket rule already shipped.

## Goals / Non-Goals

**Goals:**

- Bind Gherkin, Playwright, schema overview, i18n inventory, sitemap, UI map, gaps log, and coverage matrix to one ticket per occurrence + already-booked UI.
- Remove leftover qty stepper tests and unused `TicketCountSelect` / `?qty=` plumbing.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- Changing `bookEvent`, uniqueness, already-booked chrome, or credit/capacity formulas.
- Partner portal / check-in; per-hour waitlists; rewriting historical `tickets_count > 1` rows.
- New theme tokens, new routes, or a second Gherkin scenario that is only about reading markdown.
- Treating `openspec/specs/` as product SoT.

## Decisions

1. **Gherkin first, then Playwright titles, then matrix, then dead code, then close-out**
   - **Choice:** Update `booking.feature` / `event-discovery.feature` / `waitlist.feature` → retitle and rewrite Playwright to match verbatim → coverage-matrix rows → schema/i18n/sitemap/UI map/gaps → delete `TicketCountSelect` and unused `?qty=` → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; avoid matrix title drift. Same order as subscription-invoice-email-03 / featured-events-manager-03.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **Locked product Gherkin titles (booking owns already-booked)**
   - **Choice:** In `booking.feature`:
     - Replace `Member ticket quantity follows credits and capacity` with **`Member cannot select more than one ticket`**.
     - Add **`Reopening a booked single-slot event`** and **`Booked hour on a multi-hour event`** (step 02 titles; both cover “already booked points to My Tickets”).
     - Keep **`Multi-ticket promo codes are listed separately`** for grandfathered `booking_tickets` (seed/DB fixture, not a qty control).
     - Keep other existing titles (`Successful booking`, `Book a priced datetime slot`, sold-out, credits, …). Rewrite Background and Then steps so a successful booking is one ticket (credits × 1, capacity − 1); drop “select greater than 3” / universal hard max of 3.
     - Do **not** add a third already-booked Scenario titled `Already booked points to My Tickets` (would force a duplicate Playwright title).
   - In `event-discovery.feature`:
     - Rename `Booking-eligible member sees tickets, credits and date on event detail` → **`Booking-eligible member sees credits and date on event detail`**. Then: credit total for one ticket, no quantity stepper; keep DETAILS Date chrome.
     - Keep `Dropdown changes credits`; Then: **4 credits for one ticket** (not “per ticket”).
     - Do **not** put already-booked scenarios here (same checkout card; booking e2e owns them).
   - In `waitlist.feature`: keep Scenario titles. Change Background / Join / promotion **steps** so there is no requested-qty picker and join/promote is qty 1. Sold-out Background: remaining capacity is 0 (not “less than my requested ticket count”).
   - **Rationale:** Step 03: already-booked matching step 02 titles; discovery for “no quantity stepper on eligible checkout”; file-mapping requires one Playwright test per Scenario.
   - **Alternatives:** Keep the old “sees tickets, credits and date” title (implies qty controls). Put already-booked only in discovery (splits the checkout card across two specs).

3. **Playwright: retitle, drop qty locators, add already-booked**
   - **Choice:**
     - `e2e/specs/booking.spec.ts`:
       - Retitle the qty test to `Scenario: Member cannot select more than one ticket`. Assert **no** `getByRole("button", { name: /ticket mehr|increase tickets/i })` and **no** `getByLabel(/anzahl tickets|ticket count/i)` on detail (and book if opened). Credit total equals one slot price.
       - Add `Scenario: Reopening a booked single-slot event`: book once (fixed helper), reopen detail **and** `/book`, assert locked copy (`Du hast das bereits gebucht…` / `You've already booked this…` via `locale`) and `getByRole("link", { name: /meine tickets|my tickets/i })` pointing at `/:locale/bookings`; no confirm-booking button / book CTA.
       - Add `Scenario: Booked hour on a multi-hour event`: `createPricedSlotEvent`, book morning, reopen with morning selected → already-booked; select evening → book CTA returns; confirm evening booking succeeds.
       - Fix `confirmBooking`: drop `?qty=` and `getByLabel(/anzahl tickets|ticket count/i)`. Confirm via the existing confirm-booking button + `/book/confirm`.
     - `e2e/specs/event-discovery.spec.ts`:
       - Retitle eligible-checkout test to `Scenario: Booking-eligible member sees credits and date on event detail`. Drop `increase tickets` visibility. Assert credit total + Date chrome; `increase tickets` / ticket-count label have count 0.
       - Guest checkout: replace `increase tickets` absence with `getByLabel(/anzahl tickets|ticket count/i)` count 0 (grep must not find “increase tickets” in booking/discovery specs).
       - `Dropdown changes credits`: total is 4 credits for one ticket (existing `getByText` credit assertion; no qty stepper).
     - `waitlist.spec.ts`: no title change unless a `Scenario:` line changes. Do not add a qty picker assertion.
     - Selectors: `getByRole` / `getByText` / `getByLabel` / filter / nth only. No `data-testid`.
   - **Rationale:** BDD contract; step verification; helper still books qty 1 after the UI control is gone.
   - **Alternatives:** Skip already-booked e2e (violates file-mapping once Gherkin exists). Keep `increase tickets` as a negative assertion (fails the step’s grep).

4. **Coverage matrix rows match new titles; no `@skip-no-ui`**
   - **Choice:**
     | Feature | Scenario | Spec | Status | Notes |
     |---|---|---|---|---|
     | `booking.feature` | Member cannot select more than one ticket | `e2e/specs/booking.spec.ts` | `pass` | Needs `DATABASE_URL`; no qty control; credit total = one slot |
     | `booking.feature` | Reopening a booked single-slot event | `e2e/specs/booking.spec.ts` | `pass` | Needs `DATABASE_URL`; detail + book already-booked copy |
     | `booking.feature` | Booked hour on a multi-hour event | `e2e/specs/booking.spec.ts` | `pass` | Needs `DATABASE_URL`; `createPricedSlotEvent`; evening still books |
     | `event-discovery.feature` | Booking-eligible member sees credits and date on event detail | `e2e/specs/event-discovery.spec.ts` | `pass` | Retitled; no quantity stepper |

     Remove any row that still named `Member ticket quantity follows credits and capacity` if one is added later; today that scenario is **missing from the matrix** while the e2e test exists — close the gap with the new title, do not leave a ghost row.
   - **Rationale:** File-mapping; already-booked is UI and must `pass`, not skip.
   - **Alternatives:** Skip already-booked as “needs fixture” (the booking helper + priced-slot fixture already exist).

5. **Canonical docs: uniqueness + copy + book-route note**
   - **Choice:**
     - `schema-overview.md` `tickets_count`: new writes are always `1`; grandfathered `> 1` rows remain. Add constraint: partial unique index `bookings (user_id, event_id, date_time)` WHERE `status IN ('CONFIRMED', 'USED')`.
     - `content-i18n-inventory.md`: section **Booking checkout — already booked** (not a `translations.ts` key if runtime lives in `booking-content.ts`) with verbatim DE/EN message + `Meine Tickets` / `My Tickets`; cite `apps/web/app/lib/booking-content.ts`.
     - `sitemap.md`: `/events/:id/book` note = one ticket; already-booked message + My Tickets when the selected hour is held (not “ticket quantity”).
     - `ui-component-map.md` Event detail: eligible checkout = datetime select when ≥2 future slots, one-ticket credit total, book CTA **or** already-booked overlay; no qty stepper; guests omit qty/credits/date chrome.
     - `gaps-and-decisions.md`: replace the “member qty = min(floor(credits ÷ price), capacity), no hard max of 3” row with one ticket per occurrence + already-booked copy (cite booking + event-discovery + waitlist features).
   - **Rationale:** Step deliverables; agents reading `docs/product/` must see shipped behavior.
   - **Alternatives:** Only Gherkin (schema/i18n still lie). Invent `translations.ts` keys that do not exist.

6. **Dead qty UI: delete island; drop `?qty=`; keep `maxQty` as 0|1 bookability**
   - **Choice:** Delete `TicketCountSelect.tsx` if still unimported. Remove `parseQtyParam` / `c.req.query("qty")` from `book.tsx` and stop threading a default ticket count into the form. Update `post-auth-redirect` / `auth-redirect` tests that keep `?qty=1` in return URLs. Drop `clampQty` if it only existed for the stepper. **Keep** `CheckoutOccurrence.maxQty` / `maxBookableTickets` returning `0` or `1` as “can this slot be booked?” — that is not a qty picker.
   - **Rationale:** Step: delete unused island; drop dead qty query params **if unused**. `maxQty` is still the eligibility cap from step 01.
   - **Alternatives:** Also rename `maxQty` → `canBook` (churn, out of scope). Leave `TicketCountSelect` (parent called it out for this step).

7. **OpenSpec mirror vs product SoT**
   - **Choice:** This change’s booking / event-discovery / waitlist deltas are the planning contract for Gherkin + e2e + docs. Apply updates `docs/product/` as SoT. Do not hand-edit `openspec/specs/` during apply unless archive is not used. Domain uniqueness and already-booked chrome already live in main OpenSpec specs from steps 01–02; this delta binds **canonical Gherkin/Playwright/docs**.
   - **Rationale:** AGENTS.md; step Cleanup.
   - **Alternatives:** Sync OpenSpec only — agents would still follow stale Gherkin.

## Risks / Trade-offs

- **[Risk] Stale “increase tickets” / guest cap of 3 / credits × qty survives in an unlisted file** → Mitigation: grep `docs/product/features/{booking,event-discovery,waitlist}.feature` and `e2e/specs/{booking,event-discovery}.spec.ts` after edits (see tasks). `user-journeys.md` waitlist “requested quantity” is out of this step’s file list — do not expand unless the same sentence is copied into a scoped file.
- **[Risk] `confirmBooking` still waits on `Anzahl Tickets` → all booking e2e fail** → Mitigation: fix the helper in the same PR as Gherkin, before adding already-booked tests that reuse it.
- **[Risk] ISO / hour-select flake on multi-hour already-booked** → Mitigation: reuse `createPricedSlotEvent` + `getByLabel(/datum und uhrzeit|date and time/i)` like `Book a priced datetime slot`; assert copy with `getByText` of the locked sentence.
- **[Risk] Grandfathered multi-ticket display scenario is deleted by accident** → Mitigation: keep `Multi-ticket promo codes are listed separately`; it is display of `booking_tickets`, not a qty control.
- **[Trade-off] Renaming the discovery eligible-checkout Scenario** → One matrix + Playwright retitle; clearer than leaving “tickets” in the title.
- **[Trade-off] Guest tests no longer mention “increase tickets” even as a negative** → Required by the step grep; assert missing ticket-count label instead.

## Migration Plan

1. Land Gherkin + Playwright + docs + dead-code deletion together. No schema/API migration, no new secrets.
2. Existing bookings and already-booked UI from steps 01–02 are unchanged.
3. Rollback: revert the docs/e2e/dead-code commit; uniqueness and already-booked chrome remain.
4. After merge: mark step 03 + parent guide done (feature released); archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — runtime is shipped; Gherkin titles are locked in Decisions.)_
