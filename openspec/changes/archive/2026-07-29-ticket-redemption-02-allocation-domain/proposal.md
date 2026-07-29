## Why

Step 01 landed voucher inventory tables and `booking_tickets`, but booking still rejects `VOUCHER_PROMO` / `VOUCHER_PDF` with `VOUCHER_INVENTORY_PENDING` and never writes per-ticket rows. Without atomic allocation inside `bookEvent` (and cancel restock), voucher events cannot be sold safely under concurrency, and admin/member UI steps have nothing to stock against or display.

## What Changes

- Replace the voucher reject shim with typed per-ticket allocation inside the same Postgres transaction as capacity/credits: `SECRET_CODE` writes N `booking_tickets` with the shared event secret; `VOUCHER_PROMO` / `VOUCHER_PDF` lock and allocate N `AVAILABLE` inventory rows (`FOR UPDATE SKIP LOCKED` or equivalent), mark `ALLOCATED`, and link each to a booking ticket.
- Reject booking with a typed error when `available_inventory < ticketsCount` (in addition to capacity/credits); no partial mutation.
- Admin cancel of a `CONFIRMED` booking restocks allocated promo/PDF inventory to `AVAILABLE` and clears allocation links (skip restock when booking status would already be `USED` — keep retired).
- Keep booking-level `redemption_*` as a first-ticket summary for minimal UI churn until step 04.
- Extend booking list/by-id readers to load `booking_tickets`; waitlist promotion and admin comp inherit via the same `bookEvent` path.
- Update unit + integration tests for allocation, insufficiency, idempotent retry, and cancel restock.
- Out of scope: admin upload/preview UI (03); member masked-code / download UI (04); product BDD / `docs/product/` rewrites (05).

## Capabilities

### New Capabilities

- _(none)_ — allocation extends the existing `ticket-redemption` and `booking` capabilities.

### Modified Capabilities

- `ticket-redemption`: Atomic per-ticket voucher allocation; cancel restocks unused inventory; secret-code bookings write per-ticket rows with the shared manual code (no inventory consumed); bookable quantity gated by remaining inventory for voucher types.
- `booking`: Confirmed voucher bookings succeed via inventory allocation (remove “reject until allocation” behavior); `bookEvent` creates `booking_tickets` and updates inventory; readers expose ticket redemptions; idempotent retry does not double-allocate.

## Impact

- **Domain:** `packages/db/src/booking/redemption.ts` (replace/extend with allocation helpers), `book-event.ts`, `errors.ts`, `list-user-bookings.ts`, `max-bookable-tickets.ts` (optional inventory-aware UX bound), exports from `booking/index.ts`.
- **Admin cancel:** `packages/db/src/admin/cancel-booking-as-admin.ts` (+ capacity-ops tests) restocks inventory.
- **Call sites unchanged in behavior contract:** waitlist `promote-waitlist-entry` and admin `create-comp-ticket` already call `bookEvent`.
- **Schema:** no new tables expected; uses `event_voucher_codes`, `event_voucher_pdfs`, `booking_tickets` from step 01.
- **Tests:** `booking.unit.test.ts`, `book-event.integration.test.ts`, `capacity-ops.integration.test.ts` (and any new allocation-focused tests).
- **Docs this step:** mark step 02 done in parent guide; note public error copy keys for UI localization in 04/05. Canonical `docs/product/` owned by step 05.
- **Source brief:** `.dev-plan/current-iteration/ticket-redemption-02-allocation-domain.md`
- **Parent:** `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`
- **Depends on:** `ticket-redemption-01-schema-and-secret-code` (archived / done)
- **Consumed by:** `ticket-redemption-03-admin-voucher-ui`, `ticket-redemption-04-member-bookings-ui`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/db` (booking unit + integration); manual/scripted seed with 2 promo codes → book 2 → both `ALLOCATED` → cancel → both `AVAILABLE`
