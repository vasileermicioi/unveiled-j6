## Context

Parent feature: one ticket per occurrence (`.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`), step 01 — schema, domain writes, and qty-control removal so posted quantity is always 1. See `proposal.md` for motivation.

Current state:

- `bookings` has uniqueness only on `(user_id, idempotency_key)`. `tickets_count` is unbounded integer ≥ 1. `date_time` is the booked occurrence instant (`timestamptz NOT NULL`).
- `bookEvent` validates `ticketsCount >= 1`, then idempotency lookup, then lock event/user, eligibility, capacity, slot resolve, credits, insert. No per-occurrence uniqueness check. Unique-violation `23505` is not mapped.
- `maxBookableTickets` returns guest `3` or signed-in `min(affordable, capacity, inventory)` with no upper bound of 1.
- Waitlist join stores caller `requestedQty`; promotion passes `entry.requestedQty` into `bookEvent`. Skip codes: `INELIGIBLE_SUBSCRIPTION`, `PAST_DUE`, `INSUFFICIENT_CREDITS`, `INSUFFICIENT_VOUCHER_INVENTORY`, `USER_NOT_FOUND`, `UNKNOWN_SLOT`, `PAST_SLOT` — not uniqueness.
- Waitlist already has a partial unique index pattern: `waitlist_entries_user_event_waiting_uidx` … `WHERE status = 'WAITING'` (`packages/db/drizzle/0005_dry_stark_industries.sql`).
- Qty UI: `EventDetailCheckoutCard` stepper, `BookSlotFields` / waitlist join `TicketCountSelect`, `AdminCompTicketForm` tickets field. Datetime `<select>` is gated behind the same `showTicketControls` block as the qty stepper.
- Latest Drizzle migration in tree: `0028_event_taxonomy.sql`. Admin cancel restores capacity and restocks voucher inventory, then runs waitlist processing — **do not** reuse that path in the migration.

Constraints: Booking domain is the only purchase writer (`AGENTS.md`). Schema in `@unveiled/db` / `public` only. HeroUI-only markup; native `<select>` for datetime. SSR form POST. No client-only mutation modals. Do not edit `docs/product/` Gherkin in this step. Europe/Berlin unchanged.

## Goals / Non-Goals

**Goals:**

- DB-enforced at most one `CONFIRMED`/`USED` row per `(user_id, event_id, date_time)`.
- Every new write path (`bookEvent`, waitlist promote, admin comp) persists `tickets_count = 1` and rejects a second active occurrence with `ALREADY_BOOKED`.
- Qty pickers gone on detail / book / waitlist join / comp so the live UI cannot POST a count other than 1.
- Export a booked-instant read helper for step 02, covered by tests here.
- Unit tests prove `assertValidTicketCount(4)` throws and `maxBookableTickets` never returns > 1 without a database.

**Non-Goals:**

- Already-booked copy + My Tickets link (step 02).
- Canonical Gherkin, Playwright, schema-overview / i18n / coverage-matrix sweep (step 03).
- Deleting `TicketCountSelect.tsx` if unused (step 03).
- Rewriting historical `tickets_count > 1` rows or `booking_tickets` multi-row display.
- Per-hour remaining capacity or per-hour waitlists.
- Admin override of uniqueness (parent lock: none).
- Restocking voucher inventory for migration-cancelled duplicate rows (capacity restore only).

## Decisions

1. **Partial unique index, same shape as waitlist WAITING uniqueness**
   - **Choice:** On `bookings`:

     ```ts
     uniqueIndex("bookings_user_event_datetime_active_uidx")
       .on(table.userId, table.eventId, table.dateTime)
       .where(sql`${table.status} IN ('CONFIRMED', 'USED')`)
     ```

     SQL equivalent: `CREATE UNIQUE INDEX … ON bookings (user_id, event_id, date_time) WHERE status IN ('CONFIRMED', 'USED')`. `CANCELLED` (and unused `WAITLIST` status) stay out of the index so a cancelled hour can be booked again.
   - **Rationale:** Parent lock is one active **row** per occurrence instant, not one ticket per event. Matches the existing waitlist partial-index pattern. Race of two concurrent POSTs is closed by Postgres, not application locking alone.
   - **Alternatives:** Unique on `(user_id, event_id)` ignoring datetime (violates multi-hour lock). Application-only check without an index (lost races double-charge). Include `CANCELLED` (blocks rebook after admin cancel).

