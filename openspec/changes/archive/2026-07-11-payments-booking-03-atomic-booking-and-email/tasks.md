## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/payments-booking-03-atomic-booking-and-email.md`, parent guide non-goals (waitlist deferral), `docs/product/features/booking.feature`, credits-subscription gate table, and schema “Business-critical transaction: booking”
- [x] 1.2 Confirm step 01–02 artifacts: `bookings` / `credit_ledger`, `createTxDb`, ACTIVE subscription path, stub `@unveiled/email`; note current event-detail CTA and feed `bookingComing*` placeholder
- [x] 1.3 Add email package deps (`resend` or fetch-based client), `test` scripts for `@unveiled/email` and booking suite under `@unveiled/db`; wire `apps/web` → `@unveiled/email` workspace dep

## 2. Booking domain

- [x] 2.1 Implement eligibility helpers + typed errors (`PastDue`, `Ineligible`/`Inactive`, `InsufficientCredits`, `SoldOut`, invalid qty) matching `ACTIVE`/`CANCELLED_PENDING` allow and `PAST_DUE` frozen
- [x] 2.2 Implement redemption helpers for `SECRET_CODE` (`MANUAL` / `SHARED_GENERATED` / `UNIQUE_PER_BOOKING`) and `VOUCHER` (promo + URL)
- [x] 2.3 Implement `bookEvent` atomic transaction: idempotency short-circuit → `FOR UPDATE` event (+ user) → gates → capacity/credits → decrement → redemption → `CONFIRMED` booking → `BOOKING` ledger (skip when `skipCreditCharge`) → commit
- [x] 2.4 Export booking domain from `@unveiled/db`; enforce tickets 1–3 and unique `(user_id, idempotency_key)` / ledger idempotency key behavior

## 3. Email + ICS

- [x] 3.1 Implement ICS builder (Europe/Berlin VEVENT from event fields) and DE/EN booking confirmation template builders
- [x] 3.2 Implement `sendBookingConfirmation` via Resend (`RESEND_API_KEY`, from `DAILY_CODES_FROM_EMAIL` unless a dedicated var is added); export from `@unveiled/email`
- [x] 3.3 Document post-commit send policy: log failures, do not roll back booking; list Resend env vars for step 05 `DEPLOYMENT.md`

## 4. SSR routes and CTA wiring

- [x] 4.1 Add `GET/POST /:locale/events/:id/book` — auth + subscription gates, HeroUI Select 1–3, hidden idempotency key, “SECURE RSVP // NO REFUNDS”, POST → `bookEvent` then redirect to confirm; error Alerts for credits/sold-out/past-due (no waitlist)
- [x] 4.2 Add `GET /:locale/events/:id/book/confirm` — ownership-checked redemption display, copy affordance, ICS download, `support@unveiled.berlin`; invoke confirmation email after successful book POST
- [x] 4.3 Wire event detail book CTA for eligible signed-in members; update feed to drop `bookingComing*` for active/eligible members; HeroUI-only markup, theme tokens, yellow backdrop

## 5. Tests, validation, handoff

- [x] 5.1 Add domain tests: success, insufficient credits (capacity unchanged), sold-out, PAST_DUE, idempotent retry; email unit tests for template/ICS without live Resend
- [x] 5.2 Run package booking/email tests, `bun run lint`, and `bun run typecheck` until all exit 0
- [x] 5.3 Confirm no waitlist UI, `/bookings` list, Ladle, or Playwright were added; mark step 03 done in `payments-booking-parent-guide.md`
