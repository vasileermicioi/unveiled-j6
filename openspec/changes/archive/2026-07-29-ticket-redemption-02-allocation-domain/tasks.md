## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/ticket-redemption-02-allocation-domain.md`, parent guide, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites from step 01: inventory tables + `booking_tickets` schema, `VOUCHER_INVENTORY_PENDING` shim in `resolveRedemption`, `bookEvent`, `cancelBookingAsAdmin`, waitlist/comp call sites

## 2. Allocation helpers and errors

- [x] 2.1 Add `BookingErrorCode` `INSUFFICIENT_VOUCHER_INVENTORY`; stop using `VOUCHER_INVENTORY_PENDING` on the booking path (remove code if unused)
- [x] 2.2 Implement `allocateRedemptionTickets(tx, …)` (or equivalent) with `FOR UPDATE SKIP LOCKED` for `VOUCHER_PROMO` / `VOUCHER_PDF`, and SECRET_CODE path that writes N ticket rows with the shared `secret_code` (no inventory)
- [x] 2.3 Return first-ticket summary suitable for `bookings.redemption_*`; export helpers from `packages/db/src/booking/index.ts`

## 3. Wire bookEvent

- [x] 3.1 Replace `resolveRedemption`-only voucher reject with allocation inside `bookEvent`’s transaction (lock inventory before mutating capacity/credits; insert booking → tickets → mark inventory `ALLOCATED`)
- [x] 3.2 Preserve idempotent early-return on `(userId, idempotencyKey)` so retries do not double-allocate
- [x] 3.3 Confirm waitlist promotion and admin comp paths inherit allocation unchanged via `bookEvent`

## 4. Cancel restock and readers

- [x] 4.1 Update `cancelBookingAsAdmin` to restock allocated promo/PDF inventory to `AVAILABLE`, clear inventory `booking_ticket_id`, and clear live ticket redemption payloads; keep capacity restore + no credit refund + waitlist processing
- [x] 4.2 Extend `listUserBookings` (and export `listBookingTickets` / by-id helper as needed) to include `booking_tickets` ordered by ordinal
- [x] 4.3 Optionally extend `maxBookableTickets` with `availableInventory` so member UX max = min(credits, capacity, inventory) for voucher types; update call sites only if trivial for typecheck

## 5. Tests

- [x] 5.1 Replace obsolete `resolveRedemption` voucher-pending unit tests; cover SECRET_CODE ticket rows + allocator unit behavior / error codes
- [x] 5.2 Add/extend `book-event` integration tests: VOUCHER_PROMO multi-ticket allocate, VOUCHER_PDF allocate, insufficient inventory (no mutations), idempotent retry without double-allocate, SECRET_CODE still works with N tickets
- [x] 5.3 Extend capacity-ops integration (or booking cancel test) for cancel → inventory `AVAILABLE` restock

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 6.2 Run `bun test packages/db` (booking unit + integration) (exit 0)
- [x] 6.3 Manual or scripted DB scenario: seed event with 2 promo codes, book 2 tickets → both `ALLOCATED`; cancel → both `AVAILABLE`
- [x] 6.4 Mark step 02 done in `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`; note `INSUFFICIENT_VOUCHER_INVENTORY` (and any copy keys) for UI localization in 04/05
- [x] 6.5 Do not rewrite full product feature files (`docs/product/features/*`) — owned by step 05; leave admin/member UI raw code display to step 04
