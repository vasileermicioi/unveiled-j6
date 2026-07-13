## Context

Step 01 shipped Membership HQ domain helpers under `packages/db/src/admin/` (list/detail, adjust, refund) and freeze/unfreeze in `@unveiled/billing`. Phase 7 already provides `bookEvent` (including `skipCreditCharge`), `promoteWaitlistEntry`, and `processWaitlistForEvent`. Product SoT already specifies admin cancel (`booking.feature`), admin waitlist list + manual promote (`waitlist.feature`), and comp tickets (`credits-subscription.feature` / `admin-users.feature`).

This is Phase 8 step 02 (`admin-ops-02-capacity-ops-domain`): package-level capacity ops only. Auth gates live at call sites (step 04); domain functions assume a trusted admin actor. Booking remains the sole writer of purchase/comp bookings; waitlist promotion reuses the Phase 7 path.

## Goals / Non-Goals

**Goals:**

- `cancelBookingAsAdmin` — `CONFIRMED` → `CANCELLED` only; restore `events.remaining_capacity` by `tickets_count`; persist reason + `cancelled_at`; **no** credit refund / `REFUND` ledger; then run `processWaitlistForEvent` for that event.
- Admin waitlist list query — filter `eventId` / `status`, pagination, include `skipped_once` (skip history).
- Manual promote wrapper that calls existing `promoteWaitlistEntry` for a chosen entry id (out-of-queue support).
- `createCompTicket` — thin wrapper around `bookEvent({ skipCreditCharge: true })` with capacity + eligibility via the shared path; no charge ledger row.
- Typed errors; unit/integration tests; public exports from `@unveiled/db`.

**Non-Goals:**

- SSR admin mutation pages or Membership HQ UI (steps 03–04).
- Member self-cancel / auto-refund on cancel.
- GDPR export/anonymize/delete.
- Partner check-in / portal.
- Schema migrations (cancel reason columns already exist on `bookings`).
- Changing `promoteWaitlistEntry` / `bookEvent` core semantics (reuse only).

## Decisions

### 1. Module layout

Extend `packages/db/src/admin/` next to step-01 member support:

```
packages/db/src/admin/
  cancel-booking-as-admin.ts
  list-waitlist-entries.ts
  promote-waitlist-entry-as-admin.ts   # thin wrapper → promoteWaitlistEntry
  create-comp-ticket.ts
  capacity-ops.unit.test.ts
  capacity-ops.integration.test.ts    # skip cleanly if DATABASE_URL unset
  errors.ts                           # extend with capacity-ops codes (or AdminCapacityError)
  index.ts                            # re-export new APIs
```

Export from `@unveiled/db` via existing `export * from "./admin"`.

**Rationale:** Same admin package surface as step 01; booking/waitlist stay the writers — admin modules orchestrate, they do not duplicate booking inserts or promotion book-then-mark logic.

**Alternatives:** Put cancel under `booking/` and list under `waitlist/` — also fine, but splits admin call-site imports across three folders. Prefer one `@unveiled/db` admin import for step-04 routes.

### 2. Admin cancel booking

```ts
cancelBookingAsAdmin(db, {
  bookingId: string;
  reason: string;
  adminUserId: string; // trusted actor id for call-site audit; not persisted (no cancelled_by column)
}): Promise<{ booking: Booking; waitlist: ProcessWaitlistResult }>
```

Algorithm:

1. Require non-empty trimmed `reason` (typed `INVALID_REASON`).
2. In a transaction: lock booking row `FOR UPDATE`; if missing → `BOOKING_NOT_FOUND`; if status ≠ `CONFIRMED` → `NOT_CONFIRMED`.
3. Update booking: `status = CANCELLED`, `cancellationReason = reason`, `cancelledAt = now`, `updatedAt = now`.
4. Lock event; increment `remainingCapacity` by `booking.ticketsCount`; update `updatedAt`.
5. Commit. Do **not** touch `users.credits` or insert any ledger row (including `REFUND`).
6. After commit, call `processWaitlistForEvent(db, eventId)` and return its result alongside the cancelled booking.

**Why waitlist after commit:** `processWaitlistForEvent` → `promoteWaitlistEntry` → `bookEvent` each open their own transactions; wrapping them inside the cancel tx would nest/conflict with the Phase 7 book-then-mark design.

**Alternatives:** Auto-refund on cancel — rejected by product (`booking.feature`: no credits refunded as part of cancellation itself; manual `REFUND` remains step-01 / step-04).

### 3. Admin waitlist list

```ts
listAdminWaitlistEntries(db, {
  eventId?: string;
  status?: WaitlistStatus;
  limit?: number;   // default 25
  offset?: number;
}): Promise<{ items: AdminWaitlistRow[]; total: number }>
```

