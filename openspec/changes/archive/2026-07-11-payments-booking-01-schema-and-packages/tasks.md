## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/payments-booking-01-schema-and-packages.md`, parent guide non-goals, and `docs/product/database/schema-overview.md` bookings + credit_ledger + constraints sections
- [x] 1.2 Confirm `createDb` remains neon-http and note where `createTxDb` will be exported from `packages/db/src/index.ts`

## 2. Bookings and credit ledger schema

- [x] 2.1 Add `packages/db/src/schema/bookings.ts` with `booking_status` enum, table columns per schema-overview, FKs `ON DELETE RESTRICT`, unique `(user_id, idempotency_key)`, and indexes `(user_id, created_at)`, `(partner_id, created_at)`, `(event_id)`; reuse `ticket_type` for `redemption_type` if practical
- [x] 2.2 Add `packages/db/src/schema/credit-ledger.ts` with `credit_ledger_type` enum, columns per schema-overview, FK `ON DELETE RESTRICT`, partial unique on non-null `idempotency_key`, and index `(user_id, timestamp)`
- [x] 2.3 Export new schema modules from `packages/db/src/schema/index.ts` and ensure package entrypoints re-export table/enum types

## 3. Migration and transactional client

- [x] 3.1 Run `bun run db:generate`, review SQL against schema-overview (field names, constraints, indexes; confirm `events.remaining_capacity >= 0` already present), and commit migration under `packages/db/drizzle/`
- [x] 3.2 Apply migration via `bun run db:migrate` on the team Neon branch / local migrate path and confirm it succeeds
- [x] 3.3 Implement and export `createTxDb` (Pool + `drizzle-orm/neon-serverless`) beside `createDb`; export `TxDb` type; keep neon-http `createDb` unchanged for reads
- [x] 3.4 Document dual-client usage and Phase 6 tables in `packages/db/README.md`

## 4. Billing and email packages

- [x] 4.1 Scaffold `packages/billing` (`@unveiled/billing`) with `package.json`, `tsconfig.json`, `src/index.ts` typed stub exports, and `typecheck` script
- [x] 4.2 Scaffold `packages/email` (`@unveiled/email`) with the same layout and typed stub exports (no live Resend sends)
- [x] 4.3 Wire workspace resolution (`bun install` if needed); do not add booking/membership mutation routes or Stripe Checkout UI

## 5. Validation and handoff

- [x] 5.1 Add optional smoke test that schema exports include `bookings` / `creditLedger`; run `bun --filter @unveiled/db test` and ensure existing tests still pass
- [x] 5.2 Run `bun run lint` and `bun run typecheck` (including new packages) until both exit 0
- [x] 5.3 Mark step 01 done in `.dev-plan/current-iteration/payments-booking-parent-guide.md`; note any schema deviations in the handoff; do not start Stripe Checkout or `bookEvent`
