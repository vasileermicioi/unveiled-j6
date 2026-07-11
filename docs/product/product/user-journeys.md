# End-to-End User Journeys (MVP)

The Gherkin files under `../features/` describe each domain in isolation. This document threads them into complete journeys for **guest**, **member (`USER`)**, and **admin** — the MVP personas. Partner portal and check-in live in the **Post-MVP** section only.

Each step names the feature file it belongs to. Align routes with [`../sitemap/sitemap.md`](../sitemap/sitemap.md).

---

## Classification appendix (migration → product)

| Migration feature | Action | Product path |
|---|---|---|
| `static-pages.feature` | Rewrite | `features/static-pages.feature` |
| `auth.feature` | Port + trim PARTNER portal emphasis | `features/auth.feature` |
| `onboarding.feature` | Port (Select wording) | `features/onboarding.feature` |
| `event-discovery.feature` | Rewrite (public detail + Discover home) | `features/event-discovery.feature` |
| `admin-events.feature` | Port | `features/admin-events.feature` |
| `admin-partners.feature` | Rewrite (venue CRUD only) | `features/admin-partners.feature` |
| `admin-users.feature` | Port | `features/admin-users.feature` |
| `booking.feature` | Port | `features/booking.feature` |
| `credits-subscription.feature` | Port | `features/credits-subscription.feature` |
| `waitlist.feature` | Port + trim partner visibility | `features/waitlist.feature` |
| `profile.feature` | Port | `features/profile.feature` |
| `partner-portal.feature` | Post-MVP | `features/post-mvp/partner-and-checkin.feature` |
| `checkin.feature` | Post-MVP | `features/post-mvp/partner-and-checkin.feature` |

---

## Journey 1: Guest → active, booking member

1. **Discover** — Guest lands on locale home `/:locale` (Discover: marketing + curated upcoming preview). May browse `/how-it-works`, `/faq`, `/membership`. Legacy `/:locale/discover` 301s to home. *(Content → `static-pages.feature`)*
2. **Public detail** — Preview cards link to public `/events/:id` (no auth). Guest can read details and share; book/save CTAs require auth. *(Discovery → `event-discovery.feature`)*
3. **Sign up** — Guest signs up (email/password or Google). Account = `USER`, 17 credits, subscription `INACTIVE`, onboarding incomplete. *(Identity → `auth.feature`)*
4. **Onboarding** — 4-step preference wizard (age → interests/moods → districts/radius → timing/days/languages/accessibility). *(→ `onboarding.feature`)*
5. **Checkout** — Routed to `/membership`, completes real Stripe Checkout (Basic Berlin). Subscription → `ACTIVE`, ledger `+17 SUBSCRIPTION_REFILL`. *(→ `credits-subscription.feature`)*
6. **Browse & filter** — Lands on member `/events` (filters, pagination, map, saved). Guests never get a public full feed. *(→ `event-discovery.feature`)*
7. **Book** — Opens `/events/:id/book`, books tickets. Atomic transaction: subscription + capacity + credits; `CONFIRMED` booking + redemption info. *(→ `booking.feature`)*
8. **Pre-event** — Views `/bookings` (My Tickets), downloads `.ics`, copies redemption code; confirmation email received. *(→ `booking.feature`)*
9. **Repeat** — Monthly renewal resets credits to 17 (no rollover). Cycle from step 6.

**Cross-domain risk:** booking must not succeed without an active (or `CANCELLED_PENDING`) subscription — enforced inside the booking transaction, not a stale page-load check.

**Note:** Door check-in is **post-MVP** (see below). MVP members redeem via secret code / voucher info shown in-app and email.

---

## Journey 2: Sold-out event → waitlist → promotion

1. Member tries to book with insufficient remaining capacity. *(→ `booking.feature`)*
2. Offered waitlist; joins with requested quantity, status `WAITING`. *(→ `waitlist.feature`)*
3. Capacity frees (admin cancels a booking or raises total capacity). *(→ `booking.feature` / `admin-events.feature`)*
4. Waitlist processing promotes the earliest eligible `WAITING` entry through the **same** booking transaction (re-checks subscription + credits). *(→ `waitlist.feature`)*
5. On success: entry `PROMOTED`, `CONFIRMED` booking + email. On ineligibility: skip and try next in queue.
6. Rejoins Journey 1 at pre-event.

**Cross-domain risk:** promotion must call Booking’s transaction — never duplicate booking logic.

---

## Journey 3: Payment failure → recovery

1. Renewal payment fails → subscription `PAST_DUE`. *(→ `credits-subscription.feature`)*
2. Booking blocked with “credits frozen, update payment” (distinct from inactive “subscription required”). *(→ `booking.feature`)*
3. Member updates payment via Stripe Customer Portal from `/profile/billing`. *(→ `profile.feature` / `credits-subscription.feature`)*
4. Successful retry → `ACTIVE`; refills resume next cycle.
5. **Parallel admin path:** admin may freeze to `UNPAID` / unfreeze independently of Stripe `PAST_DUE`. *(→ `admin-users.feature`)*

---

## Journey 4: Cancellation and account deletion

1. Member cancels from `/profile/billing` → `CANCELLED_PENDING`; access until period end. *(→ `credits-subscription.feature`)*
2. Period end webhook → `INACTIVE`; unused credits forfeited (`EXPIRY` ledger).
3. Independently, member may request GDPR deletion from `/profile/delete-account` or data export from `/profile/data-export`. *(→ `auth.feature`)*
4. Deletion anonymizes PII; retains anonymized transactional records per German retention rules. Cancellation alone does not delete the account.

---

## Journey 5: Admin catalog and support

1. Admin creates **venue** (partner) records and events under `/admin/partners`, `/admin/events`. *(→ `admin-partners.feature`, `admin-events.feature`)*
2. Member emails support. Admin searches `/admin/users`, opens member detail. *(→ `admin-users.feature`)*
3. Admin may adjust credits, freeze/unfreeze, issue comp ticket, cancel a booking (triggers waitlist), or issue a manual `REFUND` ledger entry. *(→ `admin-users.feature`, `booking.feature`, `credits-subscription.feature`, `waitlist.feature`)*
4. Admin may process account deletion on a member’s behalf. *(→ `auth.feature`)*

**Not in this journey (post-MVP):** portal-access provisioning, venue check-in QR, partner self-service events, door check-in UI.

---

## Post-MVP: Partner onboarding, portal, and check-in

> **Not in MVP.** Specs parked under `features/post-mvp/partner-and-checkin.feature`. Do not implement in `IMPLEMENTATION-PLAN.mvp.md` phases.

1. Admin creates a partner record; venue check-in token generated. *(Admin → post-mvp)*
2. Admin creates portal access → `PARTNER` account linked via `partnerId`. *(post-mvp)*
3. Partner logs in → `/partner` (skips member onboarding). *(post-mvp)*
4. Partner CRUD on own events (same validation as admin, scoped by `partnerId`). *(post-mvp)*
5. Admin retains cross-partner override. *(→ `admin-events.feature` remains true in MVP)*
6. Partner guest list + manual check-in; guest self-check-in via venue QR. *(post-mvp)*
7. Partner exports guest codes. *(post-mvp)*

**Cross-domain risk (when built):** partner event validation must share admin event creation logic — one capability, two auth contexts.
