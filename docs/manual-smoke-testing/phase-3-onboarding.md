# Phase 3 — Manual smoke test

Four-step onboarding wizard. Client demo: *After signup, we capture vibes, districts, and timing — same as the product vision.*

**Do not expect Stripe Checkout or booking** — membership page may be marketing-only until Phase 6.

## Setup

1. Phase 2 auth working (`DATABASE_URL`, `AUTH_URL`, `SITE_URL`).
2. Fresh signup (or reset an existing test user’s onboarding — see `DEPLOYMENT.md` § Repeat demo reset).
3. Prefer a new email each client demo.

---

## A. Happy path (all four steps)

1. Sign up → land on `/onboarding/age` (or resumed current step).
2. **Age** — pick a group (e.g. `26-35`) → continue **or** skip without selecting.
3. **Interests** — at least one interest + mood → `/onboarding/location`.
4. **Location** — districts + travel radius (1–25 km) → `/onboarding/timing`.
5. **Timing** — timing, preferred days, languages, accessibility → submit → `/membership`.
6. Confirm `onboarding_complete=true` and profile fields populated (Neon `public.users.profile` if checking DB).

## B. Guards

1. Incomplete USER hitting `/events`, `/saved`, `/bookings`, or `/profile` → redirected to current onboarding step.
2. Complete USER opening `/onboarding/*` → redirected out (e.g. `/events`).
3. Onboarding pages are `noindex`; `robots.txt` disallows `/*/onboarding/`.

## C. Locale

1. Repeat a short path on `/en/onboarding/...` — same steps, English UI, no console errors.

## D. Quick negatives (optional)

- Cannot skip interests/location/timing without required selections (age skip is allowed).
- ADMIN/PARTNER are never forced into the wizard.
- Yellow background; Select-based choices (no radios/checkboxes).

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 3 release gate
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Baseline Phase 3
- `docs/product/features/onboarding.feature` (if present) / `auth.feature`
- `docs/product/sitemap/sitemap.md` — Onboarding routes
