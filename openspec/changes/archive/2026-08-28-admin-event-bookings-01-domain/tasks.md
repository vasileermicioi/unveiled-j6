## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/admin-event-bookings-01-domain.md` (all 5 proposal sections + spec deltas) and the parent guide product-decision table / non-goals
- [x] 1.2 Confirm prerequisites exist: `cancel-booking-as-admin.ts`, `restockBookingInventory`, `refund-member-credits.ts` (do not nest), `process-waitlist-for-event.ts`, `list-waitlist-entries.ts`, `capacity-ops.integration.test.ts`

## 2. List queries

- [x] 2.1 Add `listEventBookings` in `packages/db/src/admin/list-event-bookings.ts`: require `eventId`; optional `status`, 1-based `page` (default 1), `limit` (default 25, clamp 1–100); order `created_at desc, id desc`; join `users` for `userEmail` + `userProfile`; return `{ items, total }`
- [x] 2.2 Add `listEventsWithBookingStats` in the same file: include events with ≥1 booking **or** ≥1 waitlist entry; title/partner ILIKE matching `listEvents` (`eventTitleLocaleIlike` + `partnerName`); paginate as 2.1; sort `date_time desc, id desc`; counts CONFIRMED / USED / CANCELLED, WAITING waitlist, remaining/total capacity, plus `refundableCredits` and `compConfirmedCount`
- [x] 2.3 Export list types and functions from `packages/db/src/admin/index.ts`

## 3. Cancel-all use case

- [x] 3.1 Add `cancelAllBookingsForEvent({ eventId, reason, adminUserId })` in `packages/db/src/admin/cancel-all-bookings-for-event.ts`; trim reason and throw `AdminCapacityError("INVALID_REASON")` before `db.transaction`; discard `adminUserId` (no `cancelled_by`)
- [x] 3.2 Inside one transaction: lock event `FOR UPDATE` (`EVENT_NOT_FOUND` if missing); lock CONFIRMED bookings `ORDER BY id ASC`; lock distinct users `ORDER BY id ASC`; restock each booking; set CANCELLED + reason + `cancelled_at`; refund `total_credits > 0` with inlined `REFUND` + `idempotency_key = event-cancel-all:{bookingId}` (do **not** call `refundMemberCredits`); skip ledger for comps; increment `remaining_capacity` by cancelled `tickets_count` only; bulk-cancel WAITING waitlist (do **not** call `cancelWaitlistEntry` or `processWaitlistForEvent`)
- [x] 3.3 Return `{ cancelled, refundedCredits, waitlistCancelled, skippedUsed }`; zero CONFIRMED is success (still close WAITING if any); skip USED / already CANCELLED / leftover WAITLIST booking rows
- [x] 3.4 Export cancel-all types and function from `packages/db/src/admin/index.ts`

## 4. Tests

- [x] 4.1 Unit: empty/whitespace reason rejects with `INVALID_REASON` without calling `db.transaction`
- [x] 4.2 List tests: pagination/filter/sort; stats include booking-only and waitlist-only events; title/partner substring filters; `refundableCredits` / `compConfirmedCount` match CONFIRMED paid vs zero-credit comps
- [x] 4.3 Integration cancel-all matrix: two paid CONFIRMED → refund + `REFUND` ledger + restocked promo/PDF; one comp (`total_credits = 0`) cancelled with no ledger; one USED unchanged; WAITING → CANCELLED and **not** promoted; `remaining_capacity` increases by cancelled ticket counts only; second call is a no-op on credits/inventory/capacity; missing event → `EVENT_NOT_FOUND` with no booking writes
- [x] 4.4 Keep existing `cancelBookingAsAdmin` assertions green (no `REFUND`, credits unchanged, waitlist processing still runs)

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` — exit 0
- [x] 5.2 Run `bun run typecheck` — exit 0
- [x] 5.3 Run `bun test packages/db/src/admin/` — exit 0 including the cancel-all matrix
- [x] 5.4 Mark step done in `.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`; do **not** rewrite canonical `docs/product/` Gherkin (step 03)
