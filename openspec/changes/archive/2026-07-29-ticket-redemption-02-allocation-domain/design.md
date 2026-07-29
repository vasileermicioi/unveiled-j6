## Context

Parent feature: Ticket Redemption (`.dev-plan/current-iteration/ticket-redemption-parent-guide.md`). Step 01 shipped schema (`event_voucher_codes`, `event_voucher_pdfs`, `booking_tickets`) and a booking shim that throws `VOUCHER_INVENTORY_PENDING` for voucher types. SECRET_CODE still books via `resolveRedemption` writing only booking-level `redemption_*` (no `booking_tickets` rows).

This step wires **atomic per-ticket allocation** into `bookEvent` and **inventory restock** into admin cancel so steps 03–04 can stock and display redemptions.

Constraints from AGENTS.md / parent guide:

- Booking domain is the only writer of purchase bookings/ledger; waitlist promotion and admin comps call `bookEvent`.
- No business logic in route files; no new schema tables expected.
- Effective bookable qty for voucher types = `min(remaining_capacity, available_inventory)`.
- Cancel returns unused inventory to `AVAILABLE`; credits are never auto-refunded on cancel.

## Goals / Non-Goals

**Goals:**

- Export allocation helper(s) from `@unveiled/db` booking package.
- Inside `bookEvent`’s transaction: create exactly N `booking_tickets`, allocate inventory for voucher types, denormalize first-ticket summary onto `bookings.redemption_*`.
- Gate on insufficient inventory with a typed `BookingError`; roll back all mutations.
- Admin cancel restocks promo/PDF inventory for cancelled `CONFIRMED` bookings.
- Readers (`listUserBookings` and booking-by-id helpers used by confirm/admin) can load `booking_tickets`.
- Unit + integration coverage for SECRET_CODE, VOUCHER_PROMO, VOUCHER_PDF, sold-out-by-inventory, idempotency, cancel restock.
- Remove `VOUCHER_INVENTORY_PENDING` from the happy path (delete or leave unused).

**Non-Goals:**

- Admin promo CSV / PDF upload UI (03).
- Member masked reveal / PDF download UI (04).
- Product Gherkin / schema-overview rewrites (05).
- Partner check-in / marking tickets `USED` (post-MVP) — only reserve the “do not restock if USED” rule.
- Dropping booking-level `redemption_*` columns.
- Email attachment of PDFs.

## Decisions

1. **Allocation API shape**
   - **Choice:** Implement `allocateRedemptionTickets(tx, { event, bookingId, ticketsCount })` (name flexible) that returns `{ tickets: BookingTicket[]; summary: RedemptionResult }` where `summary` is ticket ordinal 1’s redemption for booking-level columns. Call it from `bookEvent` after the booking row is inserted (needs `bookingId`) and before commit. Keep a thin `resolveSecretCode(event)` (or keep `resolveRedemption` SECRET_CODE-only) for the shared-code path used inside the allocator.
   - **Rationale:** Single place for locking/inventory rules; bookEvent stays orchestration; waitlist/comp inherit automatically.
   - **Alternatives:** Inline allocation in `bookEvent` (harder to test); allocate before insert with temp ids (awkward with FKs).

2. **Insert order (circular FK)**
   - **Choice:** Within the open transaction: lock event (+ user as today) → eligibility/capacity/credits → **inventory availability check + row locks** → insert booking → insert N `booking_tickets` → update locked inventory rows to `ALLOCATED` with `booking_ticket_id` set → set booking `redemption_*` from ticket 1 (either on insert with known summary for SECRET_CODE, or update booking after allocation for vouchers). Preferred concrete sequence for vouchers:
     1. `SELECT … FROM event_voucher_* WHERE event_id = ? AND status = 'AVAILABLE' ORDER BY created_at, id FOR UPDATE SKIP LOCKED LIMIT N`
     2. If `rows.length < N` → throw (no mutations yet if this runs before capacity/credit writes — see Decision 4).
     3. Apply capacity/credit updates + insert booking.
     4. Insert N tickets (promo: `redemption_code` = code text, `redemption_url` = `event.eventWebsiteUrl`; PDF: `voucher_pdf_id` = inventory id, codes/URLs null).
     5. Update each inventory row: `status = ALLOCATED`, `booking_ticket_id = ticket.id`.
   - **Rationale:** Matches step 01 decision that inventory owns the allocation pointer; SKIP LOCKED avoids wait-die under concurrent bookings.
   - **Alternatives:** `FOR UPDATE` without SKIP LOCKED (more contention); allocate after capacity decrement then unlock on failure (worse — prefer check+lock before mutating capacity when possible).

