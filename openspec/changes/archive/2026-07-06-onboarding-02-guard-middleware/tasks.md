## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/onboarding-02-guard-middleware.md`, `proposal.md`, `design.md`, and delta specs under `specs/`
- [x] 1.2 Confirm step 01 deliverables: `getOnboardingStepPath` exported from `@unveiled/auth` and covered by unit tests
- [x] 1.3 Read `docs/migration/features/onboarding.feature` redirect scenarios and `docs/migration/sitemap/sitemap.md` member prefixes
- [x] 1.4 Review existing `apps/web/app/lib/auth-middleware.ts` and `[locale]/_middleware.tsx` integration points

## 2. Session extension

- [x] 2.1 Extend `SessionUser` in `packages/auth/src/types.ts` with `profile: UserProfile` and `behavior: UserBehavior` (default `{}`)
- [x] 2.2 Update `toSessionUser()` in `packages/auth/src/session.ts` to populate profile and behavior from the loaded `users` row
- [x] 2.3 Update any test fixtures in `apps/web` and `packages/auth` that construct `AppSession` objects

## 3. Onboarding middleware module

- [x] 3.1 Create `apps/web/app/lib/onboarding-middleware.ts` with `MEMBER_APP_PREFIXES`, `evaluateOnboardingRedirect`, and reuse of `getLocalePathSegment` / `isAuthConfigured`
- [x] 3.2 Implement incomplete USER rule: member app prefixes → `/${locale}${getOnboardingStepPath(profile, behavior)}`
- [x] 3.3 Implement complete USER rule: `/onboarding/*` → `/${locale}/events`
- [x] 3.4 Implement PARTNER/ADMIN rule: `/onboarding/*` → `/${locale}`; no onboarding redirects on other paths
- [x] 3.5 Ensure `/membership` and public marketing routes return `null` for incomplete USERs
- [x] 3.6 Return `null` when auth env is not configured (mirror auth middleware dev behavior)

## 4. Middleware integration

- [x] 4.1 Wire `evaluateOnboardingRedirect` into `apps/web/app/routes/[locale]/_middleware.tsx` after `evaluateAuthRedirect`, only when `session` is non-null
- [x] 4.2 Preserve existing locale validation and auth redirect behavior (no regression)

## 5. Tests

- [x] 5.1 Create `apps/web/app/lib/onboarding-middleware.test.ts` with session fixtures for USER incomplete, USER complete, PARTNER, and ADMIN
- [x] 5.2 Test incomplete USER blocked from `events`, `saved`, `bookings`, `profile` with default and resumed step paths
- [x] 5.3 Test incomplete USER allowed on `/membership` and public paths (e.g. `/discover`)
- [x] 5.4 Test complete USER redirected from `/onboarding/age` (and nested onboarding paths) to `/events`
- [x] 5.5 Test PARTNER/ADMIN redirected from `/onboarding/*` to locale home; not redirected on member prefixes
- [x] 5.6 Run `cd apps/web && bun test app/lib/onboarding-middleware.test.ts app/lib/auth-middleware.test.ts` — all pass

## 6. Validation

- [x] 6.1 Run `bun run typecheck` — passes across workspaces
- [x] 6.2 Run `bun run lint` — passes
- [x] 6.3 Manual check (with `DATABASE_URL` + session): incomplete USER GET `/de/events` → 302 to `/de/onboarding/age`; complete USER GET `/de/onboarding/age` → 302 to `/de/events` (covered by unit tests; staging manual check pending deploy)

## 7. Wrap-up

- [x] 7.1 Mark step 02 done in `onboarding-parent-guide.md` when change is archived (file not present — skipped)
- [x] 7.2 Hand off to `onboarding-03-wizard-pages`
