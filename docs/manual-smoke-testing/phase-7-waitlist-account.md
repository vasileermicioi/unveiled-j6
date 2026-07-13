# Phase 7 — Manual smoke test

Waitlist + member account. Client demo: *Sold out? Join the waitlist. Manage subscription and preferences in profile.*

**Do not start Phase 8** (admin waitlist HQ, GDPR page mechanics, SEO polish).

## Setup

1. App running (`bun run dev` or staging) with seed data (`bun run seed:demo` if the catalog is empty).
2. Active member (Stripe Checkout with `4242 4242 4242 4242`, or subscription already `ACTIVE`).
3. Admin account for the capacity bump.
4. Optional: Stripe Customer Portal enabled in Dashboard (payment method + billing address; cancellation **at period end**). See `packages/billing/README.md` and `apps/web/DEPLOYMENT.md` § Phase 7.

**Sold-out demo event:** `Sold Out: Waitlist Demo Night` (`DEMO_DISCOVERY_TITLES.soldOutWaitlist`). Promotion trigger: admin edit → raise **Kapazität** → `processWaitlistForEvent`.

---

## A. Waitlist (core)

1. Open **Sold Out: Waitlist Demo Night** (guest or member) — sold-out / waitlist CTA visible.
2. As guest, open waitlist → redirect to login with return path.
3. As active member → **Auf die Warteliste** / **Join waitlist** → pick tickets → confirm **WAITING**.
4. Open the waitlist URL again → “already on waitlist” (no duplicate entry).
5. Cancel entry → confirm → cancelled; re-join if you need a clean promote path.

## B. Auto-promotion

1. Member has a **WAITING** entry for that event.
2. Admin → edit event → raise **Kapazität** by 1 → save.
3. Member → `/bookings` → ticket for that event.
4. If Resend is configured → promotion email in the dashboard (send failure must not undo the booking).

## C. Profile

1. `/profile` — credit wallet visible; **Credits aufladen** / **Refill** → `/membership`.
2. Edit first name / last name / email → save → success.
3. Vibes / preferences → save → success.
4. **Passwort ändern** / **Change password** → security / auth UI loads (completing the password change is optional).
5. GDPR links (export / delete) are visible; full page mechanics are Phase 8.

## D. Billing

1. `/profile/billing` — plan, status, period end.
2. **Zahlung & Adresse aktualisieren** / portal CTA → Stripe Customer Portal (real `cus_*`) or a clear error if not linked.
3. **Abo kündigen** / cancel → confirm → `CANCELLED_PENDING`; still bookable until period end.
4. With `INACTIVE` → Membership CTA → Checkout.

## E. Quick negatives (optional)

- Sold-out book path offers waitlist; no booking is created.
- `PAST_DUE` on billing shows recovery messaging + portal CTA.
- Yellow page background app-wide.
- No Phase 8 admin waitlist HQ or manual promote UI.

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 7 section
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Phase 7 done-when
- `.dev-plan/current-iteration/waitlist-account-parent-guide.md`
- `docs/product/features/waitlist.feature`, `profile.feature`, `credits-subscription.feature`