3. **When to lock inventory relative to capacity/credits**
   - **Choice:** After locking the event row and validating subscription/capacity/credits **counts**, lock inventory rows **before** mutating capacity/credits/booking. If inventory is short, throw without writes. If capacity/credits fail first, never touch inventory.
   - **Rationale:** Keeps “no partial mutation” for insufficiency; event row lock already serializes capacity.
   - **Alternatives:** Mutate capacity then allocate (forces compensating updates on inventory miss).

4. **Insufficient inventory error code**
   - **Choice:** Add `BookingErrorCode` `INSUFFICIENT_VOUCHER_INVENTORY`. Do **not** overload `SOLD_OUT` in the domain (capacity remains `SOLD_OUT`). UI steps MAY map both to a sold-out / waitlist offer later; this step only needs a stable typed code for tests and route mapping. Remove use of `VOUCHER_INVENTORY_PENDING`.
   - **Rationale:** Parent effective-capacity rule is UX; domain clarity helps diagnostics and avoids mis-routing waitlist when inventory is empty but capacity remains.
   - **Alternatives:** Reuse `SOLD_OUT` for one member-facing message (acceptable if product insists — then document route mapping only).

5. **Booking-level `redemption_*` denormalization**
   - **Choice:** Keep writing `bookings.redemption_type`, `redemption_info`, `redemption_url` from **ticket ordinal 1** after allocation (SECRET_CODE: shared secret; VOUCHER_PROMO: first code + website URL; VOUCHER_PDF: type `VOUCHER_PDF`, `redemption_info` null or page label if present, `redemption_url` null until 04 builds download URLs).
   - **Rationale:** Ticket brief prefers first-ticket summary for minimal UI churn until 04.
   - **Alternatives:** Null booking-level fields and force all UI to tickets (more churn now).

6. **SECRET_CODE writes N ticket rows (no inventory)**
   - **Choice:** For every successful SECRET_CODE booking, insert N `booking_tickets` with identical `redemption_code = event.secretCode`, null PDF id, null URL. No inventory tables touched.
   - **Rationale:** Spec delta + uniform read model for My Tickets / confirm.
   - **Alternatives:** Only voucher types get ticket rows (splits read paths).

7. **Idempotent retry**
   - **Choice:** Keep existing early return when `(userId, idempotencyKey)` booking exists — return that booking with `created: false` **without** re-running allocation. Ensure first successful path always wrote tickets + inventory before commit so retries see a complete booking. Readers that need tickets load them by `booking_id`.
   - **Rationale:** Existing idempotency contract; double-allocate would steal inventory.
   - **Alternatives:** On retry, reconcile missing tickets (overkill if transaction is atomic).

8. **Cancel restock**
   - **Choice:** In `cancelBookingAsAdmin` transaction, after confirming `CONFIRMED` and locking booking/event: load `booking_tickets` for the booking; for each linked `event_voucher_codes` / `event_voucher_pdfs` row (`booking_ticket_id` in ticket ids OR join), set `status = AVAILABLE`, `booking_ticket_id = null`; clear ticket `redemption_code` / `redemption_url` / `voucher_pdf_id` so cancelled bookings do not keep live codes that were returned to the pool; then cancel booking + restore capacity as today; waitlist processing unchanged after commit.
   - **Rationale:** Parent risk: cancel → inventory resellable; clearing ticket payload avoids two members showing the same live promo code.
   - **Alternatives:** Keep historical codes on cancelled tickets (support-friendly but confusing if codes are reused).

