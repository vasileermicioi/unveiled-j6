## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/admin-ops-02-capacity-ops-domain.md`, parent guide release criteria, and admin cancel / waitlist / comp scenarios in `booking.feature`, `waitlist.feature`, `credits-subscription.feature`
- [x] 1.2 Confirm step-01 admin exports exist and Phase 7 modules are available (`bookEvent` + `skipCreditCharge`, `promoteWaitlistEntry`, `processWaitlistForEvent`, bookings / waitlist schema)

## 2. Admin cancel booking (`@unveiled/db`)

- [x] 2.1 Extend admin errors with capacity-ops codes (`BOOKING_NOT_FOUND`, `NOT_CONFIRMED`, `INVALID_REASON`) or add a dedicated error type; rethrow `BookingError` / `WaitlistError` from wrappers where appropriate
- [x] 2.2 Implement `cancelBookingAsAdmin` — lock confirmed booking → `CANCELLED` with reason + `cancelledAt`; restore event `remainingCapacity` by ticket count; **no** credit change or ledger write; after commit call `processWaitlistForEvent`
- [x] 2.3 Export cancel from `packages/db/src/admin/index.ts` and `@unveiled/db`

## 3. Admin waitlist list and promote (`@unveiled/db`)

- [x] 3.1 Implement `listAdminWaitlistEntries` — optional `eventId` / `status` filters, `limit`/`offset` (default 25), include `skippedOnce`, stable order by `created_at` then `id`
- [x] 3.2 Implement `promoteWaitlistEntryAsAdmin` as a thin wrapper around existing `promoteWaitlistEntry`
- [x] 3.3 Export list + promote wrapper from admin module and `@unveiled/db`

## 4. Comp ticket helper (`@unveiled/db`)

- [x] 4.1 Implement `createCompTicket` — call `bookEvent` with `skipCreditCharge: true`, require idempotency key, default `ticketsCount` to 1; inherit capacity + eligibility from booking path
- [x] 4.2 Export `createCompTicket` from admin module and `@unveiled/db`

## 5. Tests

- [x] 5.1 Add unit/integration tests: cancel confirmed restores capacity and leaves credits/ledger unchanged; reject non-`CONFIRMED`; empty reason rejected
- [x] 5.2 Add tests: waitlist list filters + skip history; manual promote happy path; comp creates confirmed booking with no charge ledger / unchanged credits; sold-out comp rejects
- [x] 5.3 Skip integration cleanly when `DATABASE_URL` unset; confirm no route/UI/Ladle/Playwright/GDPR files were added in this step

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.2 Run targeted `bun test` for cancel/promote/comp modules — pass or skip cleanly without Stripe/network
- [x] 6.3 Mark step 02 done in `admin-ops-parent-guide.md`; update `docs/product/` only if behavior diverged; note seed fixtures useful for step 05 (sold-out event, confirmed booking, waiting entry)
