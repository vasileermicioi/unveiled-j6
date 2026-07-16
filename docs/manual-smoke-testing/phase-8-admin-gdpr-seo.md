# Phase 8 — Manual smoke test

Admin Membership HQ, GDPR, SEO polish. Client demo: *Production-ready member MVP — admin support tools, GDPR, SEO, monitoring.*

**Partner portal / venue check-in stay post-MVP** — do not require `/partner/*`.

## Setup

1. Phase 7 complete (waitlist + profile/billing).
2. Admin account (`E2E_ADMIN_*` or promoted user).
3. At least one ACTIVE member, one WAITING waitlist entry (sold-out seed), and one confirmed booking for cancel/comp demos.
4. Optional: `SENTRY_DSN` on staging; disposable member for delete-account.

**Sold-out seed:** `Sold Out: Waitlist Demo Night` (`DEMO_DISCOVERY_TITLES.soldOutWaitlist`).

---

## A. Admin users HQ

1. Admin → **Mitglieder / Users** (`/admin/users`) → search by email → open detail.
2. **Adjust credits** (+ reason) → balance / ledger updates.
3. **Freeze** ACTIVE → `UNPAID`; **unfreeze** → `ACTIVE` (Stripe past-due is separate — next webhook may re-freeze).
4. **Comp ticket** for an upcoming event → confirmed booking; member credits unchanged.
5. From member detail, **cancel booking** (+ reason) → `CANCELLED`; credits unchanged.

## B. Admin waitlist

1. `/admin/waitlist` — see WAITING entries for the sold-out demo event.
2. **Promote** one entry when capacity allows → member gets a ticket (same booking path).
3. Confirm member `/bookings` shows the promoted ticket.

## C. GDPR

1. Member → Profile → **Export data** (`/profile/data-export`) → download JSON (profile + bookings + ledger).
2. Disposable member → **Delete account** → confirm → signed out; old credentials fail.
3. Admin → user detail → **Delete account** → member gone from list; bookings/ledger retained under anonymized id.

## D. SEO & errors

1. `/sitemap.xml` includes marketing locales + bookable public event URLs.
2. Sold-out / past public detail: `noindex` (View Source / response headers as implemented).
3. FAQ surfaces FAQPage JSON-LD where specified.
4. Spot-check branded 404; optional local 500 smoke only with `ENABLE_ERROR_SMOKE=1` → `GET /api/health/error` (never leave on production).
5. Marketing copy: credits do **not** roll over.

## E. Quick negatives (optional)

- Non-ADMIN visiting `/admin/*` is redirected (no partner portal leak).
- No daily partner redemption-codes cron / QR check-in.
- Yellow background; SSR mutation pages for admin actions (no client-only modals).

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 8, GDPR, cutover checklist
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Phase 8
- `docs/product/features/admin-users.feature`, `auth.feature` (GDPR)
- `docs/product/extras/seo-and-metadata.md`
- `docs/product/extras/authorization-matrix.md`
