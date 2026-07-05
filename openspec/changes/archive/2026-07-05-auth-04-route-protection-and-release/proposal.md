## Why

Auth steps 01–03 delivered the database schema, Neon Auth proxy, session layer, and HeroUI auth pages — but the app still behaves like a guest-only marketing site: protected path prefixes are not guarded, the navbar never reflects signed-in state, and logout is not exposed in the shell. Without route protection, authenticated navbar, and a Phase 2 staging release, the auth loop cannot be demoed and Phase 2 done-when criteria are not met.

## What Changes

- Extend `[locale]/_middleware.tsx` (or a dedicated `auth-middleware.ts` module) with SSR protected-route rules: unauthenticated visitors hitting member/partner/admin path prefixes redirect to `/:locale/login`; optional return URL query param.
- Guard path prefixes (routes may 404 until later phases): `/events`, `/saved`, `/bookings`, `/profile`, `/partner`, `/admin`, `/onboarding`.
- Add role-based redirect skeleton: signed-in `USER` visiting `/partner` or `/admin` redirects to `/:locale` (full authorization matrix deferred to Phase 8/9).
- Refactor navbar: SSR-load session via `getSession(c)` in the layout renderer; branch guest vs authenticated UI — credits badge placeholder (e.g. "17 credits"), user menu, logout wired to existing `signOut()` helper.
- Update `apps/web/DEPLOYMENT.md`: mark `DATABASE_URL` and `AUTH_URL` as required for Phase 2 staging; document test-user creation and Google OAuth Neon checklist.
- Deploy to staging and verify Phase 2 release gate (signup → login → authenticated navbar → logout → password reset → Google OAuth).
- Confirm `@unveiled/auth` is included in root `typecheck` filter (already via `bun run --filter '*'`).
- **Out of scope:** Onboarding redirect for incomplete users (Phase 3), full partner/admin portal routes, GDPR export/delete, Sentry/cron (Phase 9).

## Capabilities

### New Capabilities

<!-- None — route protection and navbar auth state extend existing capabilities -->

### Modified Capabilities

- `authentication`: Add requirements for protected-route redirects, role-based prefix skeleton, authenticated navbar state, logout flow, and Phase 2 release gate.
- `platform-foundation`: Extend deployment documentation requirement for Phase 2 env vars and test-user instructions; update Phase 2 package scope scenario to auth step 04 completion.

## Impact

- **Middleware:** `apps/web/app/routes/[locale]/_middleware.tsx` and/or new `apps/web/app/lib/auth-middleware.ts`.
- **Shell / navbar:** `AppShell`, `GuestNavbar` (split or extend to `AppNavbar`), `_renderer.tsx` session pass-through, optional client island for user menu drawer.
- **Auth client:** Reuse `apps/web/app/lib/auth-client.ts` `signOut()` for navbar logout.
- **Session:** `@unveiled/auth` `getSession(c)` via existing `apps/web/app/lib/auth.ts` wrapper.
- **Documentation:** `apps/web/DEPLOYMENT.md` Phase 2 staging requirements and demo script.
- **Deploy:** Staging env vars (`DATABASE_URL`, `AUTH_URL`, `SITE_URL`); Railway via existing pipeline.
- **Downstream:** Closes Phase 2; Phase 3 onboarding consumes session + `onboarding_complete`.
- **Branch:** `auth-04-route-protection-and-release` or `phase-2-auth` per iteration convention.