9. **USED / non-CONFIRMED**
   - **Choice:** No restock path for non-`CONFIRMED` (existing reject). Document that when check-in later sets `USED`, cancel remains disallowed so inventory stays retired.
   - **Rationale:** Matches ticket “unless USED”.
   - **Alternatives:** Explicit restock skip branch for USED (dead code today).

10. **Readers**
    - **Choice:** Extend `listUserBookings` result items with `tickets: BookingTicket[]` (batch-load by booking ids on the page). Add or extend a `getBookingById` / confirm loader similarly if one exists; otherwise export `listBookingTickets(db, bookingId)` for routes. Do not change SSR page chrome this step beyond what typecheck requires.
    - **Rationale:** Step brief “read API for later UI”.
    - **Alternatives:** Only raw SQL in routes (violates domain boundary).

11. **`maxBookableTickets` inventory awareness**
    - **Choice:** Extend input with optional `availableInventory: number | null`. When non-null (voucher types), max = `min(existing max, availableInventory)`. SECRET_CODE / callers omit or pass null → capacity/credits only. Server `bookEvent` remains authoritative.
    - **Rationale:** Parent effective-capacity rule; cheap UX alignment without waiting for 04.
    - **Alternatives:** Leave UX helper unchanged until UI step (acceptable fallback if call sites are unclear).

12. **PDF downloadable URL at allocation time**
    - **Choice:** Store `voucher_pdf_id` on the ticket; do not require `@unveiled/db` to compose public R2 URLs. Step 04 builds download links from inventory `object_key` + `IMAGE_PUBLIC_BASE_URL` (or a small images helper).
    - **Rationale:** Keeps db package free of hosting config; ticket allows “object key/URL”.
    - **Alternatives:** Pass public base URL into allocator (couples env into booking domain).

13. **Comp tickets / waitlist**
    - **Choice:** No special cases — same allocator. Comps with `skipCreditCharge` still consume inventory and capacity.
    - **Rationale:** Inventory is real seat stock for voucher events.
    - **Alternatives:** Comps skip inventory (rejected — would oversell codes/PDFs).

## Risks / Trade-offs

- **[Risk] Concurrent bookings race on same AVAILABLE rows** → Mitigation: `FOR UPDATE SKIP LOCKED` + count check; integration test with two sequential allocations at least; optional stress later.
- **[Risk] Inventory empty while `remaining_capacity` > 0** → Mitigation: typed `INSUFFICIENT_VOUCHER_INVENTORY`; `maxBookableTickets` optional inventory; admin UI (03) should stock before publish (out of scope).
- **[Risk] Cancel clears ticket codes members might still view** → Mitigation: cancelled bookings are not the member happy path; 04 can show cancelled state without codes.
- **[Risk] Idempotent early-return omits tickets in response type** → Mitigation: document that callers needing tickets must load by booking id; optionally enrich retry return in bookEvent with tickets query (nice-to-have).
- **[Trade-off] Distinct inventory error vs SOLD_OUT** → Routes/waitlist may need mapping in a later step; domain stays precise.
- **[Trade-off] openspec ≠ product SoT** → Deltas here; `docs/product/` in step 05.

## Migration Plan

1. Implement allocator + wire `bookEvent` + errors + exports.
2. Update cancel restock + readers + optional `maxBookableTickets`.
3. Replace obsolete redemption unit tests; add allocation/cancel integration coverage (seed inventory in-test).
4. `bun run lint`, `bun run typecheck`, `bun test packages/db`.
5. Manual/scripted: 2 promo codes → book 2 → ALLOCATED → cancel → AVAILABLE.
6. Mark step 02 done in parent guide; note error codes for UI localization.
7. Rollback: revert code deploy; allocated rows in prod would need manual SQL if rolled back after traffic — prefer ship before stocking real voucher events in admin (03).

## Open Questions

- None blocking. If product later wants inventory shortfall to offer waitlist the same as capacity `SOLD_OUT`, map `INSUFFICIENT_VOUCHER_INVENTORY` in the book route during 04/05 — do not change domain semantics in this step without an explicit ask.