2. **Dedupe before `CREATE UNIQUE INDEX`; restore event remaining capacity only**
   - **Choice:** Migration SQL, in one file, **before** the unique index:

     1. Among `CONFIRMED`/`USED` rows sharing `(user_id, event_id, date_time)`, keep the earliest `created_at` (tie-break `id`).
     2. Set later duplicates to `CANCELLED`, `cancelled_at = now()`, `cancellation_reason` a stable marker (e.g. `one-ticket-limit-dedupe`), `updated_at = now()`.
     3. `UPDATE events SET remaining_capacity = LEAST(total_capacity, remaining_capacity + cancelled_sum)` grouped by `event_id` from those cancelled rows.
     4. Then `CREATE UNIQUE INDEX`.

     Do **not** call `cancelBookingAsAdmin` / `processWaitlistForEvent` / voucher restock from the migration. Demo seed is expected clean; staging/prod should be pre-checked.
   - **Rationale:** Index create fails if duplicates exist. Parent requires capacity restore by cancelled `tickets_count`. Waitlist processing during migrate would book new rows mid-migration. Voucher restock is unspecified and is a known leftover-inventory risk (see Risks).
   - **Alternatives:** Fail the migration if any duplicate exists (safer for prod, worse for a dirty staging DB). Delete duplicate rows (loses audit). Full admin-cancel path (waitlist side effects, too heavy for migrate).

3. **`ALREADY_BOOKED` after slot resolve, inside the transaction; map only this index’s `23505`**
   - **Choice:** Add `ALREADY_BOOKED` to `BookingErrorCode`. Order inside `bookEvent`:

     1. `assertValidTicketCount` (exactly `1`) — outside or at start, before tx is fine.
     2. Open tx → existing `(user_id, idempotency_key)` → return original (**before** uniqueness).
     3. Lock event/user, eligibility, capacity, **resolve slot**.
     4. `SELECT` an existing `CONFIRMED`/`USED` row for `(user_id, event_id, slotDateTime)` → throw `ALREADY_BOOKED` (no credit/capacity/inventory writes yet).
     5. Credits, allocation, insert. Catch insert `23505` and map to `ALREADY_BOOKED` **only** when the error names `bookings_user_event_datetime_active_uidx` (or constraint/index detail contains that name). Do **not** map `bookings_user_id_idempotency_key_uidx`.
   - **Rationale:** Idempotent retry must not become `ALREADY_BOOKED`. Application check gives a clean error on the happy sequential path; unique index covers the concurrent race. Slot must be resolved first so uniqueness uses the canonical occurrence `Date` (same instant as `events.date_times` elements), not a caller clock-skewed value.
   - **Alternatives:** Rely on `23505` only (opaque, and must still distinguish idempotency). Check uniqueness before slot resolve (wrong hour / unknown slot). Treat all `23505` as `ALREADY_BOOKED` (breaks idempotency races).

4. **`assertValidTicketCount` is exactly `1`; `maxBookableTickets` is `0` or `1`**
   - **Choice:** `assertValidTicketCount`: `Number.isInteger(n) && n === 1`, else `INVALID_TICKET_COUNT`. Waitlist join keeps mapping that to `INVALID_QTY`.

     `maxBookableTickets`: compute the existing signed-in cap (`min(affordable, capacity, inventory)`, creditPrice ≤ 0 skips credits). Guests: do **not** return `3`; use capacity + inventory only (no credit floor), same as a signed-in member with infinite credits. Then `Math.min(1, cap)` so the function never returns > 1. Sold-out / unaffordable / no inventory → `0`.
   - **Rationale:** Parent: new writes MUST be 1. Guest preview cap of 3 is obsolete because guests omit quantity. Returning 0 vs 1 still drives “can book” without a stepper.
   - **Alternatives:** Keep `>= 1` in domain and only hide UI (POST can still send 4). Leave guest `3` (dead preview bound).

5. **`listActiveBookedOccurrenceInstants` exported from `@unveiled/db`**
   - **Choice:** `listActiveBookedOccurrenceInstants(db, userId, eventId): Promise<Date[]>` — `date_time` of that user’s `CONFIRMED`/`USED` bookings for the event (order by `date_time` asc). No `CANCELLED`. Export from `packages/db/src/booking/index.ts` (re-exported by package root). Call from unit and/or integration tests this step; step 02 wires it to checkout.
   - **Rationale:** Step 02 needs this read without inventing a second query. Testing it now proves the uniqueness statuses.
   - **Alternatives:** Defer the helper to step 02 (step plan requires it here). Return full booking rows (more than step 02 needs).

6. **Waitlist: persist 1, promote with 1, skip `ALREADY_BOOKED`**
   - **Choice:** Join still takes `requestedQty` but `assertValidTicketCount` now requires 1. Promotion **ignores** stored `requested_qty` and calls `bookEvent({ ticketsCount: 1, … })` so grandfathered `requested_qty > 1` rows still promote one ticket. Add `ALREADY_BOOKED` to `SKIP_BOOKING_CODES`. In `processWaitlistForEvent`, treat fit as `remaining >= 1` (not `entry.requestedQty > remaining`), so a leftover qty=2 row is not skipped when one seat is free.
   - **Rationale:** Parent: waitlist stays event-level; promotion may resolve to an hour the member already holds and then skip. Using stored qty for capacity fit would strand historical rows.
   - **Alternatives:** Rewrite historical `requested_qty` to 1 (unnecessary). Skip waitlist join if the member already holds any hour (parent says they may still join when sold out).

