# Phase 6 — Manual smoke test

Stripe Checkout + atomic booking. Client demo: *Full member loop: subscribe with test card, spend credits, get your door code.*

**Do not start Phase 7** (waitlist, profile billing portal, cancel-at-period-end UI).

## Setup

1. Phase 5.5 done (or only named deferrals). Stripe **test** keys + Resend on local/staging.
2. Local webhook forward: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (match `STRIPE_WEBHOOK_SECRET`).
3. Fresh signup (INACTIVE + 17 starter credits) **or** existing ACTIVE member for booking-only checks.
4. Seeded upcoming event with capacity (`bun run seed:demo` if needed).

**Test card:** `4242 4242 4242 4242` — any future expiry, any CVC, any postal code.

---

## A. Subscribe (Checkout)

1. Sign up → complete onboarding → land on `/membership`.
2. Start Checkout → pay with `4242…`.
3. After webhook: subscription `ACTIVE`; credits refilled to 17 (or plan amount).
4. Navbar / membership reflects active state.

## B. Book

1. As ACTIVE member, open an upcoming seeded event → **Tickets buchen** / book.
2. Choose ticket count → confirm → atomic booking succeeds.
3. Confirm page shows redemption / door code + copy + `.ics` download.
4. `/bookings` lists the ticket with the code.

## C. Email (optional but preferred)

1. With `RESEND_API_KEY` + `DAILY_CODES_FROM_EMAIL` set → booking confirmation in Resend dashboard.
2. Attachment includes `.ics`. Send failure must not undo the booking if you re-test edge cases later.

## D. Gates

1. `INACTIVE` member trying to book → blocked / sent toward membership (no ticket).
2. Optional: `PAST_DUE` shows frozen messaging (Customer Portal recovery is Phase 7).

## E. Quick negatives (optional)

- Guest cannot complete book POST.
- Sold-out waitlist UX is Phase 7 — do not require it here.
- Yellow background; no partner check-in.

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 6 (Stripe + Resend, staging smoke)
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Phase 6
- `packages/billing/README.md`
- `docs/product/features/credits-subscription.feature`, `booking.feature`
- `e2e/README.md` — Stripe / payments policy
