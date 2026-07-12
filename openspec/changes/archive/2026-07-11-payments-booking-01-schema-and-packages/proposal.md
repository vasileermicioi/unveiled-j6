## Why

Phase 6 payments and booking need `bookings` and `credit_ledger` tables plus a Drizzle client that can run multi-statement transactions with `SELECT FOR UPDATE`. Today `@unveiled/db` only has neon-http `createDb` (no booking/ledger schema), and `@unveiled/billing` / `@unveiled/email` do not exist — later Stripe and atomic-booking steps would otherwise invent tables and package shells mid-flight.

## What Changes

- Add Drizzle schema for `public.bookings` and `public.credit_ledger` (enums, FKs `ON DELETE RESTRICT`, unique idempotency constraints, indexes per `docs/product/database/schema-overview.md`)
- Generate and commit migration SQL under `packages/db/drizzle/`; confirm `events.remaining_capacity >= 0` (already present) and related checks
- Export a **transactional** DB factory beside `createDb` (Pool / WebSocket + Drizzle transaction API) for booking and webhook ledger writes; keep neon-http for read-heavy paths
- Scaffold `@unveiled/billing` and `@unveiled/email` workspace packages with typed public exports (stubs OK), `typecheck` scripts, and root workspace resolution
- Wire workspace deps only as needed to compile — **no** Stripe Checkout, webhooks, booking domain, booking pages, or Resend sends in this step

## Capabilities

### New Capabilities

- `booking`: Persist event bookings in `public.bookings` with idempotency uniqueness, and provide a transactional Drizzle client suitable for row-locked booking writes
- `credits-subscription`: Persist credit movements in `public.credit_ledger` with typed ledger enums and unique non-null `idempotency_key`

### Modified Capabilities

- _(none)_ — product behavior for Checkout, atomic `bookEvent`, and email sends lands in later `payments-booking-0N` steps; this step only adds persistence + package shells

## Impact

- **Code:** `packages/db` (schema, migration, transactional client); new `packages/billing/` and `packages/email/`; root / `apps/web` workspace deps only if required for typecheck
- **Database:** new tables/enums/indexes/constraints on Neon `public` schema; no `neon_auth` modeling
- **Downstream:** Consumed by `payments-booking-02-stripe-checkout-and-webhooks` and `payments-booking-03-atomic-booking-and-email`
- **Docs:** optional `@unveiled/db` README note for the transactional client; mark step 01 done in `payments-booking-parent-guide.md` after apply
- **Out of scope:** Stripe API, webhook route, membership UI, `bookEvent`, booking pages, Resend, waitlist usage, admin cancel/comp, Playwright, Ladle
