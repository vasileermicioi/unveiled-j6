## Why

Admins can cancel **one** CONFIRMED booking (`cancelBookingAsAdmin`) with **no credit refund** and automatic waitlist promotion, but they cannot list bookings for one event or cancel every confirmed booking when an event is pulled. Domain must ship per-event list/stats and atomic cancel-all first so step 02 SSR cannot invent those semantics.

## What Changes

- Add `listEventBookings` (paginated, optional `status`, default page size 25, stable `created_at desc, id desc`) with member email/name for the per-event table.
- Add `listEventsWithBookingStats` for the Bookings tab landing: events with at least one booking **or** at least one waitlist entry; per event confirmed / used / cancelled counts, waiting waitlist count, remaining/total capacity, plus refund preview aggregates (sum of CONFIRMED `total_credits`, count of zero-credit comps) so the confirm page does not paginate to total credits. Paginate 25; default sort `date_time` desc then `id`. Title/partner substring filters matching admin events list (`title_de`/`title_en` and denormalized partner name).
- Add `cancelAllBookingsForEvent({ eventId, reason, adminUserId })` in `@unveiled/db` admin: **one** transaction that cancels every CONFIRMED booking (refund `total_credits`, restock vouchers, restore capacity by cancelled ticket counts, bulk-cancel WAITING waitlist) and **does not** call `processWaitlistForEvent`.
- Export types and functions from `packages/db/src/admin/index.ts`.
- Integration + unit tests next to existing capacity-ops tests. Leave `cancelBookingAsAdmin` no-refund + promote behavior unchanged.
- Out of scope: SSR routes, admin tab, emails, Playwright, canonical `docs/product/` rewrites, migrations, `cancelled_by`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `booking`: Add ADMIN-only event-level cancel-all (CONFIRMED only, required reason, refund `total_credits` via `REFUND` + restock + capacity restore, skip USED, idempotent no-op). Keep single-booking admin cancel as no-refund + waitlist promotion.
- `waitlist`: Event cancel-all sets every WAITING entry for that event to CANCELLED in the same transaction and MUST NOT run promotion; PROMOTED rows stay PROMOTED.
- `credits-subscription`: `REFUND` ledger rows are written for event-level cancel-all (`idempotency_key = event-cancel-all:{bookingId}`) in addition to the existing admin manual goodwill refund. Single-booking admin cancel still MUST NOT write `REFUND`.

## Impact

- **Domain (`@unveiled/db` admin):** new `list-event-bookings.ts`, `cancel-all-bookings-for-event.ts`; exports from `packages/db/src/admin/index.ts`. Reuse `restockBookingInventory` (same as single cancel). Inline `REFUND` + `users.credits` increment inside the cancel-all transaction — **do not nest** `refundMemberCredits` (it opens a second transaction).
- **Unchanged writers:** `cancelBookingAsAdmin` stays no-refund then `processWaitlistForEvent`. Booking domain remains the restock/capacity writer via the existing helper.
- **Tests:** `list-event-bookings` unit/integration as needed; `cancel-all-bookings-for-event` integration covering the verification matrix; unit tests for empty reason / missing event before touching rows; existing single-cancel no-refund assertions stay green.
- **Source brief:** `.dev-plan/current-iteration/admin-event-bookings-01-domain.md`
- **Parent:** `.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `admin-event-bookings-02-admin-surfaces`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/db/src/admin/`
