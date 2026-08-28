## Context

Parent feature: Admin event bookings (`.dev-plan/current-iteration/admin-event-bookings-parent-guide.md`). Step 01 is `@unveiled/db` admin domain only. See `proposal.md` for motivation.

Today:

- `cancelBookingAsAdmin` locks one CONFIRMED booking, calls `restockBookingInventory`, sets `CANCELLED` + reason + `cancelled_at`, increments `remaining_capacity` by that booking’s `tickets_count`, then **outside** the transaction runs `processWaitlistForEvent`. It does **not** touch `users.credits` or `credit_ledger`.
- `refundMemberCredits` is a separate Membership HQ gesture that opens **its own** transaction, locks one user, increments credits, and inserts `type = 'REFUND'`. Nesting it from cancel-all would start a second transaction.
- `restockBookingInventory(tx, bookingId)` returns `VOUCHER_PROMO` / `VOUCHER_PDF` rows to `AVAILABLE`, clears `booking_ticket_id`, and nulls live `booking_tickets` redemption payloads (covers `SECRET_CODE` payload clearing too).
- There is no per-event booking list. Admin waitlist listing is `listAdminWaitlistEntries` (limit/offset, default 25). Admin events list title/partner filters use `eventTitleLocaleIlike` (`title_de` or `title_en`) and `ilike(events.partnerName, …)`.
- Schema constraints: bookings `ON DELETE RESTRICT`; partial unique on `(user_id, event_id, date_time)` WHERE status IN (`CONFIRMED`, `USED`); ledger unique on non-null `idempotency_key`. No `cancelled_by` column. Waitlist statuses: `WAITING` | `PROMOTED` | `CANCELLED`. Leftover `WAITLIST` **booking** rows (if any) are ignored.
- Product decisions in the parent guide are locked: two cancel paths; refund `bookings.total_credits`; skip USED; do not promote waitlist; event stays in the catalog.

Constraints: packages never depend on `apps/web`; no SQL migration; Booking remains the restock/capacity writer via the existing helper; SSR, emails, and product-doc/Gherkin updates are later steps.

## Goals / Non-Goals

**Goals:**

- Export paginated `listEventBookings` and `listEventsWithBookingStats` typed for SSR query strings (`eventId`, `status`, `page`, `title`, `partner`).
- Export `cancelAllBookingsForEvent` as one Postgres transaction implementing the parent-guide table.
- Keep `cancelBookingAsAdmin` no-refund + promote behavior identical.
- Package tests covering the verification matrix in the step plan.

**Non-Goals:**

- Admin Bookings tab, per-event SSR pages, cancel-all confirm UI, DE/EN copy (02).
- Post-commit cancellation / waitlist-closed emails (02).
- Playwright, canonical `docs/product/` Gherkin, sitemap, pagination extras, Ladle tab story (03).
- Changing single-booking cancel to auto-refund; member self-cancel; new ledger enum values; event unpublish/cancelled flag; `cancelled_by`; background jobs.

## Decisions

1. **Module split: list vs cancel-all**
   - **Choice:** `packages/db/src/admin/list-event-bookings.ts` holds `listEventBookings` + `listEventsWithBookingStats`. `packages/db/src/admin/cancel-all-bookings-for-event.ts` holds the write use case. Both export from `packages/db/src/admin/index.ts` (already re-exported by `packages/db/src/index.ts`).
   - **Rationale:** Matches existing admin file-per-use-case layout (`cancel-booking-as-admin.ts`, `list-waitlist-entries.ts`). Step 02 imports from `@unveiled/db`.
   - **Alternatives:** One file for all three (harder to test in isolation); put cancel-all next to `book-event.ts` (rejected — admin module calling booking restock is the same pattern as single cancel).

2. **Pagination: 1-based `page`, default size 25**
   - **Choice:** Options include `page` (1-based, default 1, treat non-positive as 1) and optional `limit` (default 25, clamp 1–100). Offset = `(page - 1) * limit`. Both list functions return `{ items, total }`.
   - **Rationale:** Step plan requires types suitable for SSR `?page=`; waitlist admin already clamps limit at 100.
   - **Alternatives:** Offset-only like `listMembers` (weaker SSR fit); fixed page size with no `limit` (less flexible for tests).

3. **`listEventBookings` row shape includes member identity**
   - **Choice:** Join `users` on `bookings.user_id`. Each item is the booking row plus `userEmail`, `userProfile` (`users.profile` JSON — `first_name` / `last_name` for step 02 “member (name/email)”). Filter optional `status` with `eq(bookings.status, …)`. Order `created_at desc, id desc`. Require `eventId`.
   - **Rationale:** Step 02 columns need name/email without a second query per row. Do not attach `booking_tickets` here (cancel-all restock is the write path; list is status/credits/occurrence).
   - **Alternatives:** Return bare `Booking` and let web join (N+1 or duplicate query); include ticket redemptions (out of scope for the admin table).

