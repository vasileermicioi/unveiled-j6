## 1. Setup

- [x] 1.1 Confirm auth UI flows work end-to-end locally (`/de/login`, signup, forgot-password, Google OAuth if configured)
- [x] 1.2 Read `docs/migration/features/auth.feature` route protection and logout scenarios
- [x] 1.3 Read `docs/migration/extras/authorization-matrix.md` for role skeleton scope
- [ ] 1.4 Confirm staging Neon project has `DATABASE_URL`, `AUTH_URL`, and `SITE_URL` ready

## 2. Route protection middleware

- [x] 2.1 Create `apps/web/app/lib/auth-middleware.ts` with protected prefix list (`events`, `saved`, `bookings`, `profile`, `partner`, `admin`, `onboarding`) and role-forbidden map
- [x] 2.2 Implement path segment extraction after `/:locale/` and unauthenticated redirect to `/:locale/login`
- [x] 2.3 Implement role-based redirect skeleton (`USER` → block `/partner` and `/admin`; `PARTNER` → block `/admin`) to `/:locale`
- [x] 2.4 Wire auth middleware from `apps/web/app/routes/[locale]/_middleware.tsx` after locale validation, using `getSessionIfConfigured(c)`
- [x] 2.5 Optionally append `?returnTo=` query param on login redirect when pathname is not login/signup

## 3. Authenticated navbar and shell

- [x] 3.1 Resolve session in `_renderer.tsx` via `getSessionIfConfigured(c)` and pass to `AppShell`
- [x] 3.2 Refactor `GuestNavbar` → `AppNavbar` (or compose) with guest vs authenticated branches
- [x] 3.3 Guest branch: preserve existing nav; add login/signup links to `/:locale/login` and `/:locale/signup` (desktop + mobile drawer)
- [x] 3.4 Authenticated branch: show credits badge from `session.user.credits` (localized label); hide guest-only membership CTA where appropriate
- [x] 3.5 Add logout control wired to `signOut()` from `apps/web/app/lib/auth-client.ts` (client island if needed for interactivity)
- [x] 3.6 Update `AppShell` to accept and forward `session` prop; HeroUI-only markup throughout

## 4. Documentation and tooling

- [x] 4.1 Update `apps/web/DEPLOYMENT.md`: mark `DATABASE_URL` and `AUTH_URL` required for Phase 2 staging
- [x] 4.2 Add test-user creation steps (staging signup or Neon console) and expected starter state (17 credits, USER, INACTIVE)
- [x] 4.3 Consolidate Google OAuth Neon Auth checklist in `DEPLOYMENT.md`
- [x] 4.4 Add Phase 2 release gate verification checklist to `DEPLOYMENT.md`
- [x] 4.5 Verify `@unveiled/auth` is included in root `typecheck` (confirm `packages/auth` has `typecheck` script)

## 5. Deploy and validation

- [x] 5.1 Run `bun run lint`, `bun run typecheck`, and `bun run build`
- [x] 5.2 Verify locally: unauthenticated `/de/events` → redirect to `/de/login`
- [x] 5.3 Verify locally: signed-in USER `/de/partner` → redirect to `/de`
- [ ] 5.4 Verify locally: sign up → navbar shows credits + logout → logout → guest navbar restored
- [ ] 5.5 Configure staging env vars and deploy via existing Railway pipeline
- [ ] 5.6 On staging: password reset email and reset flow complete
- [ ] 5.7 On staging: Google sign-in establishes USER session with starter or existing state
- [ ] 5.8 On staging: `/de` and `/en` load without console errors as guest and signed-in
- [ ] 5.9 Run Phase 2 client demo script on staging; update staging URL in `DEPLOYMENT.md` when set

## 6. Cleanup

- [ ] 6.1 Mark auth-04 steps done in `.dev-plan/current-iteration/auth-parent-guide.md` (if present)
- [ ] 6.2 Archive this OpenSpec change after implementation merges
