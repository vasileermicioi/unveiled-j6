## Why

Steps 01–02 landed bookings/ledger schema, `createTxDb`, Stripe Checkout, and an `ACTIVE` subscription path, but members still cannot spend credits: there is no atomic `bookEvent`, no SSR book/confirm routes, and `@unveiled/email` is a stub. Without this slice, the Phase 6 “ticket out” half of the product loop stays closed.

## What Changes

- Implement Booking-domain `bookEvent` in a single Postgres transaction (`SELECT FOR UPDATE` on event, and user as needed): subscription eligibility → capacity ≥ qty → credits ≥ price×qty → decrement capacity + credits → generate redemption → insert `CONFIRMED` booking → insert negative `BOOKING` ledger (unless `skipCreditCharge`) → commit
- Enforce idempotency via unique `(user_id, idempotency_key)`; retries return the original booking/redemption without mutating again
- Add redemption helpers for `SECRET_CODE` modes (`MANUAL` / `SHARED_GENERATED` / `UNIQUE_PER_BOOKING`) and `VOUCHER` (promo + partner URL)
- Add locale-prefixed SSR routes `GET/POST /:locale/events/:id/book` (qty 1–3 via HeroUI Select; “SECURE RSVP // NO REFUNDS”) and `GET /:locale/events/:id/book/confirm` (redemption, copy, ICS, support)
- Gate: unauthenticated → sign-in; `INACTIVE`/`UNPAID` → `/membership`; `PAST_DUE` → frozen message; `ACTIVE`/`CANCELLED_PENDING` allowed
- Implement `@unveiled/email` booking confirmation (DE/EN as available) via Resend with `.ics` attachment; send after successful commit (log failures; document retry policy)
- Wire event-detail book CTA to the new book route; sold-out rejects with capacity error — **no** waitlist join UI
- Domain + email package tests (concurrency/capacity/credits/idempotency; template/ICS without live Resend)

## Capabilities

### New Capabilities

- _(none)_ — atomic booking, confirm surfaces, and confirmation email extend the existing `booking` capability

### Modified Capabilities

- `booking`: Atomic `bookEvent` transaction + subscription gate + redemption generation; SSR book/confirm pages; Resend confirmation email with ICS; Phase 6 sold-out without waitlist

## Impact

- **Code:** `packages/db` booking domain (or thin orchestration from `apps/web` calling db + email); `packages/email` Resend + ICS; `apps/web` book + confirm routes; event detail CTA wiring
- **Deps:** `resend` (or fetch to Resend API) in `@unveiled/email`; `apps/web` depends on `@unveiled/email` + booking domain exports
- **Env:** `RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL` (or booking-from alias per config) — handoff notes for step 05 `DEPLOYMENT.md`
- **Downstream:** Consumed by `payments-booking-04` (bookings list / Ladle) and `payments-booking-05` (Playwright + release)
- **Out of scope:** `/bookings` list pagination, Ladle, Playwright, waitlist, admin cancel/comp UI, Customer Portal, member self-cancel/refund
