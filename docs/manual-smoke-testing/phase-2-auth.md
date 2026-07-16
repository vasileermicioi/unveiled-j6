# Phase 2 — Manual smoke test

Neon Auth + session guards. Client demo: *Sign up, see credits in the navbar, log out — member routes stay locked for guests.*

**Do not start Phase 3 onboarding checks beyond “lands on age step”** unless that phase is already deployed.

## Setup

1. App running with `DATABASE_URL`, `AUTH_URL`, `SITE_URL`.
2. Neon Auth trusted domain includes the browser origin (exact URL, no trailing slash).
3. Optional: Google OAuth enabled in Neon Auth project settings.

---

## A. Signup & session

1. Open `/de/signup` (and `/en/signup`) — HeroUI auth forms on yellow background.
2. Register with email/password + first/last name → session created.
3. Navbar shows credits badge (17 starter) and logout; guest login/signup links gone.
4. Starter state (Neon / app): `role=USER`, `credits=17`, subscription `INACTIVE`, `onboarding_complete=false`.

## B. Login / logout

1. Log out → guest navbar (login + signup).
2. `/de/login` → sign in again → authenticated shell.
3. Optional: **Continue with Google** completes and provisions a `USER`.

## C. Password reset (optional)

1. `/forgot-password` → submit email → reset email arrives (when provider configured).
2. Open reset link → `/reset-password` completes → can sign in with new password.

## D. Route protection

1. Guest opens `/de/events` or `/en/profile` → redirect to `/:locale/login` (with return path when applicable).
2. Signed-in `USER` opens `/de/admin` → redirect away (not admin UI).
3. `curl -s $SITE_URL/api/auth/get-session` returns Better Auth JSON (not HTML 404).

## E. Quick negatives (optional)

- No self-service `ADMIN` signup.
- Sign-out from a signed-in session must not 403 `INVALID_ORIGIN` (trusted domains).
- Yellow background; `@better-auth-ui/heroui` only (no shadcn auth).

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 2 release gate, Demo accounts, Admin account setup
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Baseline Phase 2
- `docs/product/features/auth.feature`
- `docs/product/extras/authorization-matrix.md`