7. **Admin comp: always 1, no qty field, no uniqueness override**
   - **Choice:** `createCompTicket` always passes `ticketsCount: 1`. Drop optional `ticketsCount` from the input type (or ignore it). Remove the tickets field from `AdminCompTicketForm` and stop parsing `ticketsCount` in `comp-ticket.tsx`. Same `bookEvent` gate → `ALREADY_BOOKED` if the member already holds the resolved slot (next upcoming when `dateTime` omitted).
   - **Rationale:** Parent open question default: no admin override.
   - **Alternatives:** Keep a qty field that posts 1 (misleading). Comp-specific bypass (rejected).

8. **UI: remove qty controls; keep datetime `<select>` independent of qty chrome**
   - **Choice:** Delete the +/− stepper from `EventDetailCheckoutCard` and `TicketCountSelect` from `BookSlotFields` / `WaitlistJoinPage`. Restructure detail checkout so datetime `<select>` (when ≥2 future occurrences) and the one-ticket credit total are **not** gated on the qty stepper (`showTicketControls` currently wraps both). Credit total = selected slot price × 1. Book/waitlist POST: hidden `ticketsCount`/`requestedQty` = `1` **or** omit the field and default to `1` server-side (prefer server default 1 plus optional hidden 1 so a missing field still books). Do not delete `apps/web/app/islands/TicketCountSelect.tsx` if nothing imports it. HeroUI only; native datetime `<select>`; Tailwind layout only.
   - **Rationale:** Mergeable without already-booked messaging. If datetime stays inside `showTicketControls` and that flag goes false with the stepper, multi-hour checkout breaks.
   - **Alternatives:** Leave a disabled qty=1 display (still a quantity control; spec forbids it). Client-only clamp without server default (POST can omit or send 4).

## Risks / Trade-offs

- **[Risk] Duplicate active rows on staging/prod block `CREATE UNIQUE INDEX`** → Mitigation: dedupe SQL in the same migration before the index; pre-check row counts; demo seed expected clean.
- **[Risk] Migration-cancelled duplicates leave voucher inventory allocated** → Mitigation: accepted this step (capacity only). Operators can restock via existing admin cancel on any remaining CONFIRMED dupes *before* migrate if needed; after migrate dupes are CANCELLED and admin cancel rejects non-CONFIRMED. Document in the PR; optional follow-up restock script is out of scope.
- **[Risk] Two concurrent POSTs for the same hour** → Mitigation: unique index + map that index’s `23505` to `ALREADY_BOOKED` so neither double-charges.
- **[Risk] Mapping all `23505` to `ALREADY_BOOKED` poisons idempotent retry** → Mitigation: match `bookings_user_event_datetime_active_uidx` only.
- **[Risk] Timestamptz uniqueness vs caller-posted instants** → Mitigation: uniqueness uses `resolveBookingSlot`’s canonical `Date` from `events.date_times`.
- **[Risk] Removing qty stepper also hides datetime select** → Mitigation: split the checkout card so datetime + credit total remain for eligible members.
- **[Trade-off] Historical `tickets_count > 1` and waitlist `requested_qty > 1` stay** → Required grandfathering; new writes are 1; promotion books 1.
- **[Trade-off] Waitlist join remains event-level** → A member who holds one hour can still join; promotion skip on `ALREADY_BOOKED` is acceptable MVP (parent).
- **[Trade-off] Leave `TicketCountSelect.tsx` on disk** → Step 03 deletes if unused.

## Migration Plan

1. Add the Drizzle partial unique index definition on `bookings`.
2. Hand-edit or generate SQL (`bun run db:generate`) so the migration **dedupes then creates the index**; apply with `bun run db:migrate`.
3. Domain: `ALREADY_BOOKED`, `assertValidTicketCount === 1`, uniqueness check + `23505` map, `maxBookableTickets` clamp, booked-instant helper + export.
4. Waitlist join/promote/process + admin comp always qty 1; skip `ALREADY_BOOKED`.
5. Remove qty UI; book/waitlist/comp POST 1; keep datetime select; credit total = slot × 1.
6. Update unit + integration tests (qty=4 → reject; second same-hour → `ALREADY_BOOKED`; second hour succeeds; helper returns active instants).
7. `bun run lint`, `bun run typecheck`, `cd packages/db && bun test src/booking src/waitlist src/admin`.
8. Rollback: drop the unique index; cancelled-dedupe rows stay cancelled (do not auto-uncancel). Forward-fix rather than restoring duplicate actives.

## Open Questions

- None blocking. Admin uniqueness override stays **no** (parent default). Canonical Gherkin / Playwright / `TicketCountSelect` deletion wait for steps 02–03.