4. **`listEventsWithBookingStats` inclusion, filters, sort, preview aggregates**
   - **Choice:** Include an event iff `EXISTS` a `bookings` row **or** `EXISTS` a `waitlist_entries` row (any status). Title/partner: trim; `eventTitleLocaleIlike('%…%')` and `ilike(events.partnerName, '%…%')` independently (same as `listEvents` dedicated filters — not combined `q`). Default order `events.date_time desc, events.id desc`. Counts: `CONFIRMED` / `USED` / `CANCELLED` booking rows (ignore leftover `WAITLIST` booking status); `WAITING` waitlist rows; `remainingCapacity` / `totalCapacity` from the event. Also compute `refundableCredits` = `sum(total_credits)` of CONFIRMED rows where `total_credits > 0`, and `compConfirmedCount` = CONFIRMED rows with `total_credits = 0`, so step 02’s confirm page can show credits-to-refund / comps without paging all bookings.
   - **Rationale:** Parent + step 01 landing table; confirm-page preview cannot be summed from a 25-row page if an event has more CONFIRMED bookings.
   - **Alternatives:** Only events with CONFIRMED bookings (hides used-only / waitlist-only); a separate preview helper (extra export for the same aggregates).

5. **Cancel-all is one transaction; do not nest `refundMemberCredits`**
   - **Choice:** `db.transaction`. Trim `reason`; if empty throw `AdminCapacityError("INVALID_REASON", …)` **before** `transaction`. Inside: lock event `FOR UPDATE`; if missing throw `EVENT_NOT_FOUND`. Select+lock CONFIRMED bookings for that `eventId` `ORDER BY id ASC` `FOR UPDATE`. Distinct `user_id`s from those bookings, lock `users` `ORDER BY id ASC` `FOR UPDATE`. For each CONFIRMED booking: `restockBookingInventory(tx, booking.id)`; set `CANCELLED`, `cancellationReason`, `cancelledAt`, `updatedAt`. For each with `total_credits > 0`: increment that user’s `credits` (even if subscription is not `ACTIVE`, including anonymized GDPR rows) and insert `credit_ledger` `{ type: "REFUND", amount: total_credits, balanceAfter, description: "Event cancel-all", idempotencyKey: \`event-cancel-all:${bookingId}\` }`. Comps (`total_credits = 0`): skip ledger. Then `remaining_capacity += sum(tickets_count)` of cancelled rows only (do **not** reset to `total_capacity`). Bulk-update `waitlist_entries` for that event `status = 'WAITING'` → `CANCELLED` (do **not** call `cancelWaitlistEntry` or `processWaitlistForEvent`). `adminUserId` is accepted and discarded (same as single cancel — no `cancelled_by`). Skip already `CANCELLED` and leftover `WAITLIST` booking rows; count `USED` as `skippedUsed` without locking them into the cancel set.
   - **Rationale:** Parent lock order; unique ledger key prevents double refund; nesting `refundMemberCredits` would open a second transaction.
   - **Alternatives:** Call `refundMemberCredits` per booking (rejected); promote waitlist after restore (rejected — parent locked); set remaining = total (wrong when USED remain).

6. **Result shape and idempotency**
   - **Choice:** Return `{ cancelled, refundedCredits, waitlistCancelled, skippedUsed }`. Zero CONFIRMED → still close any WAITING waitlist, restore nothing, refund nothing; second call is a true no-op on credits/inventory/capacity (and waitlist already CANCELLED). Unique `idempotency_key` is the safety net if a retry races mid-flight.
   - **Rationale:** Step plan return counts; spec “no-op when nothing is confirmed” is about credit/inventory/capacity, not about skipping waitlist close on the first call that finds WAITING + zero CONFIRMED.
   - **Alternatives:** No-op including skipping waitlist close when cancelled === 0 (would leave WAITING on a USED-only event).

7. **Errors reuse `AdminCapacityError`**
   - **Choice:** `INVALID_REASON` (blank/whitespace reason), `EVENT_NOT_FOUND` (missing event). No new error class. Do not add `NOT_CONFIRMED` for cancel-all (zero CONFIRMED is success).
   - **Rationale:** Same codes as single cancel; step 02 maps them to confirm-page errors.
   - **Alternatives:** New `AdminEventBookingsError` (unnecessary).

8. **Tests live next to capacity-ops**
   - **Choice:** Unit: empty reason does not call `db.transaction` (fake `TxDb`). Integration in `cancel-all-bookings-for-event.integration.test.ts` (and list tests as needed) using the same skip-if-no-`DATABASE_URL` pattern as `capacity-ops.integration.test.ts`. Keep the existing single-cancel assertion that ledger length is unchanged and no `REFUND` is written.
   - **Rationale:** Step verification matrix; do not overload the already-large capacity-ops file.
   - **Alternatives:** Only extend capacity-ops.integration.test.ts (file already covers cancel/list/promote/comp).

## Risks / Trade-offs

- **[Risk] Long transaction / lock time on a large test event** → Mitigation: parent accepts one transaction at curated-catalog scale; lock event first so new `bookEvent` waits; stable id order for bookings and users.
- **[Risk] Double refund if retry overlaps** → Mitigation: ledger unique `idempotency_key`; second successful call sees zero CONFIRMED.
- **[Risk] Accidental waitlist promotion** → Mitigation: never import/call `processWaitlistForEvent`; integration asserts WAITING → CANCELLED and no new CONFIRMED from waiters.
- **[Risk] Nesting `refundMemberCredits`** → Mitigation: inline ledger + credit increment on the same `tx`; do not call that helper.
- **[Risk] Step 02 confirm page undercounts refunds if stats omit credit sums** → Mitigation: include `refundableCredits` and `compConfirmedCount` on each stats row.

## Migration Plan

1. Add list + cancel-all modules, exports, and tests. No Drizzle migration.
2. Deploy package with web unchanged — new exports are unused until step 02.
3. Rollback: revert the package commit. Ledger keys `event-cancel-all:{bookingId}` do not collide with manual refunds.

## Open Questions

- None blocking step 01. Email copy and confirm-page chrome are step 02.