- Rows include at least: entry id, event id, user id, requested qty, status, `skippedOnce`, created/updated timestamps (enough for admin visibility + skip history).
- Optional joins for email / event title are allowed if cheap (helps step-04), but not required for this step’s verification.
- Order: `created_at ASC` (queue order), then `id ASC` for stability.
- No auth inside the function; routes enforce `ADMIN`.

### 4. Manual promote wrapper

```ts
promoteWaitlistEntryAsAdmin(db, { entryId: string; adminUserId: string })
  → promoteWaitlistEntry(db, entryId)
```

No new promotion algorithm. `adminUserId` is accepted for symmetry with other admin mutations (logging at call site later); not required by `promoteWaitlistEntry`. Errors bubble as existing `WaitlistError` / `BookingError`.

**Rationale:** Product requires the same promotion transaction out of queue order; Phase 7 already exported that path for Phase 8 admin use.

### 5. Comp ticket helper

```ts
createCompTicket(db, {
  userId: string;
  eventId: string;
  ticketsCount?: number; // default 1
  idempotencyKey: string;
  adminUserId: string;
}): Promise<BookEventResult>
```

Implementation: `bookEvent(db, { userId, eventId, ticketsCount, idempotencyKey, skipCreditCharge: true })`.

Invariants inherited from `bookEvent`:

- Capacity check enforced.
- Subscription eligibility gate still applies (`assertBookingEligible`) — comps are not a bypass for `UNPAID` / `PAST_DUE` / missing subscription.
- `totalCredits` stored as `0`; no `BOOKING` (or other) charge ledger row.
- Confirmation email behavior remains whatever booking already does when invoked (UI/email wiring is later; domain may or may not send here — do not add a parallel email path in this step).

Generate stable idempotency keys at the SSR call site in step 04 (e.g. `comp:{adminUserId}:{userId}:{eventId}:{uuid}`); this step requires a non-empty key only.

### 6. Errors

Extend admin errors (either widen `AdminMemberError` → `AdminError`, or add `AdminCapacityError` with codes):

| Code | When |
|---|---|
| `BOOKING_NOT_FOUND` | Cancel target missing |
| `NOT_CONFIRMED` | Cancel on non-`CONFIRMED` |
| `INVALID_REASON` | Empty cancel reason |
| `USER_NOT_FOUND` / booking errors | Comp via `bookEvent` — prefer rethrowing `BookingError` as-is |

Prefer rethrowing `BookingError` / `WaitlistError` from wrappers rather than re-mapping, so step-04 can branch on existing codes (`SOLD_OUT`, `INELIGIBLE_SUBSCRIPTION`, `NOT_WAITING`, …).

### 7. Tests

- **Cancel:** confirmed → cancelled + capacity += tickets; credits unchanged; no new `REFUND` / credit ledger row from cancel; reject `USED` / `CANCELLED` / `WAITLIST`; after cancel, waitlist processor invoked (assert call or assert a waiting entry can promote when capacity frees — integration).
- **List:** filter by event/status; `skippedOnce` visible; pagination.
- **Promote:** wrapper returns same outcome as direct `promoteWaitlistEntry` for a waiting entry with capacity.
- **Comp:** creates `CONFIRMED` booking with `skipCreditCharge` semantics (credits unchanged, no charge ledger); sold-out rejects.
- Skip integration cleanly when `DATABASE_URL` unset (same pattern as admin-members / booking / waitlist).

## Risks / Trade-offs

- **[Waitlist processing fails after successful cancel]** → Capacity is correctly restored; processor can be re-run. Log/surface waitlist result to step-04; do not roll back cancel if promote fails mid-queue (matches Phase 7 processor semantics).
- **[Comp still gated by subscription eligibility]** → Matches “same booking-transaction path”; support may need freeze/unfreeze (step 01) before comp. Document in module comment.
- **[`adminUserId` not persisted on cancel]** → No `cancelled_by` column; reason text is the durable audit trail for MVP. Avoid schema migration in this step.
- **[Manual promote skips earlier waiters]** → Intentional support path per product; automatic processor remains FIFO.
- **[No UI in this step]** → Intentional; domain must compile and test in isolation for steps 04–05.

## Migration Plan

1. Implement admin cancel / waitlist list / promote wrapper / comp helper + exports.
2. Add unit/integration tests; run `bun run lint`, `bun run typecheck`, targeted `bun test`.
3. No DB migration. Deploy anytime after green; rollback = remove exports.
4. Mark step 02 done in `admin-ops-parent-guide.md` after merge.
5. Note seed fixtures useful for step 05: sold-out event + confirmed booking + waiting entry.

## Open Questions

- None blocking apply. Default waitlist list page size `25` to match admin list pagination elsewhere unless step-04 needs a different constant later.
